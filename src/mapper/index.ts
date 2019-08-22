export interface IOmegaMapper {
    getTableIndex(): OmegaTableIndex;
    getTableMap(table: string): OmegaTableMap;
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
}
export interface OmegaFieldValidation {
    type: string;
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    enumList?: Array<string | number>;
    requireCharacters?: OmegaFieldRequiredCharacters;
}
export interface OmegaFieldRequiredCharacters {
    lowerCase?: boolean;
    upperCase?: boolean;
    number?: boolean;
    symbol?: boolean;
}
export interface OmegaTableLinks {
    [key: string]: OmegaTableLinkPath[];
}
export interface OmegaTableLinkPath {
    sourceTable: string;
    sourceId: string;
    targetTable: string;
    targetId: string;
    sequence: number;
}
