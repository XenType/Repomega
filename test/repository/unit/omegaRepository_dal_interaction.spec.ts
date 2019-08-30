import { createOmegaDalMock, createOmegaDalSpies, assertDalUsageCounts } from './fixtures/omegaDalMocks';
import { OmegaRepository } from '../../../src/repository/omegaRepository';
import { OmegaDalRecord, OmegaCriteria, OmegaCriterion, OmegaCriterionLinkTable } from '../../../src/dal';
import { OmegaObject } from '../../../src/object/omegaObject';
import { createTestObject, createOrCriteria } from '../../fixtures';
import { cloneDeep } from 'lodash';

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

    describe('And calling retrieveOne for an existing object', () => {
        test('It interacts with the DAL as expected and returns a valid object', async () => {
            const expectedTableName = 'Market';
            const expectedIdentityValue = 1;
            const expectedDalRecord = {
                test_market_id: expectedIdentityValue,
                market_name: 'Uptown',
                currency: 'USD'
            };
            await runRetrieveOneTest(expectedTableName, expectedIdentityValue, expectedDalRecord);
        });
    });
    describe('And calling retrieveOne for an non-existing object', () => {
        test('It interacts with the DAL as expected and returns null', async () => {
            const expectedTableName = 'Market';
            const expectedIdentityValue = 2;
            await runRetrieveOneTest(expectedTableName, expectedIdentityValue);
        });
    });
    describe('And calling retrieveMany with criteria that yields results', () => {
        test('It interacts with the DAL as expected and returns an array of valid objects', async () => {
            const expectedTableName = 'Market';
            const externalCriteria = createOrCriteria(['currencyType', 'name'], ['USD', 'Also Included']);
            const expectedDalRecords = [
                { test_market_id: 1, market_name: 'Upstate', currency: 'USD' },
                { test_market_id: 2, market_name: 'Upstate', currency: 'USD' },
                { test_market_id: 3, market_name: 'Also included', currency: 'GBP' }
            ];
            await runRetrieveManyTest(expectedTableName, externalCriteria, expectedDalRecords);
        });
    });
    describe('And calling retrieveMany with criteria that does not yield results', () => {
        test('It interacts with the DAL as expected and returns an array of valid objects', async () => {
            const expectedTableName = 'Market';
            const externalCriteria = createOrCriteria(['currencyType', 'name'], ['USD', 'Also Included']);
            const expectedDalRecords = [];
            await runRetrieveManyTest(expectedTableName, externalCriteria, expectedDalRecords);
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
    // describe('And calling persistTableLink', () => {
    //     describe('When a table link already exists', () => {
    //         xtest('It interacts with the DAL as expected', async () => {
    //             const externalTargetTable = 'OptionGroup';
    //             const expectedTargetId = 1;
    //             const expectedSourceId = 2;
    //             const expectedDalRecord = {
    //                 test_user_id: expectedSourceId,
    //                 test_group_id: 'Uptown',
    //                 currency: 'USD'
    //             };
    //             // const mockDalRead = async function (table: string, criteria: OmegaCriteria): Promise<OmegaDalRecord> {
    //             //     return [{ a: 1 }];
    //             // };
    //         });
    //     });
    //     describe('When a table link does not exist', () => {
    //         xtest('It interacts with the DAL as expected', async () => {
    //             // test
    //         });
    //     });
    // });
    // describe('And calling deleteTableLink', () => {
    //     xtest('It interacts with the DAL as expected', async () => {
    //         // test
    //     });
    // });
});

async function runRetrieveManyTest(
    externalTableName: string,
    externalCriteria: OmegaCriteria,
    expectedDalRecords: OmegaDalRecord[]
): Promise<void> {
    const mockDalRead = async function(source: string, criteria: OmegaCriteria): Promise<OmegaDalRecord[]> {
        return expectedDalRecords;
    };
    const mockDal = createOmegaDalMock(testMapPath, undefined, mockDalRead);
    const spyContainer = createOmegaDalSpies(mockDal);
    const testRepo = new OmegaRepository(mockDal);
    const expectedTableName = testRepo.getTableMap(externalTableName).name;
    const expectedOmegaCriteria = testRepo.mapExternalCriteriaToDalCriteria(externalTableName, externalCriteria);
    const actualOmegaObjects = await testRepo.retrieveMany(externalTableName, externalCriteria);
    assertDalUsageCounts(spyContainer, 0, 1);
    expect(spyContainer.spyRead).toHaveBeenCalledWith(expectedTableName, expectedOmegaCriteria);
    if (expectedDalRecords.length > 0) {
        actualOmegaObjects.forEach((actualOmegaObject: OmegaObject, index: number) => {
            const expectedOmegaObject = testRepo.mapRecordToObject(externalTableName, expectedDalRecords[index]);
            expect(actualOmegaObject).toStrictEqual(expectedOmegaObject);
        });
    } else {
        expect(actualOmegaObjects).toStrictEqual([]);
    }
}

async function runRetrieveOneTest(
    externalTableName: string,
    expectedIdentityValue: string | number,
    expectedDalRecord?: OmegaDalRecord
): Promise<void> {
    const mockDalReadReturn = expectedDalRecord ? [expectedDalRecord] : [];
    const mockDalRead = async function(source: string, criteria: OmegaCriteria): Promise<OmegaDalRecord[]> {
        return mockDalReadReturn;
    };
    const mockDal = createOmegaDalMock(testMapPath, undefined, mockDalRead);
    const createSpy = jest.spyOn(mockDal, 'create');
    const readSpy = jest.spyOn(mockDal, 'read');
    const updateSpy = jest.spyOn(mockDal, 'update');
    const deleteSpy = jest.spyOn(mockDal, 'delete');
    const spyContainer = createOmegaDalSpies(mockDal);
    const testRepo = new OmegaRepository(mockDal);
    const expectedTableName = testRepo.getTableMap(externalTableName).name;
    const expectedOmegaCriteria = testRepo.createIdentityCriteria(externalTableName, expectedIdentityValue);
    const actualOmegaObject = await testRepo.retrieveOne(externalTableName, expectedIdentityValue);
    assertDalUsageCounts(spyContainer, 0, 1);
    expect(createSpy).toHaveBeenCalledTimes(0);
    expect(readSpy).toHaveBeenCalledTimes(1);
    expect(readSpy).toHaveBeenCalledWith(expectedTableName, expectedOmegaCriteria);
    expect(updateSpy).toHaveBeenCalledTimes(0);
    expect(deleteSpy).toHaveBeenCalledTimes(0);
    if (expectedDalRecord) {
        const expectedOmegaObject = testRepo.mapRecordToObject(externalTableName, expectedDalRecord);
        expect(actualOmegaObject).toStrictEqual(expectedOmegaObject);
    } else {
        expect(actualOmegaObject).toBeNull();
    }
}

async function runPersistTest(objectArray: Array<Partial<OmegaObject>>, returnObjects?: boolean) {
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
    objectArray.forEach(testObject => {
        const tableMap = preDal.mapper.getTableMap(testObject.objectSource);
        const identityValue = testObject.objectData[tableMap.identity] as string | number;
        if (identityValue !== undefined) {
            updateParam1Array.push(tableMap.name);
            const affectedRecord = preRepo.mapObjectToRecord(testObject);
            updateParam2Array.push(affectedRecord);
            affectedRecordArray.push(affectedRecord);
            updateParam3Array.push(preRepo.createIdentityCriteria(testObject.objectSource, identityValue));
        } else {
            createParam1Array.push(tableMap.name);
            const affectedRecord = preRepo.mapObjectToRecord(testObject);
            createParam2Array.push(cloneDeep(affectedRecord));
            newIdentityStart++;
            newRecordIdentities.push(newIdentityStart);
            affectedRecord[tableMap.fields[tableMap.identity].name] = newIdentityStart;
            affectedRecordArray.push(affectedRecord);
        }
    });
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
