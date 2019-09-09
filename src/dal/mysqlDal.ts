import * as mySql from 'mysql';
import { IOmegaDal, OmegaDalRecord, OmegaCriteria, OmegaCriterion, OmegaDalConfig, OmegaCriterionLinkTable } from '.';
import { OmegaTableIndex } from '../mapper';
import { FlatMapper } from '../mapper/flatMapper';
import { OmegaRecordId } from '../common/types';

let connPool: mySql.Pool;
const INSERT_SQL = 'INSERT INTO {0} SET ?';
const SELECT_SQL = 'SELECT * FROM {0} WHERE {1}';
const SELECT_ONLY_SQL = 'SELECT {0} FROM {1} WHERE {2}';
const UPDATE_SQL = 'UPDATE {0} SET {1} WHERE {2}';
const DELETE_SQL = 'DELETE FROM {0} WHERE {1}';

export class MySqlDal implements IOmegaDal {
    tableList: OmegaTableIndex;
    public mapper: FlatMapper;
    constructor(dalConfig: OmegaDalConfig, dalMapPath: string) {
        this.mapper = new FlatMapper(dalMapPath);
        connPool = mySql.createPool(dalConfig);
        this.tableList = this.mapper.getTableIndex();
    }
    public async create(table: string, newRecord: OmegaDalRecord): Promise<OmegaRecordId> {
        const dbConn = await this.getDbConnection();
        const sql = INSERT_SQL.replace('{0}', table);
        const sqlResult = await this.getQueryResult(dbConn, sql, newRecord);
        dbConn.release();
        return sqlResult.insertId;
    }
    public async read(table: string, criteria: OmegaCriteria, fieldList?: string[]): Promise<OmegaDalRecord[]> {
        const dbConn = await this.getDbConnection();
        const sqlWhereClause = this.buildCriteriaClause(criteria);
        let sql;
        if (fieldList) {
            const fieldString = fieldList.join(', ');
            sql = SELECT_ONLY_SQL.replace('{0}', fieldString)
                .replace('{1}', table)
                .replace('{2}', sqlWhereClause);
        } else {
            sql = SELECT_SQL.replace('{0}', table).replace('{1}', sqlWhereClause);
        }
        const sqlResult = await this.getQueryResult(dbConn, sql);
        dbConn.release();
        return sqlResult;
    }
    // if !returnUpdatedObjects, function will return the number of objects updated
    public async update(table: string, updates: Partial<OmegaDalRecord>, criteria: OmegaCriteria): Promise<number> {
        const dbConn = await this.getDbConnection();
        const sqlUpdateClause = this.buildUpdateClause(updates);
        const sqlWhereClause = this.buildCriteriaClause(criteria);
        const sqlWithTable = UPDATE_SQL.replace('{0}', table);
        const sqlWithUpdates = sqlWithTable.replace('{1}', sqlUpdateClause);
        const sql = sqlWithUpdates.replace('{2}', sqlWhereClause);
        const sqlResult = await this.getQueryResult(dbConn, sql);
        dbConn.release();
        return sqlResult.affectedRows;
    }
    // returns number of objects deleted
    public async delete(table: string, criteria: OmegaCriteria): Promise<number> {
        const dbConn = await this.getDbConnection();
        const sqlWhereClause = this.buildCriteriaClause(criteria);
        const sqlWithTable = DELETE_SQL.replace('{0}', table);
        const sql = sqlWithTable.replace('{1}', sqlWhereClause);
        const sqlResult = await this.getQueryResult(dbConn, sql);
        dbConn.release();
        return sqlResult.affectedRows;
    }
    public async closeAll(): Promise<void> {
        await connPool.end();
        return;
    }

    //public for testing
    public buildUpdateClause(updates: Partial<OmegaDalRecord>): string {
        const keys = Object.keys(updates);
        const pairs = keys.map(key => {
            return `${key} = ${mySql.escape(updates[key])}`;
        });
        return pairs.join(', ');
    }
    public buildCriteriaClause(criteria: OmegaCriteria): string {
        let criteriaClause = '';
        if (criteria._and && criteria._and.length > 0) {
            const pairs = this.mapCriteriaGroup(criteria._and);
            criteriaClause += pairs.join(' AND ');
        } else if (criteria._or && criteria._or.length > 0) {
            const pairs = this.mapCriteriaGroup(criteria._or);
            criteriaClause += pairs.join(' OR ');
        }
        return criteriaClause;
    }
    private mapCriteriaGroup(criteriaArray: Array<OmegaCriteria | OmegaCriterion | OmegaCriterionLinkTable>): string[] {
        const pairs = criteriaArray.map(item => {
            if ((item as OmegaCriteria)._and || (item as OmegaCriteria)._or) {
                const recursiveResult = this.buildCriteriaClause(item as OmegaCriteria);
                return '(' + recursiveResult + ')';
            }
            if ((item as OmegaCriterionLinkTable).targetTable) {
                const linkTableItem = item as OmegaCriterionLinkTable;
                const linkTableResult = this.buildCriteriaClause(linkTableItem.criteria);
                const linkTableSql = SELECT_ONLY_SQL.replace('{0}', linkTableItem.targetField)
                    .replace('{1}', linkTableItem.targetTable)
                    .replace('{2}', linkTableResult);
                return `${linkTableItem.sourceField} IN (${linkTableSql})`;
            }
            return `${(item as OmegaCriterion).field} = ${mySql.escape((item as OmegaCriterion).value)}`;
        });
        return pairs;
    }

    private async getDbConnection(): Promise<mySql.PoolConnection> {
        const dbPromise = new Promise(function(resolve: any, reject: any) {
            connPool.getConnection(function(err, conn) {
                if (conn) {
                    resolve(conn);
                } else {
                    reject(err);
                }
            });
        });

        return dbPromise as Promise<mySql.PoolConnection>;
    }
    private async getQueryResult(dbConn: mySql.PoolConnection, sql: string, data?: OmegaDalRecord): Promise<any> {
        const queryPromise = new Promise(function(resolve, reject) {
            dbConn.query(sql, data, function(err, results, fields) {
                if (results) {
                    resolve(results);
                } else {
                    reject(err);
                }
            });
        });

        return queryPromise;
    }
}
