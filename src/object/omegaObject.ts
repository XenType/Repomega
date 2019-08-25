import { OmegaObjectData } from '.';
import { IOmegaRepository } from '../repository';
import { OmegaTableMap, OmegaField } from '../mapper';
import { throwAssociationError, ErrorSource, ErrorSuffix } from '../common';
import { OmegaTableLinkPath } from '../mapper';
import { OmegaCriteria } from '../dal';
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
        return this.retrieveTargetParent(sortedMap);
    }
    public async retrieveChildAssociations(target: string): Promise<OmegaObject[]> {
        this.initTableMap();
        this.verifyChildAssociation(this.objectSource, target);
        const sortedMap = this.getParentChildAssociationMap(this.objectSource, target);
        return this.retrieveTargetChildren(sortedMap);
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
    private async retrieveTargetParent(sortedMap: OmegaTableLinkPath[]): Promise<OmegaObject> {
        let parent: OmegaObject;
        for (const linkPath of sortedMap) {
            const parentId = (parent ? parent.objectData[linkPath.targetId] : this.objectData[linkPath.targetId]) as
                | string
                | number;
            parent = await sourceRepo.retrieveOne(linkPath.sourceTable, parentId);
            if (parent === null) {
                break;
            }
        }
        return parent;
    }
    private async retrieveTargetChildren(sortedMap: OmegaTableLinkPath[]): Promise<OmegaObject[]> {
        let children: OmegaObject[];

        for (const linkPath of sortedMap) {
            let idList: Array<string | number>;
            if (children === undefined) {
                idList = [this.objectData[this.tableMap.identity] as string | number];
            } else if (children === []) {
                return [];
            } else {
                idList = children.map(child => {
                    return child.objectData[linkPath.sourceId] as string | number;
                });
            }
            children = await this.retrieveNextLevelChildAssociations(idList, linkPath);
        }
        return children;
    }
    private async retrieveNextLevelChildAssociations(
        targetIds: Array<string | number>,
        linkPath: OmegaTableLinkPath
    ): Promise<OmegaObject[]> {
        const criteria: OmegaCriteria = {
            _or: []
        };
        for (const targetId of targetIds) {
            const criterion = { field: linkPath.targetId, value: targetId };
            criteria._or.push(criterion);
        }
        const children = await sourceRepo.retrieveMany(linkPath.targetTable, criteria);
        return children;
    }
}
