import * as fs from 'fs';
import { IOmegaMapper, OmegaTableIndex, OmegaTableMap, OmegaMasterTableMap } from '.';
import { throwStandardError, ErrorSource, ErrorSuffix } from '../common';

const extClassName = 'Flat Mapper';

export class FlatMapper implements IOmegaMapper {
    masterMap: OmegaMasterTableMap;
    mapPath: string;
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
        if (!this.masterMap[table]) {
            throwStandardError(extClassName, ErrorSource.REQUESTED_TABLE_MAP, ErrorSuffix.NOT_FOUND);
        }
        return this.masterMap[table];
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
}
