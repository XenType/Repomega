import { FieldTransformFunction } from '../repository';
import { OmegaRecordId } from '../common/types';

export interface IOmegaMapper {
    getTableIndex(): OmegaTableIndex;
    getTableMap(table: string): OmegaTableMap;
    addFieldTransform(table: string, field: string, f: FieldTransformFunction);
    addPropertyTransform(table: string, field: string, f: FieldTransformFunction);
    removeFieldTransform(table: string, field: string);
    removePropertyTransform(table: string, field: string);
}

// Object name to table name index
export interface OmegaTableIndex {
    [key: string]: string;
}

// Table map structures
export interface OmegaMasterTableMap {
    [key: string]: OmegaTableMap;
}
export interface OmegaTableMap {
    name: string;
    identity: string;
    fields: OmegaFieldList;
    childAssociations: OmegaTableLinks;
    lateralAssociations: OmegaTableLinks;
}
export interface OmegaFieldList {
    [key: string]: OmegaField;
}
export interface OmegaField {
    name: string;
    external: boolean;
    locked: boolean;
    allowNull: boolean;
    validation: OmegaFieldValidation;
    transformToField?: FieldTransformFunction;
    transformToProperty?: FieldTransformFunction;
}
export interface OmegaFieldValidation {
    type: OmegaValidationType;
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    enumList?: Array<OmegaRecordId>;
    requireCharacters?: OmegaFieldRequiredCharacters;
}
export type OmegaValidationType =  'string' |'number' |'datetime' |'boolean' |'enum' |'password';

export interface OmegaFieldRequiredCharacters {
    lowerCase?: boolean;
    upperCase?: boolean;
    number?: boolean;
    symbol?: boolean;
}
export interface OmegaTableLinks {
    [key: string]: OmegaLinkPath[];
}
export interface OmegaLinkPath {
    sourceTable: string;
    sourceId: string;
    targetTable: string;
    targetId: string;
    sequence: number;
}
