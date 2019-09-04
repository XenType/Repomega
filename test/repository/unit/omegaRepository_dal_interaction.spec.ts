import { createOmegaDalMock, createOmegaDalSpies, assertDalUsageCounts } from './fixtures/omegaDalMocks';
import { OmegaRepository } from '../../../src/repository/omegaRepository';
import { OmegaDalRecord, OmegaCriteria, OmegaCriterion, OmegaCriterionLinkTable } from '../../../src/dal';
import { OmegaObject } from '../../../src/object/omegaObject';
import { createTestObject, createOrCriteria } from '../../fixtures';
import { cloneDeep } from 'lodash';
import { OmegaBaseObject } from '../../../src/object';
import { OmegaFieldValuePair } from '../../../src/repository';

const testMapPath = 'test/dal/integration/fixtures/integration-map.json';

describe('When using data access functions of an OmegaRepository', () => {
    describe('And calling persist with no return objects', () => {
        test('When passed a single new object, it interacts with the DAL as expected', async () => {
            const testObject = createTestObject(undefined, 'Market', 'USD', 1);
            await runPersistTest([testObject]);
        });
        test('When passed a multiple new objects, it interacts with the DAL as expected', async () => {
            const testObject1 = createTestObject(undefined, 'Market', 'USD', 1);
            const testObject2 = createTestObject(undefined, 'Market', 'USD', 2);
            await runPersistTest([testObject1, testObject2]);
        });
        test('When passed a single existing object, it interacts with the DAL as expected', async () => {
            const testObject = createTestObject(undefined, 'Market', 'USD', 1);
            await runPersistTest([testObject]);
        });
        test('When passed a mix of new and existing objects, it interacts with the DAL as expected', async () => {
            const testObject1 = createTestObject(undefined, 'Market', 'USD', 1);
            const testObject2 = createTestObject(undefined, 'Market', 'USD', 2);
            const testObject3 = createTestObject(undefined, 'Market', 'USD', 3);
            const testObject4 = createTestObject(undefined, 'Market', 'GBP', 4);
            await runPersistTest([testObject1, testObject2, testObject3, testObject4]);
        });
    });
    describe('And calling persist with return objects requested', () => {
        test('When passed a single new object, it interacts with the DAL as expected', async () => {
            const testObject = createTestObject(undefined, 'Market', 'USD', 1);
            await runPersistTest([testObject], true);
        });
        test('When passed a single existing object, it interacts with the DAL as expected', async () => {
            const testObject = createTestObject(undefined, 'Market', 'USD', 1);
            await runPersistTest([testObject], true);
        });
        test('When passed a mix of new and existing objects from different source tables, it interacts with the DAL as expected', async () => {
            const testObject1 = createTestObject(undefined, 'Market', 'USD', 1);
            const testObject2 = createTestObject(undefined, 'Market', 'USD', 2);
            const testObject3 = createTestObject(undefined, 'Company', 1);
            const testObject4 = createTestObject(undefined, 'Market', 'GBP');
            await runPersistTest([testObject1, testObject2, testObject3, testObject4], true);
        });
    });
    describe('And calling persistValue', () => {
        test('It interacts with the DAL as expected and completes without error when the object record exists', async () => {
            const mockDalUpdate = async (a: string, b: OmegaDalRecord, c: OmegaCriteria): Promise<number> => {
                return 1;
            };
            const mockDal = createOmegaDalMock(testMapPath, undefined, undefined, mockDalUpdate);
            const spyContainer = createOmegaDalSpies(mockDal);
            const testRepo = new OmegaRepository(mockDal);
            await testRepo.persistValue('Market', { fieldName: 'name', fieldValue: 'New Market' }, 123);
            assertDalUsageCounts(spyContainer, 0, 0, 1);
            expect(spyContainer.spyUpdate).toBeCalledWith(
                'test_market',
                { market_name: 'New Market' },
                { _and: [{ field: 'test_market_id', value: 123 }] }
            );
        });
    });
    describe('And calling retrieveOne for an existing object', () => {
        test('It interacts with the DAL as expected and returns a valid object', async () => {
            const expectedTableName = 'Market';
            const expectedIdentityValue = 1;
            const expectedDalRecord = {
                test_market_id: expectedIdentityValue,
                market_name: 'Uptown',
                currency: 'USD'
            };
            const expectedFieldList = ['test_market_id', 'market_name', 'currency'];
            await runRetrieveOneTest(expectedTableName, expectedIdentityValue, expectedFieldList, expectedDalRecord);
        });
    });
    describe('And calling retrieveOne for an non-existing object', () => {
        test('It interacts with the DAL as expected and returns null', async () => {
            const expectedTableName = 'Market';
            const expectedIdentityValue = 2;
            const expectedFieldList = ['test_market_id', 'market_name', 'currency'];
            await runRetrieveOneTest(expectedTableName, expectedIdentityValue, expectedFieldList);
        });
    });
    describe('And calling retrieveOneValue for an existing object', () => {
        test('It interacts with the DAL as expected and returns correct value', async () => {
            const expectedTableName = 'BasicTests';
            const expectedFieldName = 'internalTest';
            const expectedFieldParams = {
                fieldName: 'test_basic_internal',
                fieldValue: 11
            };
            const expectedDalRecord = {
                test_basic_internal: 'testing'
            };
            await runRetrieveOneValueTest(expectedTableName, expectedFieldName, expectedFieldParams, expectedDalRecord);
        });
    });
    describe('And calling retrieveOneValue for a non-existing object', () => {
        test('It interacts with the DAL as expected and returns null', async () => {
            const expectedTableName = 'BasicTests';
            const expectedFieldName = 'internalTest';
            const expectedFieldParams = {
                fieldName: 'test_basic_internal',
                fieldValue: 11
            };
            await runRetrieveOneValueTest(expectedTableName, expectedFieldName, expectedFieldParams);
        });
    });
    describe('And calling retrieveMany with criteria that yields results', () => {
        test('It interacts with the DAL as expected and returns an array of valid objects', async () => {
            const expectedTableName = 'Market';
            const externalCriteria = createOrCriteria(['currencyType', 'name'], ['USD', 'Also Included']);
            const expectedFieldList = ['test_market_id', 'market_name', 'currency'];
            const expectedDalRecords = [
                { test_market_id: 1, market_name: 'Upstate', currency: 'USD' },
                { test_market_id: 2, market_name: 'Upstate', currency: 'USD' },
                { test_market_id: 3, market_name: 'Also included', currency: 'GBP' }
            ];
            await runRetrieveManyTest(expectedTableName, externalCriteria, expectedFieldList, expectedDalRecords);
        });
    });
    describe('And calling retrieveMany with criteria that does not yield results', () => {
        test('It interacts with the DAL as expected and returns an array of valid objects', async () => {
            const expectedTableName = 'Market';
            const externalCriteria = createOrCriteria(['currencyType', 'name'], ['USD', 'Also Included']);
            const expectedFieldList = ['test_market_id', 'market_name', 'currency'];
            const expectedDalRecords = [];
            await runRetrieveManyTest(expectedTableName, externalCriteria, expectedFieldList, expectedDalRecords);
        });
    });
    describe('And calling deleteOne with criteria that matches one record', () => {
        test('It interacts with the DAL as expected and returns the number 1', async () => {
            const externalTableName = 'Market';
            const targetRecordId = 1;
            const mockDalDelete = async function(table: string, criteria: OmegaCriteria): Promise<number> {
                return 1;
            };
            const mockDal = createOmegaDalMock(testMapPath, undefined, undefined, undefined, mockDalDelete);
            const spyContainer = createOmegaDalSpies(mockDal);
            const testRepo = new OmegaRepository(mockDal);
            const actualResult = await testRepo.deleteOne(externalTableName, targetRecordId);
            const expectedTableName = testRepo.getTableMap(externalTableName).name;
            const expectedOmegaCriteria = testRepo.createIdentityCriteria(externalTableName, targetRecordId);
            assertDalUsageCounts(spyContainer, 0, 0, 0, 1);
            expect(spyContainer.spyDelete).toHaveBeenCalledWith(expectedTableName, expectedOmegaCriteria);
            expect(actualResult).toEqual(1);
        });
    });
    describe('And calling deleteMany with criteria that matches records', () => {
        test('It interacts with the DAL as expected and returns the number of deleted records', async () => {
            const externalTableName = 'Market';
            const externalCriteria: OmegaCriteria = {
                _and: [{ field: 'currencyType', value: 'YIN' }]
            };
            const mockDalDelete = async function(table: string, criteria: OmegaCriteria): Promise<number> {
                return 6;
            };
            const mockDal = createOmegaDalMock(testMapPath, undefined, undefined, undefined, mockDalDelete);
            const spyContainer = createOmegaDalSpies(mockDal);
            const testRepo = new OmegaRepository(mockDal);
            const expectedTableName = testRepo.getTableMap(externalTableName).name;
            const expectedOmegaCriteria = testRepo.mapExternalCriteriaToDalCriteria(
                externalTableName,
                externalCriteria
            );
            const actualResult = await testRepo.deleteMany(externalTableName, externalCriteria);
            expect(spyContainer.spyDelete).toHaveBeenCalledWith(expectedTableName, expectedOmegaCriteria);
            expect(actualResult).toEqual(6);
        });
    });
});

