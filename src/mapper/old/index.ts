export interface IRepoMapper {
    getTableMap(tableName: string): TableMap;
    getTableList(): TableList;
}
export interface TableList {
    [key: string]: string;
}
export interface MapObject {
    [key: string]: TableMapData;
}
export interface TableMapData {
    table: string;
    identity: string;
    fields: TableMap;
}
export interface TableMap {
    [key: string]: TableMapEntry;
}
export interface TableMapEntry {
    name: string;
    external?: boolean;
    type?: OmegaValidationType;
    min?: number | Date;
    max?: number | Date;
}
export enum OmegaValidationType {
    STRING = 'String',
    NUMBER = 'Number',
    DATETIME = 'DateTime',
    DATE = 'Date',
    TIME = 'Time'
}
