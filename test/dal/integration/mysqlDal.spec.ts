import { MySqlDal } from '../../../src/dal/mysqlDal';
import { OmegaDalRecord, OmegaCriteria } from '../../../src/dal';

const integrationConfig = {
    connectionLimit: 10,
    host: 'localhost',
    user: 'omegaint',
    password: 'dev1PASS@',
    database: 'omegaintegrationtest'
};
const integrationMapPath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
const mysqlDal = new MySqlDal(integrationConfig, integrationMapPath);
const tableIndex = mysqlDal.mapper.getTableIndex();

describe('When using exposed utility methods of mysqlDal', () => {
    describe('And when using buildCriteriaClause', () => {
        test('And building a one-AND parameter clause it returns the expected string', () => {
            const testCriteria: OmegaCriteria = {
                _and: [{ field: 'abc', value: 1 }]
            };
            const actualResult = mysqlDal.buildCriteriaClause(testCriteria);
            expect(actualResult).toEqual('abc = 1');
        });
        test('And building a two-AND parameter clause it returns the expected string', () => {
            const testCriteria: OmegaCriteria = {
                _and: [{ field: 'abc', value: 1 }, { field: 'def', value: '3' }]
            };
            const actualResult = mysqlDal.buildCriteriaClause(testCriteria);
            expect(actualResult).toEqual("abc = 1 AND def = '3'");
        });
        test('And building a three-AND-subLast-one-AND parameter clause it returns the expected string', () => {
            const testCriteria: OmegaCriteria = {
                _and: [
                    { field: 'abc', value: 1 },
                    { field: 'def', value: '3' },
                    { _and: [{ field: 'ghi', value: '444' }] }
                ]
            };
            const actualResult = mysqlDal.buildCriteriaClause(testCriteria);
            expect(actualResult).toEqual("abc = 1 AND def = '3' AND (ghi = '444')");
        });
        test('And building a two-AND-subFirst-two-AND-subSecond-two-OR parameter clause it returns expected string', () => {
            const testCriteria: OmegaCriteria = {
                _and: [
                    { _and: [{ field: 'abc', value: 1 }, { field: 'def', value: '3' }] },
                    { _or: [{ field: 'ghi', value: '444' }, { field: 'jkl', value: '555' }] }
                ]
            };
            const actualResult = mysqlDal.buildCriteriaClause(testCriteria);
            expect(actualResult).toEqual("(abc = 1 AND def = '3') AND (ghi = '444' OR jkl = '555')");
        });
        test('And building a simple TableLink clause', () => {
            const testCriteria: OmegaCriteria = {
                _and: [
                    {
                        sourceField: 'primaryCriteria',
                        targetTable: 'secondary',
                        targetField: 'secondaryId',
                        criteria: {
                            _and: [{ field: 'abc', value: 1 }]
                        }
                    }
                ]
            };
            const actualResult = mysqlDal.buildCriteriaClause(testCriteria);
            expect(actualResult).toEqual('primaryCriteria IN (SELECT secondaryId FROM secondary WHERE abc = 1)');
        });
        test('And building a nested TableLink clause', () => {
            const testCriteria: OmegaCriteria = {
                _and: [
                    {
                        sourceField: 'primaryCriteria',
                        targetTable: 'secondary',
                        targetField: 'secondaryId',
                        criteria: {
                            _and: [
                                {
                                    sourceField: 'secondaryCriteria',
                                    targetTable: 'tertiary',
                                    targetField: 'tertiaryId',
                                    criteria: {
                                        _and: [{ field: 'abc', value: 1 }]
                                    }
                                }
                            ]
                        }
                    }
                ]
            };
            const actualResult = mysqlDal.buildCriteriaClause(testCriteria);
            expect(actualResult).toEqual(
                'primaryCriteria IN (SELECT secondaryId FROM secondary WHERE secondaryCriteria IN (SELECT tertiaryId FROM tertiary WHERE abc = 1))'
            );
        });
        test('And building a complex parameter clause it returns expected string', () => {
            const testCriteria: OmegaCriteria = {
                _and: [
                    { _and: [{ field: 'abc', value: 1 }, { field: 'def', value: '3' }] },
                    { _or: [{ field: 'ghi', value: '444' }, { field: 'jkl', value: '555' }] },
                    {
                        _or: [
                            { field: 'mno', value: 3 },
                            { field: 'pqr', value: 5 },
                            {
                                sourceField: 'sourceField1',
                                targetTable: 'link1',
                                targetField: 'linkField1',
                                criteria: {
                                    _or: [{ field: 'linkCriteria1', value: 1 }, { field: 'linkCriteria2', value: 2 }]
                                }
                            },
                            {
                                _and: [
                                    { field: 'stu', value: 'aa2' },
                                    { field: 'vwx', value: 2 },
                                    {
                                        _or: [{ field: 'yyy', value: 'aaa' }, { field: 'zzz', value: 'bbb' }]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };
            const actualResult = mysqlDal.buildCriteriaClause(testCriteria);
            expect(actualResult).toEqual(
                "(abc = 1 AND def = '3') AND (ghi = '444' OR jkl = '555') AND (mno = 3 OR pqr = 5 OR sourceField1 IN (SELECT linkField1 FROM link1 WHERE linkCriteria1 = 1 OR linkCriteria2 = 2) OR (stu = 'aa2' AND vwx = 2 AND (yyy = 'aaa' OR zzz = 'bbb')))"
            );
        });
    });
    test('And building a single item update clause it returns the expected string', () => {
        const updates = {
            abc: 1
        };
        const actualResult = mysqlDal.buildUpdateClause(updates);
        expect(actualResult).toEqual('abc = 1');
    });
    test('And building a multiple item update clause it returns the expected string', () => {
        const updates = {
            abc: 1,
            def: '2',
            ghi: 'stuff'
        };
        const actualResult = mysqlDal.buildUpdateClause(updates);
        expect(actualResult).toEqual("abc = 1, def = '2', ghi = 'stuff'");
    });
});
describe('When using a live mysqlDal', () => {
    describe('And creating a record', () => {
        test('BasicTest table accepts a valid command and returns a valid id', async () => {
            const testRecord: OmegaDalRecord = {
                test_basic_string: 'abcd',
                test_basic_number: 1,
                test_basic_date: new Date(),
                test_basic_null: null
            };
            const actualResult = await mysqlDal.create(tableIndex['BasicTests'], testRecord);
            expect(actualResult).not.toBeUndefined();
            expect(actualResult).not.toBeNull();
            expect(actualResult).not.toEqual(0);
            expect(actualResult).toBeGreaterThan(0);
        });
    });
    describe('And deleting a record', () => {
        test('BasicTest table accepts a valid command and returns a valid count', async () => {
            const testCriteria: OmegaCriteria = {
                _and: [{ field: 'test_basic_number', value: 1 }]
            };
            const actualResult = await mysqlDal.delete(tableIndex['BasicTests'], testCriteria);
            expect(actualResult).not.toBeUndefined();
            expect(actualResult).not.toBeNull();
            expect(actualResult).not.toEqual(0);
        });
    });
    describe('And retrieving a record', () => {
        test('OptionGroup table accepts a valid query and returns expected row', async () => {
            const testCriteria: OmegaCriteria = {
                _and: [{ field: 'test_group_id', value: 1 }]
            };
            const actualResult = await mysqlDal.read(tableIndex['OptionGroup'], testCriteria);
            expect(actualResult).not.toBeUndefined();
            expect(actualResult).not.toBeNull();
            expect(actualResult.length).toEqual(1);
            expect(actualResult[0]['group_name']).toEqual('Group One');
        });
        test('When a fieldList is provided, the returned fields are limited to it', async () => {
            const testCriteria: OmegaCriteria = {
                _and: [{ field: 'test_group_id', value: 1 }]
            };
            const fieldList: string[] = ['test_group_id'];
            const actualResult = await mysqlDal.read(tableIndex['OptionGroup'], testCriteria, fieldList);
            expect(actualResult).not.toBeUndefined();
            expect(actualResult).not.toBeNull();
            expect(actualResult.length).toEqual(1);
            expect(actualResult[0]['group_name']).toBeUndefined();
        });
    });
    describe('And updating a set of records', () => {
        test('BasicTest table accepts a valid command and returns a valid count', async () => {
            const testCriteria: OmegaCriteria = {
                _and: [{ field: 'test_basic_string', value: 'update' }]
            };
            const testUpdates: Partial<OmegaDalRecord> = {
                test_basic_number: 3,
                test_basic_date: new Date()
            };
            const actualResult = await mysqlDal.update(tableIndex['BasicTests'], testUpdates, testCriteria);
            expect(actualResult).not.toBeUndefined();
            expect(actualResult).not.toBeNull();
            expect(actualResult).toEqual(3);
        });
    });
    afterAll(async () => {
        await mysqlDal.closeAll();
    });
});