async function runRetrieveManyTest(
    externalTableName: string,
    externalCriteria: OmegaCriteria,
    expectedFieldList: string[],
    expectedDalRecords: OmegaDalRecord[]
): Promise<void> {
    const mockDalRead = async function(source: string, criteria: OmegaCriteria): Promise<OmegaDalRecord[]> {
        return expectedDalRecords;
    };
    const mockDal = createOmegaDalMock(testMapPath, undefined, mockDalRead);
    const spyContainer = createOmegaDalSpies(mockDal);
    const testRepo = new OmegaRepository(mockDal);
    const expectedTableName = testRepo.getTableMap(externalTableName).name;
    const expectedOmegaCriteria = await testRepo.mapExternalCriteriaToDalCriteria(externalTableName, externalCriteria);
    const actualOmegaObjects = await testRepo.retrieveMany(externalTableName, externalCriteria);
    assertDalUsageCounts(spyContainer, 0, 1);
    expect(spyContainer.spyRead).toHaveBeenCalledWith(expectedTableName, expectedOmegaCriteria, expectedFieldList);
    if (expectedDalRecords.length > 0) {
        // actualOmegaObjects.forEach((actualOmegaObject: OmegaObject, index: number) => {
        for (const [index, actualOmegaObject] of actualOmegaObjects.entries()) {
            const expectedOmegaObject = await testRepo.mapRecordToObject(externalTableName, expectedDalRecords[index]);
            expect(actualOmegaObject).toStrictEqual(expectedOmegaObject);
        }
    } else {
        expect(actualOmegaObjects).toStrictEqual([]);
    }
}

