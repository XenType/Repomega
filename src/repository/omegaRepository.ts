import { IOmegaRepository, OmegaFieldValuePair, FieldTransformFunction } from '.';
import { OmegaCriteria, IOmegaDal, OmegaDalRecord, OmegaCriterion, OmegaCriterionLinkTable } from '../dal';
import { IOmegaMapper, OmegaField } from '../mapper';
import { ErrorSource, ErrorSuffix, throwStandardError, throwFieldValidationError } from '../common';
import { OmegaTableMap } from '../mapper';
import { OmegaObjectData, OmegaBaseObject } from '../object';
import { OmegaObject } from '../object/omegaObject';
import { types } from 'util';
import { OmegaValue } from '../../src/common/types';

export class OmegaRepository implements IOmegaRepository {
    private omegaMapper: IOmegaMapper;
    private omegaDal: IOmegaDal;
    constructor(_omegaDal: IOmegaDal) {
        this.omegaDal = _omegaDal;
        this.omegaMapper = this.omegaDal.mapper;
    }
    public async persist(
        externalObjects: Array<OmegaBaseObject>,
        returnObjects?: boolean
    ): Promise<void | OmegaObject[]> {
        const affectedObjects: OmegaObject[] = [];
        for (const omegaObject of externalObjects) {
            const identityValue = await this.createOrUpdateObject(omegaObject);
            if (returnObjects) {
                const affectedObject = await this.requestAffectedObject(omegaObject.objectSource, identityValue);
                affectedObjects.push(affectedObject);
            }
        }
        if (returnObjects) {
            return affectedObjects;
        }
        return;
    }
    public async persistValue(
        source: string,
        fieldValuePair: OmegaFieldValuePair,
        objectId: string | number
    ): Promise<void> {
        const identityCriteria = this.createIdentityCriteria(source, objectId);
        const tableMap = this.getTableMap(source);
        const mapField = tableMap.fields[fieldValuePair.fieldName];
        this.validateField(mapField, fieldValuePair, false);
        const partialUpdate = {
            [mapField.name]: this.transformToField(mapField, fieldValuePair)
        };
        await this.omegaDal.update(tableMap.name, partialUpdate, identityCriteria);
        return;
    }
    public async retrieveOne(source: string, objectId: string | number): Promise<OmegaObject> {
        const identityCriteria = this.createIdentityCriteria(source, objectId);
        const tableMap = this.getTableMap(source);
        const fieldList = this.createExternalFieldList(tableMap);
        const dalRecords = await this.omegaDal.read(tableMap.name, identityCriteria, fieldList);
        if (dalRecords && dalRecords.length === 1) {
            const omegaObject = this.mapRecordToObject(source, dalRecords[0]);
            return omegaObject;
        }
        return null;
    }
    public async retrieveOneValue(source: string, field: string, objectId: string | number): Promise<OmegaValue> {
        const identityCriteria = this.createIdentityCriteria(source, objectId);
        const tableMap = this.getTableMap(source);
        const mapField = tableMap.fields[field];
        const dalRecords = await this.omegaDal.read(tableMap.name, identityCriteria, [mapField.name]);
        if (dalRecords && dalRecords.length === 1) {
            const value = this.transformToProperty(mapField, dalRecords[0][mapField.name]);
            return value;
        }
        return null;
    }
    public async retrieveMany(source: string, criteria: OmegaCriteria): Promise<OmegaObject[]> {
        const internalCriteria = this.mapExternalCriteriaToDalCriteria(source, criteria);
        const tableMap = this.getTableMap(source);
        const fieldList = this.createExternalFieldList(tableMap);
        const dalRecords = await this.omegaDal.read(tableMap.name, internalCriteria, fieldList);
        if (dalRecords && dalRecords.length > 0) {
            const omegaObjects: OmegaObject[] = [];
            dalRecords.forEach(dalRecord => {
                omegaObjects.push(this.mapRecordToObject(source, dalRecord));
            });
            return omegaObjects;
        }
        return [];
    }
    public async deleteOne(source: string, objectId: string | number): Promise<number> {
        const omegaCriteria = this.createIdentityCriteria(source, objectId);
        const tableMap = this.getTableMap(source);
        const affectedRecords = await this.omegaDal.delete(tableMap.name, omegaCriteria);
        return affectedRecords;
    }
    public async deleteMany(source: string, criteria: OmegaCriteria): Promise<number> {
        const omegaCriteria = this.mapExternalCriteriaToDalCriteria(source, criteria);
        const tableMap = this.getTableMap(source);
        const affectedRecords = await this.omegaDal.delete(tableMap.name, omegaCriteria);
        return affectedRecords;
    }
    public getTableMap(source: string): OmegaTableMap {
        return this.omegaMapper.getTableMap(source);
    }
    public addFieldTransformToMap(source: string, field: string, f?: FieldTransformFunction): void {
        if (typeof f === 'function') {
            this.omegaMapper.addFieldTransform(source, field, f);
        } else {
            this.omegaMapper.removeFieldTransform(source, field);
        }
        return;
    }
    public addPropertyTransformToMap(source: string, field: string, f?: FieldTransformFunction): void {
        if (typeof f === 'function') {
            this.omegaMapper.addPropertyTransform(source, field, f);
        } else {
            this.omegaMapper.removeFieldTransform(source, field);
        }
        return;
    }
    // public for testing
    public mapObjectToRecord(externalObject: OmegaBaseObject): OmegaDalRecord {
        const tableMap = this.omegaMapper.getTableMap(externalObject.objectSource);
        const objectData = externalObject.objectData;
        const record = this.initOmegaDalRecord(tableMap, objectData);
        const isNewRecord = this.getRecordIdentityValue(tableMap, record) === undefined;
        Object.keys(tableMap.fields).forEach(key => {
            const validationField: OmegaFieldValuePair = {
                fieldName: key,
                fieldValue: objectData[key]
            };
            const fieldValue = this.convertPropertyToField(tableMap.fields[key], validationField, isNewRecord);
            if (fieldValue !== undefined) {
                record[tableMap.fields[key].name] = fieldValue;
            }
        });
        return record;
    }
    private getRecordIdentityValue(tableMap: OmegaTableMap, record: OmegaDalRecord): any {
        return record[tableMap.fields[tableMap.identity].name];
    }
    public validateField(mapField: OmegaField, validateField: OmegaFieldValuePair, isNewRecord: boolean): void {
        const { fieldName, fieldValue } = validateField;
        if (!mapField.allowNull) {
            if ((isNewRecord && fieldValue === undefined) || fieldValue === null) {
                throwStandardError('Omega Repository', ErrorSource.OMEGA_NEW_OBJECT, ErrorSuffix.MISSING_NO_NULL_FIELD);
            }
        }
        if (fieldValue !== undefined && fieldValue !== null) {
            const errors: string[] = [];
            if (mapField.validation.type === 'string') {
                this.validateStringType(mapField, validateField, errors);
            }
            if (mapField.validation.type === 'number') {
                this.validateNumberType(mapField, validateField, errors);
            }
            if (mapField.validation.type === 'datetime') {
                this.validateDateTimeType(mapField, validateField, errors);
            }
            if (mapField.validation.type === 'enum') {
                this.validateEnumType(mapField, validateField, errors);
            }
            if (mapField.validation.type === 'password') {
                this.validatePasswordType(mapField, validateField, errors);
            }
            if (errors.length > 0) {
                throwFieldValidationError(fieldName, mapField.validation.type, errors);
            }
        }
    }
    public mapRecordToObject(table: string, omegaRecord: OmegaDalRecord): OmegaObject {
        const tableMap = this.omegaMapper.getTableMap(table);
        const newObject = new OmegaObject(this);
        newObject.objectSource = table;
        Object.keys(tableMap.fields).forEach(key => {
            if (tableMap.fields[key].external) {
                newObject.objectData[key] = this.convertFieldToProperty(tableMap.fields[key], omegaRecord);
            }
        });
        return newObject;
    }
    public mapExternalCriteriaToDalCriteria(table: string, externalCriteria: OmegaCriteria): OmegaCriteria {
        const tableMap = this.omegaMapper.getTableMap(table);
        try {
            return this.mapAllCriteria(externalCriteria, tableMap);
        } catch (error) {
            throwStandardError('Omega Repository', ErrorSource.REQUESTED_TABLE_MAP, ErrorSuffix.BAD_OMEGA_FORMAT);
        }
    }
    private createExternalFieldList(tableMap: OmegaTableMap): string[] {
        const fieldList: string[] = [];
        for (const key of Object.keys(tableMap.fields)) {
            if (tableMap.fields[key].external) {
                fieldList.push(tableMap.fields[key].name);
            }
        }
        return fieldList;
    }
    public createIdentityCriteria(table: string, objectId: string | number): OmegaCriteria {
        const tableMap = this.omegaMapper.getTableMap(table);
        let field: string;
        try {
            field = tableMap.fields[tableMap.identity].name;
        } catch (error) {
            throwStandardError('Omega Repository', ErrorSource.REQUESTED_TABLE_MAP, ErrorSuffix.BAD_OMEGA_FORMAT);
        }
        const idCriteria: OmegaCriteria = {
            _and: [{ field, value: objectId }]
        };
        return idCriteria;
    }
    // private refactored functions
    private async createOrUpdateObject(omegaObject: OmegaBaseObject): Promise<string | number> {
        const record = this.mapObjectToRecord(omegaObject);
        const tableMap = this.getTableMap(omegaObject.objectSource);
        let identityValue = this.getRecordIdentityValue(tableMap, record);
        if (identityValue === undefined) {
            identityValue = await this.omegaDal.create(tableMap.name, record);
        } else {
            const identityCriteria = this.createIdentityCriteria(omegaObject.objectSource, identityValue);
            await this.omegaDal.update(tableMap.name, record, identityCriteria);
        }
        return identityValue;
    }
    private async requestAffectedObject(source: string, sourceId: string | number): Promise<OmegaObject> {
        const tableMap = this.getTableMap(source);
        const criteria = this.createIdentityCriteria(source, sourceId);
        const records = await this.omegaDal.read(tableMap.name, criteria);
        return this.mapRecordToObject(source, records[0]);
    }
    private isMinLengthSatisfied(fieldValue: OmegaValue, minLength: number): boolean {
        return !((fieldValue as string).length < minLength);
    }
    private isMaxLengthSatisfied(fieldValue: OmegaValue, maxLength: number): boolean {
        return !((fieldValue as string).length > maxLength);
    }
    private validateStringType(
        mapField: OmegaField,
        validateField: OmegaFieldValuePair,
        errors: string[]
    ): void | never {
        const { fieldValue } = validateField;
        if (mapField.validation.minLength !== undefined) {
            if (!this.isMinLengthSatisfied(fieldValue, mapField.validation.minLength)) {
                errors.push(ErrorSuffix.MIN_LENGTH.replace('{0}', mapField.validation.minLength.toString()));
            }
        }
        if (mapField.validation.maxLength !== undefined) {
            if (!this.isMaxLengthSatisfied(fieldValue, mapField.validation.maxLength)) {
                errors.push(ErrorSuffix.MAX_LENGTH.replace('{0}', mapField.validation.maxLength.toString()));
            }
        }
    }
    private isMinValueSatisfied(fieldValue: number, minValue: number): boolean {
        return !(fieldValue < minValue);
    }
    private isMaxValueSatisfied(fieldValue: number, maxValue: number): boolean {
        return !(fieldValue > maxValue);
    }
    private validateNumberType(
        mapField: OmegaField,
        validateField: OmegaFieldValuePair,
        errors: string[]
    ): void | never {
        const { fieldValue } = validateField;
        if (typeof fieldValue !== 'number') {
            errors.push(ErrorSuffix.NOT_A_NUMBER);
        } else {
            if (mapField.validation.minValue !== undefined) {
                if (!this.isMinValueSatisfied(fieldValue as number, mapField.validation.minValue)) {
                    errors.push(ErrorSuffix.MIN_VALUE.replace('{0}', mapField.validation.minValue.toString()));
                }
            }
            if (mapField.validation.maxValue !== undefined) {
                if (!this.isMaxValueSatisfied(fieldValue as number, mapField.validation.maxValue)) {
                    errors.push(ErrorSuffix.MAX_VALUE.replace('{0}', mapField.validation.maxValue.toString()));
                }
            }
        }
    }
    private validateDateTimeType(
        mapField: OmegaField,
        validateField: OmegaFieldValuePair,
        errors: string[]
    ): void | never {
        const { fieldValue } = validateField;
        if (!types.isDate(fieldValue)) {
            errors.push(ErrorSuffix.NOT_A_DATE);
        }
    }
    private validateEnumType(mapField: OmegaField, validateField: OmegaFieldValuePair, errors: string[]): void | never {
        const { fieldValue } = validateField;
        if (!mapField.validation.enumList.includes(fieldValue as string | number)) {
            errors.push(ErrorSuffix.NOT_IN_LIST);
        }
    }
    private validatePasswordType(
        mapField: OmegaField,
        validateField: OmegaFieldValuePair,
        errors: string[]
    ): void | never {
        const { fieldValue } = validateField;
        this.validateStringType(mapField, validateField, errors);
        if (mapField.validation.requireCharacters) {
            let lowerFound = false;
            let upperFound = false;
            let numberFound = false;
            let symbolFound = false;
            for (let i = 0; i < (fieldValue as string).length; i++) {
                const charCode = (fieldValue as string).charCodeAt(i);
                if (charCode >= 97 && charCode <= 122) {
                    lowerFound = true;
                } else if (charCode >= 65 && charCode <= 90) {
                    upperFound = true;
                } else if (charCode >= 48 && charCode <= 57) {
                    numberFound = true;
                } else {
                    symbolFound = true;
                }
            }
            if (mapField.validation.requireCharacters.lowerCase && !lowerFound) {
                errors.push(ErrorSuffix.MISSING_CHARACTER.replace('{0}', 'lowercase'));
            }
            if (mapField.validation.requireCharacters.upperCase && !upperFound) {
                errors.push(ErrorSuffix.MISSING_CHARACTER.replace('{0}', 'uppercase'));
            }
            if (mapField.validation.requireCharacters.number && !numberFound) {
                errors.push(ErrorSuffix.MISSING_CHARACTER.replace('{0}', 'number'));
            }
            if (mapField.validation.requireCharacters.symbol && !symbolFound) {
                errors.push(ErrorSuffix.MISSING_CHARACTER.replace('{0}', 'symbol'));
            }
        }
    }
    private mapAllCriteria(externalCriteria: OmegaCriteria, tableMap: OmegaTableMap): OmegaCriteria {
        const internalCriteria: OmegaCriteria = {};
        if (externalCriteria._and) {
            internalCriteria._and = this.mapCriteriaGroup(externalCriteria._and, tableMap);
        } else if (externalCriteria._or) {
            internalCriteria._or = this.mapCriteriaGroup(externalCriteria._or, tableMap);
        }
        return internalCriteria;
    }
    private mapCriteriaGroup(
        criteriaArray: Array<OmegaCriteria | OmegaCriterion | OmegaCriterionLinkTable>,
        tableMap: OmegaTableMap
    ): Array<OmegaCriteria | OmegaCriterion | OmegaCriterionLinkTable> {
        const returnArray: Array<OmegaCriteria | OmegaCriterion | OmegaCriterionLinkTable> = [];
        criteriaArray.forEach(externalItem => {
            if ((externalItem as OmegaCriteria)._and || (externalItem as OmegaCriteria)._or) {
                returnArray.push(this.mapAllCriteria(externalItem as OmegaCriteria, tableMap));
            } else if ((externalItem as OmegaCriterionLinkTable).targetTable) {
                const externalLinkItem = externalItem as OmegaCriterionLinkTable;
                const externalTableMap = this.getTableMap(externalLinkItem.targetTable);
                const linkTableCriteria: OmegaCriterionLinkTable = {
                    sourceField: tableMap.fields[externalLinkItem.sourceField].name,
                    targetTable: externalTableMap.name,
                    targetField: externalTableMap.fields[externalLinkItem.targetField].name,
                    criteria: this.mapAllCriteria(externalLinkItem.criteria, externalTableMap)
                };
                returnArray.push(linkTableCriteria);
            } else {
                returnArray.push({
                    field: tableMap.fields[(externalItem as OmegaCriterion).field].name,
                    value: (externalItem as OmegaCriterion).value
                });
            }
        });
        return returnArray;
    }
    private convertFieldToProperty(mapField: OmegaField, omegaRecord: OmegaDalRecord): OmegaValue | never {
        if (!mapField.allowNull) {
            if (omegaRecord[mapField.name] === undefined || omegaRecord[mapField.name] === null) {
                throwStandardError('Omega Repository', ErrorSource.OMEGA_DAL_RECORD, ErrorSuffix.MISSING_NO_NULL_FIELD);
            }
        } else {
            if (omegaRecord[mapField.name] === undefined) {
                return null;
            }
        }
        return this.transformToProperty(mapField, omegaRecord[mapField.name]);
    }
    private transformToProperty(mapField: OmegaField, value: OmegaValue): OmegaValue {
        if (typeof mapField.transformToProperty === 'function') {
            return mapField.transformToProperty(value);
        }
        return value;
    }
    private convertPropertyToField(
        mapField: OmegaField,
        field: OmegaFieldValuePair,
        isNewRecord: boolean = false
    ): OmegaValue | undefined {
        if (mapField.external && !mapField.locked) {
            this.validateField(mapField, field, isNewRecord);
            return this.transformToField(mapField, field);
        }
        return undefined;
    }
    private transformToField(mapField: OmegaField, field: OmegaFieldValuePair): OmegaValue {
        if (typeof mapField.transformToField === 'function') {
            return mapField.transformToField(field.fieldValue);
        }
        return field.fieldValue;
    }
    private initOmegaDalRecord(tableMap: OmegaTableMap, objectData: OmegaObjectData): OmegaDalRecord {
        const record: OmegaDalRecord = {};
        const recordIdValue = objectData[tableMap.identity] as OmegaValue;
        const recordIdField = tableMap.fields[tableMap.identity].name;
        if (recordIdValue !== undefined) {
            record[recordIdField] = recordIdValue;
        }
        return record;
    }
}
