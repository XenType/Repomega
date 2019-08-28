import { OmegaObjectData } from '.';
import { IOmegaRepository } from '../repository';
import { OmegaTableMap, OmegaField } from '../mapper';
import { throwAssociationError, ErrorSource, ErrorSuffix } from '../common';
import { OmegaTableLinkPath } from '../mapper';
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
    public async retrieveParentAssociation(target: string): Promise<OmegaObject> {
        this.initTableMap();
        this.verifyChildAssociation(target, this.objectSource);
        const sortedMap = this.getParentChildAssociationMap(target, this.objectSource, true);
        return this.retrieveTargetParent(target, sortedMap);
    }
    public async retrieveChildAssociations(target: string): Promise<OmegaObject[]> {
        this.initTableMap();
        this.verifyChildAssociation(this.objectSource, target);
        const sortedMap = this.getParentChildAssociationMap(this.objectSource, target);
        return this.retrieveTargetChildren(target, sortedMap);
    }
    public async retrieveLateralAssociations(target: string): Promise<OmegaObject[]> {
        this.initTableMap();
        this.verifyLateralAssociation(target);
        return null;
    }
    private buildLateralAssociationLookupCriteria(target: string): OmegaCriteria {
        //
        return null;
    }
    public async createLateralAssociation(target: string, objectId: string | number): Promise<void> {
        this.initTableMap();
        return null;
    }
    public async deleteLateralAssociation(target: string, objectId: string | number): Promise<void> {
        this.initTableMap();
        return null;
    }
    public async validatePassword(mapField: OmegaField, password: string): Promise<boolean> {
        return false;
    }
    public async modifyInternalField(mapField: OmegaField, value: string): Promise<boolean> {
        return false;
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
    private getParentChildAssociationMap(
        parent: string,
        child: string,
        startFromChild?: boolean
    ): OmegaTableLinkPath[] {
        const { childAssociations } = sourceRepo.getTableMap(parent);
        const associationMap = childAssociations[child];
        const sortedMap = associationMap.sort((a: OmegaTableLinkPath, b: OmegaTableLinkPath) => {
            return startFromChild ? a.sequence - b.sequence : b.sequence - a.sequence;
        });
        return sortedMap;
    }
    private async retrieveTargetParent(target: string, sortedMap: OmegaTableLinkPath[]): Promise<OmegaObject> {
        const criteria = this.buildParentChildLinkCriteria(sortedMap, true);
        const parentResults = await sourceRepo.retrieveMany(target, criteria);
        const parent = parentResults[0] ? parentResults[0] : null;
        return parent;
    }
    private async retrieveTargetChildren(target: string, sortedMap: OmegaTableLinkPath[]): Promise<OmegaObject[]> {
        const criteria = this.buildParentChildLinkCriteria(sortedMap);
        const children = await sourceRepo.retrieveMany(target, criteria);
        return children;
    }
    private buildParentChildLinkCriteria(sortedMap: OmegaTableLinkPath[], startFromChild?: boolean): OmegaCriteria {
        let criteria: OmegaCriteria;
        for (const linkPath of sortedMap) {
            if (!criteria) {
                criteria = this.buildParentChildDirectCriteria(linkPath, startFromChild);
            } else {
                criteria = this.buildParentChildIndirectCriteria(linkPath, criteria, startFromChild);
            }
        }
        return criteria;
    }
    private buildParentChildDirectCriteria(linkPath: OmegaTableLinkPath, startFromChild?: boolean): OmegaCriteria {
        const field = startFromChild ? linkPath.sourceId : linkPath.targetId;
        const value = startFromChild ? this.objectData[linkPath.targetId] : this.objectData[linkPath.sourceId];
        return this.buildStandardCriteria(field, value);
    }
    private buildStandardCriteria(field: string, value: string | number | Date) {
        return { _and: [{ field, value }] };
    }
    private buildParentChildIndirectCriteria(
        linkPath: OmegaTableLinkPath,
        criteria: OmegaCriteria | undefined,
        startFromChild?: boolean
    ): OmegaCriteria {
        const parentCriteria = this.buildParentChildBaseCriteria(linkPath, startFromChild) as OmegaCriteria;
        (parentCriteria._and[0] as OmegaCriterionLinkTable).criteria = cloneDeep(criteria);
        return parentCriteria;
    }
    private buildParentChildBaseCriteria(linkPath: OmegaTableLinkPath, startFromChild): OmegaCriteria {
        const sourceField = startFromChild ? linkPath.sourceId : linkPath.targetId;
        const targetTable = startFromChild ? linkPath.targetTable : linkPath.sourceTable;
        const targetField = startFromChild ? linkPath.targetId : linkPath.sourceId;
        const linkCriteria = { sourceField, targetTable, targetField, criteria: {} };
        return { _and: [linkCriteria] };
    }
}