async function runRetrieveOneValueTest(
    externalTableName: string,
    expectedFieldName: string,
    expectedFieldParams: OmegaFieldValuePair,
    expectedDalRecord?: OmegaDalRecord
): Promise<void> {
    const mockDalReadReturn = expectedDalRecord ? [expectedDalRecord] : [];
    const mockDalRead = async function(source: string, criteria: OmegaCriteria): Promise<OmegaDalRecord[]> {
        return mockDalReadReturn;
    };
    const mockDal = createOmegaDalMock(testMapPath, undefined, mockDalRead);
    const spyContainer = createOmegaDalSpies(mockDal);
    const testRepo = new OmegaRepository(mockDal);
    const expectedTableName = testRepo.getTableMap(externalTableName).name;
    const expectedOmegaCriteria = testRepo.createIdentityCriteria(
        externalTableName,
        expectedFieldParams.fieldValue as number
    );
    const actualValue = await testRepo.retrieveOneValue(
        externalTableName,
        expectedFieldName,
        expectedFieldParams.fieldValue as number
    );
    assertDalUsageCounts(spyContainer, 0, 1);
    expect(spyContainer.spyRead).toHaveBeenCalledWith(expectedTableName, expectedOmegaCriteria, [
        expectedFieldParams.fieldName
    ]);
    if (expectedDalRecord) {
        expect(actualValue).toEqual(expectedDalRecord[expectedFieldParams.fieldName]);
    } else {
        expect(actualValue).toBeNull();
    }
}

