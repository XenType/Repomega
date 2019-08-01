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
    fields: Array<OmegaField>;
}
export interface OmegaField {
    name: string;
    external: boolean;
    locked: boolean;
    validation: OmegaFieldValidation;
}
export interface OmegaFieldValidation {
    type: string;
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    enumList?: Array<string | number>;
    requireCharacters: OmegaFieldRequiredCharacters;
}
export interface OmegaFieldRequiredCharacters {
    lowerCase?: boolean;
    upperCase?: boolean;
    number?: boolean;
    symbol?: boolean;
}
export interface OmegaTableLink {
    [key: string]: OmegaTableLinkPath[];
}
export interface OmegaTableLinkPath {
    sourceTable: string;
    sourceId: string;
    targetTable: string;
    targetId: string;
    sequence: number;
}
