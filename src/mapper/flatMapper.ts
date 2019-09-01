import * as fs from 'fs';
import { IOmegaMapper, OmegaTableIndex, OmegaTableMap, OmegaMasterTableMap } from '.';
import { throwStandardError, ErrorSource, ErrorSuffix } from '../common';
import { FieldTransformFunction } from '../repository';

const extClassName = 'Flat Mapper';

export class FlatMapper implements IOmegaMapper {
    private masterMap: OmegaMasterTableMap;
    private mapPath: string;
    constructor(_mapPath: string) {
        this.mapPath = _mapPath;
        this.loadMaps();
    }
    public getTableIndex(): OmegaTableIndex {
        const tableIndex = {};
        Object.keys(this.masterMap).forEach((tableObject: string) => {
            if (!this.masterMap[tableObject].name) {
                throwStandardError(extClassName, ErrorSource.TABLE_MAP_FILE, ErrorSuffix.BAD_OMEGA_FORMAT);
            }
            tableIndex[tableObject] = this.masterMap[tableObject].name;
        });
        return tableIndex;
    }
    public getTableMap(table: string): OmegaTableMap {
        this.validateTable(table);
        return this.masterMap[table];
    }
    public addFieldTransform(table: string, field: string, f: FieldTransformFunction): void {
        this.validateTableField(table, field);
        this.masterMap[table].fields[field].transformToField = f;
    }
    public removeFieldTransform(table: string, field: string): void {
        this.validateTableField(table, field);
        delete this.masterMap[table].fields[field].transformToField;
    }
    public addPropertyTransform(table: string, field: string, f: FieldTransformFunction): void {
        this.validateTableField(table, field);
        this.masterMap[table].fields[field].transformToProperty = f;
    }

    public removePropertyTransform(table: string, field: string): void {
        this.validateTableField(table, field);
        delete this.masterMap[table].fields[field].transformToProperty;
    }
    private loadMaps(): void {
        const data = this.readMap();
        try {
            this.masterMap = JSON.parse(data.toString());
        } catch (error) {
            throwStandardError(extClassName, ErrorSource.TABLE_MAP_FILE, ErrorSuffix.BAD_JSON_FORMAT);
        }
    }
    private readMap(): any {
        try {
            return fs.readFileSync(this.mapPath);
        } catch (error) {
            throwStandardError(extClassName, ErrorSource.TABLE_MAP_FILE, ErrorSuffix.NOT_FOUND);
        }
    }
    private validateTable(table: string): void | never {
        if (!this.masterMap[table]) {
            throwStandardError(extClassName, ErrorSource.REQUESTED_TABLE_MAP, ErrorSuffix.NOT_FOUND_EXAMPLE, table);
        }
    }
    private validateTableField(table: string, field: string): void | never {
        this.validateTable(table);
        if (!this.masterMap[table].fields[field]) {
            throwStandardError(
                extClassName,
                ErrorSource.REQUESTED_TABLE_MAP_FIELD,
                ErrorSuffix.NOT_FOUND_EXAMPLE,
                field
            );
        }
    }
}
