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
    public async persist(externalObjects: Array<OmegaBaseObject>, returnObjects?: boolean): Promise<void | OmegaObject[]> {
        const affectedObjects = await this.persistObjectArray(externalObjects, returnObjects);
        if (returnObjects) {
            return affectedObjects;
        }
        return;
    }

    public async persistValue(source: string, fieldValuePair: OmegaFieldValuePair, objectId: string | number): Promise<void> {
        const identityCriteria = this.buildIdentityCriteria(source, objectId);
        const tableMap = this.getTableMap(source);
        const mapField = tableMap.fields[fieldValuePair.fieldName];
        this.validateDirectFieldUpdate(mapField, fieldValuePair);
        const fieldValue = await this.transformToField(mapField, fieldValuePair);
        const partialUpdate = { [mapField.name]: fieldValue };
        await this.omegaDal.update(tableMap.name, partialUpdate, identityCriteria);
        return;
    }

    public async retrieveOne(source: string, objectId: string | number): Promise<OmegaObject> {
        const identityCriteria = this.buildIdentityCriteria(source, objectId);
        const tableMap = this.getTableMap(source);
        const fieldList = this.buildExternalFieldList(tableMap);
        const dalRecords = await this.omegaDal.read(tableMap.name, identityCriteria, fieldList);
        if (dalRecords && dalRecords.length === 1) {
            const omegaObject = await this.mapRecordToObject(source, dalRecords[0]);
            return omegaObject;
        }
        return null;
    }
    public async retrieveOneValue(source: string, field: string, objectId: string | number): Promise<OmegaValue> {
        const identityCriteria = this.buildIdentityCriteria(source, objectId);
        const tableMap = this.getTableMap(source);
        const mapField = tableMap.fields[field];
        const dalRecords = await this.omegaDal.read(tableMap.name, identityCriteria, [mapField.name]);
        if (dalRecords && dalRecords.length === 1) {
            const value = await this.transformToProperty(mapField, dalRecords[0][mapField.name]);
            return value;
        }
        return null;
    }
    public async retrieveMany(source: string, criteria: OmegaCriteria): Promise<OmegaObject[]> {
        const internalCriteria = this.buildDalCriteria(source, criteria);
        const tableMap = this.getTableMap(source);
        const fieldList = this.buildExternalFieldList(tableMap);
        const dalRecords = await this.omegaDal.read(tableMap.name, internalCriteria, fieldList);
        if (dalRecords && dalRecords.length > 0) {
            return this.mapAllRecordsToObjects(source, dalRecords);
        }
        return [];
    }
    public async deleteOne(source: string, objectId: string | number): Promise<number> {
        const omegaCriteria = this.buildIdentityCriteria(source, objectId);
        const tableMap = this.getTableMap(source);
        const affectedRecords = await this.omegaDal.delete(tableMap.name, omegaCriteria);
        return affectedRecords;
    }
    public async deleteMany(source: string, criteria: OmegaCriteria): Promise<number> {
        const omegaCriteria = this.buildDalCriteria(source, criteria);
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

    // public for testing, not on interface
    public async mapRecordToObject(table: string, omegaRecord: OmegaDalRecord): Promise<OmegaObject> {
        const tableMap = this.omegaMapper.getTableMap(table);
        const newObject = new OmegaObject(this);
        newObject.objectSource = table;
        for (const key of Object.keys(tableMap.fields)) {
            if (tableMap.fields[key].external) {
                newObject.objectData[key] = await this.convertFieldToProperty(tableMap.fields[key], omegaRecord);
            }
        }
        return newObject;
    }
    public async mapObjectToRecord(externalObject: OmegaBaseObject): Promise<OmegaDalRecord> {
        const tableMap = this.omegaMapper.getTableMap(externalObject.objectSource);
        const objectData = externalObject.objectData;
        const record = this.initOmegaDalRecord(tableMap, objectData);
        const isNewRecord = this.getRecordIdentityValue(tableMap, record) === undefined;
        for (const key of Object.keys(tableMap.fields)) {
            const validationField: OmegaFieldValuePair = {
                fieldName: key,
                fieldValue: objectData[key]
            };
            const fieldValue = await this.convertPropertyToField(tableMap.fields[key], validationField, isNewRecord);
            if (fieldValue !== undefined) {
                record[tableMap.fields[key].name] = fieldValue;
            }
        }
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

    // array interation
    private async mapAllRecordsToObjects(source: string, dalRecords: OmegaDalRecord[]): Promise<OmegaObject[]> {
        const omegaObjects: OmegaObject[] = [];
        for (const dalRecord of dalRecords) {
            omegaObjects.push(await this.mapRecordToObject(source, dalRecord));
        }
        return omegaObjects;
    }

    // DAL interactions
    private async persistObjectArray(externalObjects: OmegaBaseObject[], returnObjects: boolean): Promise<void | OmegaObject[]> {
        const affectedObjects: OmegaObject[] = [];
        for (const omegaObject of externalObjects) {
            const affectedObject = await this.persistObject(omegaObject, returnObjects);
            if (affectedObject) {
                affectedObjects.push(affectedObject);
            }
        }
        return affectedObjects;
    }
    private async persistObject(omegaObject: OmegaBaseObject, returnObjects: boolean): Promise<void | OmegaObject> {
        const identityValue = await this.createOrUpdateObject(omegaObject);
        if (returnObjects) {
            return await this.requestAffectedObject(omegaObject.objectSource, identityValue);
        }
        return;
    }
    private async createOrUpdateObject(omegaObject: OmegaBaseObject): Promise<string | number> {
        const record = await this.mapObjectToRecord(omegaObject);
        const tableMap = this.getTableMap(omegaObject.objectSource);
        let identityValue = this.getRecordIdentityValue(tableMap, record);
        if (identityValue === undefined) {
            identityValue = await this.omegaDal.create(tableMap.name, record);
        } else {
            const identityCriteria = this.buildIdentityCriteria(omegaObject.objectSource, identityValue);
            await this.omegaDal.update(tableMap.name, record, identityCriteria);
        }
        return identityValue;
    }
    private async requestAffectedObject(source: string, sourceId: string | number): Promise<OmegaObject> {
        const tableMap = this.getTableMap(source);
        const criteria = this.buildIdentityCriteria(source, sourceId);
        const records = await this.omegaDal.read(tableMap.name, criteria);
        return this.mapRecordToObject(source, records[0]);
    }

    // field validation
    private validateDirectFieldUpdate(mapField: OmegaField, fieldValuePair: OmegaFieldValuePair) {
        if (mapField.locked) {
            throwFieldValidationError(fieldValuePair.fieldName, mapField.validation.type, [ErrorSuffix.LOCKED_FIELD]);
        }
        this.validateField(mapField, fieldValuePair, false);
    }
    private validateStringType(mapField: OmegaField, validateField: OmegaFieldValuePair, errors: string[]): void | never {
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
    private validateNumberType(mapField: OmegaField, validateField: OmegaFieldValuePair, errors: string[]): void | never {
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
    private validateDateTimeType(mapField: OmegaField, validateField: OmegaFieldValuePair, errors: string[]): void | never {
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
    private validatePasswordType(mapField: OmegaField, validateField: OmegaFieldValuePair, errors: string[]): void | never {
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
    private isMinLengthSatisfied(fieldValue: OmegaValue, minLength: number): boolean {
        return !((fieldValue as string).length < minLength);
    }
    private isMaxLengthSatisfied(fieldValue: OmegaValue, maxLength: number): boolean {
        return !((fieldValue as string).length > maxLength);
    }

    // parameter building
    private buildAllCriteria(externalCriteria: OmegaCriteria, tableMap: OmegaTableMap): OmegaCriteria {
        const internalCriteria: OmegaCriteria = {};
        if (externalCriteria._and) {
            internalCriteria._and = this.buildCriteriaGroup(externalCriteria._and, tableMap);
        } else if (externalCriteria._or) {
            internalCriteria._or = this.buildCriteriaGroup(externalCriteria._or, tableMap);
        }
        return internalCriteria;
    }
    private buildCriteriaGroup(
        criteriaArray: Array<OmegaCriteria | OmegaCriterion | OmegaCriterionLinkTable>,
        tableMap: OmegaTableMap
    ): Array<OmegaCriteria | OmegaCriterion | OmegaCriterionLinkTable> {
        const returnArray: Array<OmegaCriteria | OmegaCriterion | OmegaCriterionLinkTable> = [];
        criteriaArray.forEach(externalItem => {
            if ((externalItem as OmegaCriteria)._and || (externalItem as OmegaCriteria)._or) {
                returnArray.push(this.buildAllCriteria(externalItem as OmegaCriteria, tableMap));
            } else if ((externalItem as OmegaCriterionLinkTable).targetTable) {
                const externalLinkItem = externalItem as OmegaCriterionLinkTable;
                const externalTableMap = this.getTableMap(externalLinkItem.targetTable);
                const linkTableCriteria: OmegaCriterionLinkTable = {
                    sourceField: tableMap.fields[externalLinkItem.sourceField].name,
                    targetTable: externalTableMap.name,
                    targetField: externalTableMap.fields[externalLinkItem.targetField].name,
                    criteria: this.buildAllCriteria(externalLinkItem.criteria, externalTableMap)
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
    public buildDalCriteria(table: string, externalCriteria: OmegaCriteria): OmegaCriteria {
        const tableMap = this.omegaMapper.getTableMap(table);
        try {
            return this.buildAllCriteria(externalCriteria, tableMap);
        } catch (error) {
            throwStandardError('Omega Repository', ErrorSource.REQUESTED_TABLE_MAP, ErrorSuffix.BAD_OMEGA_FORMAT);
        }
    }
    private buildExternalFieldList(tableMap: OmegaTableMap): string[] {
        const fieldList: string[] = [];
        for (const key of Object.keys(tableMap.fields)) {
            if (tableMap.fields[key].external) {
                fieldList.push(tableMap.fields[key].name);
            }
        }
        return fieldList;
    }
    public buildIdentityCriteria(table: string, objectId: string | number): OmegaCriteria {
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

    // value conversion (record.field <=> object.property)
    private async convertFieldToProperty(mapField: OmegaField, omegaRecord: OmegaDalRecord): Promise<OmegaValue | never> {
        if (!mapField.allowNull) {
            if (omegaRecord[mapField.name] === undefined || omegaRecord[mapField.name] === null) {
                throwStandardError('Omega Repository', ErrorSource.OMEGA_DAL_RECORD, ErrorSuffix.MISSING_NO_NULL_FIELD);
            }
        } else {
            if (omegaRecord[mapField.name] === undefined) {
                return null;
            }
        }
        return await this.transformToProperty(mapField, omegaRecord[mapField.name]);
    }
    private async convertPropertyToField(mapField: OmegaField, field: OmegaFieldValuePair, isNewRecord: boolean = false): Promise<OmegaValue | undefined> {
        if (mapField.external && !mapField.locked) {
            this.validateField(mapField, field, isNewRecord);
            return await this.transformToField(mapField, field);
        }
        return undefined;
    }

    // value transformation (f(field) <=> f(property))
    private async transformToProperty(mapField: OmegaField, value: OmegaValue): Promise<OmegaValue> {
        if (typeof mapField.transformToProperty === 'function') {
            return await mapField.transformToProperty(value);
        }
        return value;
    }
    private async transformToField(mapField: OmegaField, field: OmegaFieldValuePair): Promise<OmegaValue> {
        if (typeof mapField.transformToField === 'function') {
            return await mapField.transformToField(field.fieldValue);
        }
        return field.fieldValue;
    }

    // Common object initialization
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
