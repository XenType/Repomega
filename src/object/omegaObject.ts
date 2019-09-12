import { OmegaObjectData } from '.';
import { IOmegaRepository, RepositoryManyParameters, OmegaFieldValuePair } from '../repository';
import { OmegaTableMap, OmegaField } from '../mapper';
import { throwAssociationError, ErrorSource, ErrorSuffix, throwStandardError } from '../common';
import { OmegaLinkPath } from '../mapper';
import { OmegaCriteria, OmegaCriterionLinkTable } from '../dal';
import { cloneDeep } from 'lodash';
import { OmegaValue, OmegaRecordId } from '../common/types';
import { OmegaBaseObject } from '.';

// let sourceRepo: IOmegaRepository;
const extClassName = 'OmegaObject';

export class OmegaObject implements OmegaBaseObject {
    private sourceRepo: IOmegaRepository;
    public tableMap: OmegaTableMap;
    public objectSource: string;
    public objectData: OmegaObjectData;
    constructor(_sourceRepository: IOmegaRepository) {
        this.sourceRepo = _sourceRepository;
        this.objectData = {};
    }
    public async save(): Promise<void> {
        this.initTableMap();
        const savedObjects = await this.sourceRepo.persist([this], true);
        this.objectData = savedObjects[0].objectData;
        return;
    }
    public async verifyInternalField(field: string, value: OmegaValue): Promise<boolean> {
        this.initTableMap();
        this.validateInternalField(field);
        const savedValue = await this.retrieveFieldValue(field);
        if (this.isPasswordField(field)) {
            return this.verifyPasswordField(field, value, savedValue);
        } else {
            return this.verifyStandardField(field, value, savedValue);
        }
    }
    public async saveInternalField(fieldName: string, fieldValue: OmegaValue): Promise<void> {
        this.initTableMap();
        this.validateInternalField(fieldName);
        const fieldValuePair: OmegaFieldValuePair = { fieldName, fieldValue };
        await this.sourceRepo.persistValue(this.objectSource, fieldValuePair, this.objectData[this.tableMap.identity] as OmegaRecordId);
        return;
    }
    public async retrieveParentObject(parent: string): Promise<OmegaObject> {
        this.initTableMap();
        this.validateChildAssociation(parent, this.objectSource);
        const sortedMap = this.getChildAssociationMap(parent, this.objectSource, true);
        return this.retrieveOneToOne(parent, sortedMap, true);
    }
    public async retrieveChildObjects(child: string): Promise<OmegaObject[]> {
        this.initTableMap();
        this.validateChildAssociation(this.objectSource, child);
        const sortedMap = this.getChildAssociationMap(this.objectSource, child);
        return this.retrieveOneToMany(child, sortedMap);
    }
    public async retrieveLateralObjects(target: string): Promise<OmegaObject[]> {
        this.initTableMap();
        this.validateLateralAssociation(target);
        const sortedMap = this.getLateralAssociationMap(target);
        return this.retrieveOneToMany(target, sortedMap);
    }
    public async createLateralLink(target: string, targetLinkValue: OmegaRecordId): Promise<void> {
        this.initTableMap();
        this.validateLateralAssociation(target);
        const { source, criteria, fields, values } = this.buildLateralLinksParameters(target, targetLinkValue);
        const results = await this.sourceRepo.retrieveMany(source, criteria);
        if (results.length === 0) {
            await this.persistLateralLink(source, fields, values);
        }
        return;
    }
    public async deleteLateralLink(target: string, targetLinkValue: OmegaRecordId): Promise<void> {
        this.initTableMap();
        this.validateLateralAssociation(target);
        const { source, criteria } = this.buildLateralLinksParameters(target, targetLinkValue);
        await this.sourceRepo.deleteMany(source, criteria);
        return;
    }

    // tableMap interactions
    private initTableMap(): void {
        if (!this.tableMap) {
            this.tableMap = this.sourceRepo.getTableMap(this.objectSource);
        }
    }
    private getLateralAssociationMap(target: string): OmegaLinkPath[] {
        const associationMap = this.tableMap.lateralAssociations[target];
        const sortedMap = associationMap.sort((a: OmegaLinkPath, b: OmegaLinkPath) => {
            return a.sequence - b.sequence;
        });
        return sortedMap;
    }
    private getChildAssociationMap(parent: string, child: string, reversePath?: boolean): OmegaLinkPath[] {
        const { childAssociations } = this.sourceRepo.getTableMap(parent);
        const associationMap = childAssociations[child];
        const sortedMap = associationMap.sort((a: OmegaLinkPath, b: OmegaLinkPath) => {
            return reversePath ? a.sequence - b.sequence : b.sequence - a.sequence;
        });
        return sortedMap;
    }
    private validateChildAssociation(parent: string, child: string): void | never {
        const { childAssociations } = this.sourceRepo.getTableMap(parent);
        if (!childAssociations[child]) {
            throwAssociationError(ErrorSource.PARENT_ASSOCIATION_ERROR, parent, ErrorSuffix.NO_CHILD_ASSOCIATION, child);
        }
        return;
    }
    private validateLateralAssociation(target: string): void | never {
        const { lateralAssociations } = this.tableMap;
        if (!lateralAssociations || !lateralAssociations[target]) {
            throwAssociationError(ErrorSource.LATERAL_ASSOCIATION_ERROR, this.objectSource, ErrorSuffix.NO_TARGET_ASSOCIATION, target);
        }
        return;
    }
    private validateInternalField(field: string): void | never {
        const mapField = this.tableMap.fields[field];
        if (!mapField) {
            throwStandardError(extClassName, ErrorSource.REQUESTED_TABLE_MAP_FIELD, ErrorSuffix.NOT_FOUND_EXAMPLE, field);
        }
        if (mapField.external) {
            throwStandardError(extClassName, ErrorSource.REQUESTED_TABLE_MAP_FIELD, ErrorSuffix.NOT_INTERNAL_EXAMPLE, field);
        }
    }
    private isPasswordField(field: string): boolean | never {
        const mapField = this.tableMap.fields[field];
        return mapField.validation.type === 'password';
    }

