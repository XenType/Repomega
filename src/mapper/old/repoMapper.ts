import * as fs from 'fs';
import { MapObject, TableMap, IRepoMapper, TableList, TableMapData } from '.';

export class RepoMapper implements IRepoMapper {
    mapObject: MapObject;
    mapPath: string;
    constructor(_mapPath: string) {
        this.mapPath = _mapPath;
        this.loadMap();
    }
    public getTableList(): TableList {
        const mapKeys = Object.keys(this.mapObject);
        const tableList = {};
        mapKeys.forEach(table => {
            tableList[table] = this.mapObject[table].table;
        });
        return tableList;
    }
    public getTableMap(tableName: string): TableMap {
        this.confirmTableExists(tableName);
        const mapData = this.mapObject[tableName];
        return this.createTableMapFromTableMapData(mapData);
    }
    private confirmTableExists(tableName: string): void | never {
        if (!this.mapObject[tableName]) {
            throw Error(`File does not contain requested table (${tableName}): ${this.mapPath}`);
        }
    }
    private createTableMapFromTableMapData(tableMapData: TableMapData): TableMap {
        return tableMapData.fields;
    }
    private loadMap(): void {
        const data = this.readMap();
        try {
            this.mapObject = JSON.parse(data.toString());
        } catch (error) {
            throw Error(`File does not contain valid JSON data: ${this.mapPath}`);
        }
        return;
    }
    private readMap(): any {
        try {
            return fs.readFileSync(this.mapPath);
        } catch (error) {
            throw Error(`Unable to load map file: ${this.mapPath}`);
        }
    }
}
