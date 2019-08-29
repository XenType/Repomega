import { OmegaObjectData } from '.';
import { IOmegaRepository } from '../repository';
import { OmegaTableMap, OmegaField } from '../mapper';
import { throwAssociationError, ErrorSource, ErrorSuffix } from '../common';
import { OmegaLinkPath } from '../mapper';
import { OmegaCriteria, OmegaCriterionLinkTable } from '../dal';
import { cloneDeep } from 'lodash';
import { start } from 'repl';
let sourceRepo: IOmegaRepository;

export class OmegaObject {
    public tableMap: OmegaTableMap;
    public objectSource: string;
    public objectData: OmegaObjectData;
    constructor(_sourceRepository: IOmegaRepository) {
        sourceRepo = _sourceRepository;
        this.objectData = {};
    }
    public async save(): Promise<void> {
        this.initTableMap();
        const savedObjects = await sourceRepo.persist([this], true);
        this.objectData = savedObjects[0].objectData;
        return;
    }
    public async validatePassword(mapField: OmegaField, password: string): Promise<boolean> {
        return false;
    }
    public async modifyInternalField(mapField: OmegaField, value: string): Promise<boolean> {
        return false;
    }
    public async retrieveParentObject(parent: string): Promise<OmegaObject> {
        this.initTableMap();
        this.verifyChildAssociation(parent, this.objectSource);
        const sortedMap = this.getChildAssociationMap(parent, this.objectSource, true);
        return this.retrieveOneToOne(parent, sortedMap, true);
    }
    public async retrieveChildObjects(child: string): Promise<OmegaObject[]> {
        this.initTableMap();
        this.verifyChildAssociation(this.objectSource, child);
        const sortedMap = this.getChildAssociationMap(this.objectSource, child);
        return this.retrieveOneToMany(child, sortedMap);
    }
    public async retrieveLateralObjects(target: string): Promise<OmegaObject[]> {
        this.initTableMap();
        this.verifyLateralAssociation(target);
        const sortedMap = this.getLateralAssociationMap(target);
        return this.retrieveOneToMany(target, sortedMap);
    }
    public async createLateralLink(target: string, objectId: string | number): Promise<void> {
        this.initTableMap();
        return null;
    }
    public async deleteLateralLink(target: string, objectId: string | number): Promise<void> {
        this.initTableMap();
        return null;
    }
    private initTableMap(): void {
        if (!this.tableMap) {
            this.tableMap = sourceRepo.getTableMap(this.objectSource);
        }
    }
    private verifyChildAssociation(parent: string, child: string): void | never {
        const { childAssociations } = sourceRepo.getTableMap(parent);
        if (!childAssociations[child]) {
            throwAssociationError(
                ErrorSource.PARENT_ASSOCIATION_ERROR,
                parent,
                ErrorSuffix.NO_CHILD_ASSOCIATION,
                child
            );
        }
        return;
    }
    private verifyLateralAssociation(target: string): void | never {
        const { lateralAssociations } = this.tableMap;
        if (!lateralAssociations || !lateralAssociations[target]) {
            throwAssociationError(
                ErrorSource.LATERAL_ASSOCIATION_ERROR,
                this.objectSource,
                ErrorSuffix.NO_TARGET_ASSOCIATION,
                target
            );
        }
        return;
    }
    private getLateralAssociationMap(target: string): OmegaLinkPath[] {
        const associationMap = this.tableMap.lateralAssociations[target];
        const sortedMap = associationMap.sort((a: OmegaLinkPath, b: OmegaLinkPath) => {
            return a.sequence - b.sequence;
        });
        return sortedMap;
    }
    private getChildAssociationMap(parent: string, child: string, reversePath?: boolean): OmegaLinkPath[] {
        const { childAssociations } = sourceRepo.getTableMap(parent);
        const associationMap = childAssociations[child];
        const sortedMap = associationMap.sort((a: OmegaLinkPath, b: OmegaLinkPath) => {
            return reversePath ? a.sequence - b.sequence : b.sequence - a.sequence;
        });
        return sortedMap;
    }
    private async retrieveOneToOne(
        target: string,
        sortedMap: OmegaLinkPath[],
        reversePath?: boolean
    ): Promise<OmegaObject> {
        const results = await this.retrieveOneToMany(target, sortedMap, reversePath);
        const result = results[0] ? results[0] : null;
        return result;
    }
    private async retrieveOneToMany(
        target: string,
        sortedMap: OmegaLinkPath[],
        reversePath?: boolean
    ): Promise<OmegaObject[]> {
        const criteria = this.buildOmegaCriteria(sortedMap, reversePath);
        const results = await sourceRepo.retrieveMany(target, criteria);
        return results;
    }
    private buildOmegaCriteria(sortedMap: OmegaLinkPath[], reversePath?: boolean): OmegaCriteria {
        let criteria: OmegaCriteria;
        for (const linkPath of sortedMap) {
            if (!criteria) {
                criteria = this.buildDirectLinkCriteria(linkPath, reversePath);
            } else {
                criteria = this.buildIndirectLinkCriteria(linkPath, criteria, reversePath);
            }
        }
        return criteria;
    }
    private buildDirectLinkCriteria(linkPath: OmegaLinkPath, reversePath?: boolean): OmegaCriteria {
        const field = reversePath ? linkPath.sourceId : linkPath.targetId;
        const value = reversePath ? this.objectData[linkPath.targetId] : this.objectData[linkPath.sourceId];
        return this.buildStandardCriteria(field, value);
    }
    private buildIndirectLinkCriteria(
        linkPath: OmegaLinkPath,
        criteria: OmegaCriteria | undefined,
        reversePath?: boolean
    ): OmegaCriteria {
        const parentCriteria = this.buildBaseLinkCriteria(linkPath, reversePath) as OmegaCriteria;
        (parentCriteria._and[0] as OmegaCriterionLinkTable).criteria = cloneDeep(criteria);
        return parentCriteria;
    }
    private buildBaseLinkCriteria(linkPath: OmegaLinkPath, reversePath?: boolean): OmegaCriteria {
        const sourceField = reversePath ? linkPath.sourceId : linkPath.targetId;
        const targetTable = reversePath ? linkPath.targetTable : linkPath.sourceTable;
        const targetField = reversePath ? linkPath.targetId : linkPath.sourceId;
        const linkCriteria = { sourceField, targetTable, targetField, criteria: {} };
        return { _and: [linkCriteria] };
    }
    private buildStandardCriteria(field: string, value: string | number | Date) {
        return { _and: [{ field, value }] };
    }
}
