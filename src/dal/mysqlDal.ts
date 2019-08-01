import * as mySql from 'mysql';
import { IOmegaDal, OmegaDalRecord, OmegaCriteria, OmegaCriterion } from '.';
import { OmegaTableIndex } from '../mapper';
import { FlatMapper } from '../mapper/flatMapper';

// Responsibilities of the DAL:
// Build SQL statments
// Execute SQL statements
// Return analytics
// SHOULD NOT:
// Do translations
// Do validations

let connPool: mySql.Pool;
const INSERT_SQL = 'INSERT INTO {0} SET ?';
const SELECT_SQL = 'SELECT * FROM {0} WHERE {1}';
const UPDATE_SQL = 'UPDATE {0} SET {1} WHERE {2}';
const DELETE_SQL = 'DELETE FROM {0} WHERE {1}';

export class MySqlDal implements IOmegaDal {
    tableList: OmegaTableIndex;
    public mapper: FlatMapper;
    constructor(useTestConn: boolean = false) {
        if (useTestConn) {
            this.mapper = new FlatMapper('test/mapper/fixtures/flat-table-map-fixture.json');
            connPool = mySql.createPool({
                connectionLimit: 10,
                host: 'localhost',
                user: 'omegaint',
                password: 'dev1PASS@',
                database: 'omegaintegrationtest'
            });
        } else {
            this.mapper = new FlatMapper('src/dals/mapping/dal-mySqlMap.json');
            throw new Error('NOT IMPLEMENTED');
            // connPool = mySql.createPool({
            //     connectionLimit: 10,
            //     host: 'localhost',
            //     user: 'mailcallweb',
            //     password: 'dev1pass@',
            //     database: 'mailcall'
            // });
        }
        this.tableList = this.mapper.getTableIndex();
    }
    public async create(table: string, newRecord: OmegaDalRecord): Promise<string | number> {
        const dbConn = await this.getDbConnection();
        const sql = INSERT_SQL.replace('{0}', table);
        const sqlResult = await this.getQueryResult(dbConn, sql, newRecord);
        return sqlResult.insertId;
    }
    public async retrieve(table: string, criteria: OmegaCriteria): Promise<OmegaDalRecord[]> {
        const dbConn = await this.getDbConnection();
        const sqlWhereClause = this.buildCriteriaClause(criteria);
        const sqlWithTable = SELECT_SQL.replace('{0}', table);
        const sql = sqlWithTable.replace('{1}', sqlWhereClause);
        const sqlResult = await this.getQueryResult(dbConn, sql);
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
        return sqlResult.affectedRows;
    }
    // returns number of objects deleted
    public async delete(table: string, criteria: OmegaCriteria): Promise<number> {
        const dbConn = await this.getDbConnection();
        const sqlWhereClause = this.buildCriteriaClause(criteria);
        const sqlWithTable = DELETE_SQL.replace('{0}', table);
        const sql = sqlWithTable.replace('{1}', sqlWhereClause);
        const sqlResult = await this.getQueryResult(dbConn, sql);
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
    private mapCriteriaGroup(criteriaArray: Array<OmegaCriteria | OmegaCriterion>): string[] {
        const pairs = criteriaArray.map((item: OmegaCriterion | OmegaCriteria) => {
            if ((item as OmegaCriteria)._and || (item as OmegaCriteria)._or) {
                const recursiveResult = this.buildCriteriaClause(item as OmegaCriteria);
                return '(' + recursiveResult + ')';
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