async function runRetrieveOneTest(
    externalTableName: string,
    expectedIdentityValue: string | number,
    expectedFieldList: string[],
    expectedDalRecord?: OmegaDalRecord
): Promise<void> {
    const mockDalReadReturn = expectedDalRecord ? [expectedDalRecord] : [];
    const mockDalRead = async function(source: string, criteria: OmegaCriteria): Promise<OmegaDalRecord[]> {
        return mockDalReadReturn;
    };
    const mockDal = createOmegaDalMock(testMapPath, undefined, mockDalRead);
    const spyContainer = createOmegaDalSpies(mockDal);
    const testRepo = new OmegaRepository(mockDal);
    const expectedTableName = testRepo.getTableMap(externalTableName).name;
    const expectedOmegaCriteria = testRepo.createIdentityCriteria(externalTableName, expectedIdentityValue);
    const actualOmegaObject = await testRepo.retrieveOne(externalTableName, expectedIdentityValue);
    assertDalUsageCounts(spyContainer, 0, 1);
    expect(spyContainer.spyRead).toHaveBeenCalledWith(expectedTableName, expectedOmegaCriteria, expectedFieldList);
    if (expectedDalRecord) {
        const expectedOmegaObject = await testRepo.mapRecordToObject(externalTableName, expectedDalRecord);
        expect(actualOmegaObject).toStrictEqual(expectedOmegaObject);
    } else {
        expect(actualOmegaObject).toBeNull();
    }
}

async function runPersistTest(objectArray: Array<OmegaBaseObject>, returnObjects?: boolean) {
    const preDal = createOmegaDalMock(testMapPath);
    const preRepo = new OmegaRepository(preDal);
    const createParam1Array: string[] = [];
    const createParam2Array: OmegaDalRecord[] = [];
    const updateParam1Array: string[] = [];
    const updateParam2Array: OmegaDalRecord[] = [];
    const updateParam3Array: OmegaCriteria[] = [];
    let newIdentityStart = 100;
    const affectedRecordArray: OmegaDalRecord[] = [];
    const newRecordIdentities: Array<string | number> = [];
    for (const testObject of objectArray) {
        const tableMap = preDal.mapper.getTableMap(testObject.objectSource);
        const identityValue = testObject.objectData[tableMap.identity] as string | number;
        if (identityValue !== undefined) {
            updateParam1Array.push(tableMap.name);
            const affectedRecord = await preRepo.mapObjectToRecord(testObject);
            updateParam2Array.push(affectedRecord);
            affectedRecordArray.push(affectedRecord);
            updateParam3Array.push(preRepo.createIdentityCriteria(testObject.objectSource, identityValue));
        } else {
            createParam1Array.push(tableMap.name);
            const affectedRecord = await preRepo.mapObjectToRecord(testObject);
            createParam2Array.push(cloneDeep(affectedRecord));
            newIdentityStart++;
            newRecordIdentities.push(newIdentityStart);
            affectedRecord[tableMap.fields[tableMap.identity].name] = newIdentityStart;
            affectedRecordArray.push(affectedRecord);
        }
    }
    const readTimes = returnObjects ? affectedRecordArray.length : 0;
    let mockDalCreate = undefined;
    let mockDalRead = undefined;
    let newItemIndex = -1;
    if (returnObjects) {
        mockDalCreate = async function(table: string, newRecord: OmegaDalRecord): Promise<string | number> {
            newItemIndex++;
            return newRecordIdentities[newItemIndex];
        };
        mockDalRead = async function(table: string, criteria: OmegaCriteria): Promise<OmegaDalRecord[]> {
            const result = affectedRecordArray.find(record => {
                return (
                    record[(criteria._and[0] as OmegaCriterion).field] &&
                    record[(criteria._and[0] as OmegaCriterion).field] === (criteria._and[0] as OmegaCriterion).value
                );
            });
            return [result];
        };
    }
    const mockDal = createOmegaDalMock(testMapPath, mockDalCreate, mockDalRead);
    const spyContainer = createOmegaDalSpies(mockDal);
    const testRepo = new OmegaRepository(mockDal);
    const actualResults = await testRepo.persist(objectArray, returnObjects);
    assertDalUsageCounts(spyContainer, createParam1Array.length, readTimes, updateParam1Array.length, 0);
    for (let i = 0; i < createParam1Array.length; i++) {
        expect(spyContainer.spyCreate).toHaveBeenCalledWith(createParam1Array[i], createParam2Array[i]);
    }
    for (let i = 0; i < updateParam1Array.length; i++) {
        expect(spyContainer.spyUpdate).toHaveBeenCalledWith(
            updateParam1Array[i],
            updateParam2Array[i],
            updateParam3Array[i]
        );
    }
    if (returnObjects) {
        objectArray.forEach((omegaObject: OmegaObject, index: number) => {
            const tableMap = mockDal.mapper.getTableMap(omegaObject.objectSource);
            omegaObject.objectData[tableMap.identity] = actualResults[index].objectData[tableMap.identity];
            expect(actualResults[index]).toStrictEqual(omegaObject as OmegaObject);
        });
    }
}