    // repository interactions
    private async retrieveFieldValue(field: string): Promise<OmegaValue> {
        return this.sourceRepo.retrieveOneValue(this.objectSource, field, this.objectData[this.tableMap.identity] as OmegaRecordId);
    }
    private async retrieveOneToOne(table: string, sortedMap: OmegaLinkPath[], reversePath?: boolean): Promise<OmegaObject> {
        const results = await this.retrieveOneToMany(table, sortedMap, reversePath);
        const result = results[0] ? results[0] : null;
        return result;
    }
    private async retrieveOneToMany(table: string, sortedMap: OmegaLinkPath[], reversePath?: boolean): Promise<OmegaObject[]> {
        const criteria = this.buildOmegaCriteria(sortedMap, reversePath);
        const results = await this.sourceRepo.retrieveMany(table, criteria);
        return results;
    }
    private async persistLateralLink(table: string, fields: string[], values: OmegaValue[]): Promise<void> {
        const newLinkObject = new OmegaObject(this.sourceRepo);
        newLinkObject.objectSource = table;
        newLinkObject.objectData[fields[0]] = values[0];
        newLinkObject.objectData[fields[1]] = values[1];
        await this.sourceRepo.persist([newLinkObject]);
    }

    // field value verification
    private async verifyPasswordField(field: string, value: OmegaValue, savedValue: OmegaValue): Promise<boolean> {
        if (typeof this.tableMap.fields[field].transformToProperty === 'function') {
            return (await this.tableMap.fields[field].transformToProperty(value, savedValue)) as boolean;
        } else {
            const passedValue = await this.transformPassedValue(field, value);
            return passedValue === savedValue;
        }
    }
    private async verifyStandardField(field: string, value: OmegaValue, savedValue: OmegaValue): Promise<boolean> {
        const finalValue = await this.transformSavedValue(field, savedValue);
        const passedValue = await this.transformPassedValue(field, value);
        return finalValue === passedValue;
    }

    // field value transformation
    private async transformSavedValue(field: string, value: OmegaValue): Promise<OmegaValue> {
        if (typeof this.tableMap.fields[field].transformToProperty === 'function') {
            return await this.tableMap.fields[field].transformToProperty(value);
        }
        return value;
    }
    private async transformPassedValue(field: string, value: OmegaValue): Promise<OmegaValue> {
        if (typeof this.tableMap.fields[field].transformToProperty !== 'function' && typeof this.tableMap.fields[field].transformToField === 'function') {
            return await this.tableMap.fields[field].transformToField(value);
        }
        return value;
    }

    // argument builders
    private buildLateralLinksParameters(target: string, targetLinkValue: OmegaRecordId): RepositoryManyParameters {
        const sortedMap = this.getLateralAssociationMap(target);
        const source = sortedMap[0].targetTable;
        const sourceLinkField = sortedMap[0].targetId;
        const sourceLinkValue = this.objectData[sortedMap[0].sourceId];
        const targetLinkField = sortedMap[1].sourceId;
        const fields = [sourceLinkField, targetLinkField];
        const values = [sourceLinkValue, targetLinkValue];
        const criteria = this.buildExtendedCriteria(fields, values);
        return { source, criteria, fields, values };
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
    private buildIndirectLinkCriteria(linkPath: OmegaLinkPath, criteria: OmegaCriteria | undefined, reversePath?: boolean): OmegaCriteria {
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
    private buildStandardCriteria(field: string, value: OmegaValue): OmegaCriteria {
        return { _and: [{ field, value }] };
    }
    private buildExtendedCriteria(fields: string[], values: Array<OmegaValue>): OmegaCriteria {
        const criteria: OmegaCriteria = { _and: [] };
        fields.forEach((field: string, index: number) => {
            criteria._and.push({ field, value: values[index] });
        });
        return criteria;
    }
}
