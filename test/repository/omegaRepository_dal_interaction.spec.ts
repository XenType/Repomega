import { createOmegaDalMock } from './fixtures/omegaDalMocks';
import { OmegaRepository } from '../../src/repository/omegaRepository';
import { IOmegaObject } from '../../src/object';
import { OmegaDalRecord, OmegaCriteria, OmegaCriterion } from '../../src/dal';
import { OmegaObject } from '../../src/object/omegaObject';
import { cloneDeep } from 'lodash';

const testMapPath = 'test/repository/fixtures/mapping-function-testMap.json';

describe('When using data access functions of an OmegaRepository', () => {
    describe('And calling persist with no return objects', () => {
        test('When passed a single new object, it interacts with the DAL as expected', async () => {
            const testObject = new OmegaObject(undefined);
            testObject.objectSource = 'Market';
            testObject.objectData = {
                name: 'Midstate',
                currencyType: 'USD'
            };
            await runPersistTest([testObject]);
        });

        test('When passed a multiple new objects, it interacts with the DAL as expected', async () => {
            const testObject1 = new OmegaObject(undefined);
            testObject1.objectSource = 'Market';
            testObject1.objectData = {
                name: 'Upstate',
                currencyType: 'USD'
            };
            const testObject2 = new OmegaObject(undefined);
            testObject2.objectSource = 'Market';
            testObject2.objectData = {
                name: 'Downstate',
                currencyType: 'USD'
            };
            await runPersistTest([testObject1, testObject2]);
        });
        test('When passed a single existing object, it interacts with the DAL as expected', async () => {
            const testObject = new OmegaObject(undefined);
            testObject.objectSource = 'Market';
            testObject.objectData = {
                id: 1,
                name: 'Midstate',
                currencyType: 'USD'
            };
            await runPersistTest([testObject]);
        });
        test('When passed a mix of new and existing objects, it interacts with the DAL as expected', async () => {
            const testObject1 = new OmegaObject(undefined);
            testObject1.objectSource = 'Market';
            testObject1.objectData = {
                id: 1,
                name: 'Midstate',
                currencyType: 'USD'
            };
            const testObject2 = new OmegaObject(undefined);
            testObject2.objectSource = 'Market';
            testObject2.objectData = {
                id: 2,
                name: 'Upstate',
                currencyType: 'USD'
            };
            const testObject3 = new OmegaObject(undefined);
            testObject3.objectSource = 'Market';
            testObject3.objectData = {
                name: 'Downstate',
                currencyType: 'USD'
            };
            const testObject4 = new OmegaObject(undefined);
            testObject4.objectSource = 'Market';
            testObject4.objectData = {
                name: 'Out of state',
                currencyType: 'GBP'
            };
            await runPersistTest([testObject1, testObject2, testObject3, testObject4]);
        });
    });
    describe('And calling persist with return objects requested', () => {
        test('When passed a single new object, it interacts with the DAL as expected', async () => {
            const testObject = new OmegaObject(undefined);
            testObject.objectSource = 'Market';
            testObject.objectData = {
                name: 'Midstate',
                currencyType: 'USD'
            };
            await runPersistTest([testObject], true);
        });
        test('When passed a single existing object, it interacts with the DAL as expected', async () => {
            const testObject = new OmegaObject(undefined);
            testObject.objectSource = 'Market';
            testObject.objectData = {
                id: 1,
                name: 'Midstate',
                currencyType: 'USD'
            };
            await runPersistTest([testObject], true);
        });
        test('When passed a mix of new and existing objects from different source tables, it interacts with the DAL as expected', async () => {
            const testObject1 = new OmegaObject(undefined);
            testObject1.objectSource = 'Market';
            testObject1.objectData = {
                id: 1,
                name: 'Midstate',
                currencyType: 'USD'
            };
            const testObject2 = new OmegaObject(undefined);
            testObject2.objectSource = 'Market';
            testObject2.objectData = {
                id: 2,
                name: 'Upstate',
                currencyType: 'USD'
            };
            const testObject3 = new OmegaObject(undefined);
            testObject3.objectSource = 'Company';
            testObject3.objectData = {
                name: 'Generic Co',
                marketId: 1
            };
            const testObject4 = new OmegaObject(undefined);
            (testObject4.objectSource = 'Market'),
                (testObject4.objectData = {
                    name: 'Out of state',
                    currencyType: 'GBP'
                });
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
            const externalCriteria: OmegaCriteria = {
                _or: [{ field: 'currencyType', value: 'USD' }, { field: 'name', value: 'Also Included' }]
            };
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
            const externalCriteria: OmegaCriteria = {
                _and: [{ field: 'currencyType', value: 'USD' }, { field: 'name', value: 'Also Included' }]
            };
            const expectedDalRecords = [];
            await runRetrieveManyTest(expectedTableName, externalCriteria, expectedDalRecords);
        });
    });
});

async function runRetrieveManyTest(
    expectedTableName: string,
    externalCriteria: OmegaCriteria,
    expectedDalRecords: OmegaDalRecord[]
): Promise<void> {
    const mockDalRead = async function(source: string, criteria: OmegaCriteria): Promise<OmegaDalRecord[]> {
        return expectedDalRecords;
    };
    const mockDal = createOmegaDalMock(testMapPath, undefined, mockDalRead);
    const createSpy = jest.spyOn(mockDal, 'create');
    const readSpy = jest.spyOn(mockDal, 'read');
    const updateSpy = jest.spyOn(mockDal, 'update');
    const deleteSpy = jest.spyOn(mockDal, 'delete');
    const testRepo = new OmegaRepository(mockDal);
    const actualOmegaObjects = await testRepo.retrieveMany(expectedTableName, externalCriteria);
    expect(createSpy).toHaveBeenCalledTimes(0);
    expect(readSpy).toHaveBeenCalledTimes(1);
    const expectedOmegaCriteria = testRepo.mapExternalCriteriaToDalCriteria(expectedTableName, externalCriteria);
    expect(readSpy).toHaveBeenCalledWith(expectedTableName, expectedOmegaCriteria);
    expect(updateSpy).toHaveBeenCalledTimes(0);
    expect(deleteSpy).toHaveBeenCalledTimes(0);
    if (expectedDalRecords.length > 0) {
        actualOmegaObjects.forEach((actualOmegaObject: IOmegaObject, index: number) => {
            const expectedOmegaObject = testRepo.mapRecordToObject(expectedTableName, expectedDalRecords[index]);
            expect(actualOmegaObject).toStrictEqual(expectedOmegaObject);
        });
    } else {
        expect(actualOmegaObjects).toStrictEqual([]);
    }
}

async function runRetrieveOneTest(
    expectedTableName: string,
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
    const testRepo = new OmegaRepository(mockDal);
    const expectedOmegaCriteria = testRepo.createIdentityCriteria(expectedTableName, expectedIdentityValue);
    const actualOmegaObject = await testRepo.retrieveOne(expectedTableName, expectedIdentityValue);
    expect(createSpy).toHaveBeenCalledTimes(0);
    expect(readSpy).toHaveBeenCalledTimes(1);
    expect(readSpy).toHaveBeenCalledWith(expectedTableName, expectedOmegaCriteria);
    expect(updateSpy).toHaveBeenCalledTimes(0);
    expect(deleteSpy).toHaveBeenCalledTimes(0);
    if (expectedDalRecord) {
        const expectedOmegaObject = testRepo.mapRecordToObject(expectedTableName, expectedDalRecord);
        expect(actualOmegaObject).toStrictEqual(expectedOmegaObject);
    } else {
        expect(actualOmegaObject).toBeNull();
    }
}

async function runPersistTest(objectArray: Array<Partial<IOmegaObject>>, returnObjects?: boolean) {
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
            updateParam1Array.push(testObject.objectSource);
            const affectedRecord = preRepo.mapObjectToRecord(testObject);
            updateParam2Array.push(affectedRecord);
            affectedRecordArray.push(affectedRecord);
            updateParam3Array.push(preRepo.createIdentityCriteria(testObject.objectSource, identityValue));
        } else {
            createParam1Array.push(testObject.objectSource);
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
    const createSpy = jest.spyOn(mockDal, 'create');
    const readSpy = jest.spyOn(mockDal, 'read');
    const updateSpy = jest.spyOn(mockDal, 'update');
    const deleteSpy = jest.spyOn(mockDal, 'delete');
    const testRepo = new OmegaRepository(mockDal);
    const actualResults = await testRepo.persist(objectArray, returnObjects);

    expect(createSpy).toHaveBeenCalledTimes(createParam1Array.length);
    for (let i = 0; i < createParam1Array.length; i++) {
        expect(createSpy).toHaveBeenCalledWith(createParam1Array[i], createParam2Array[i]);
    }
    expect(readSpy).toHaveBeenCalledTimes(readTimes);
    expect(updateSpy).toHaveBeenCalledTimes(updateParam1Array.length);
    for (let i = 0; i < updateParam1Array.length; i++) {
        expect(updateSpy).toHaveBeenCalledWith(updateParam1Array[i], updateParam2Array[i], updateParam3Array[i]);
    }
    expect(deleteSpy).toHaveBeenCalledTimes(0);
    if (returnObjects) {
        objectArray.forEach((omegaObject: OmegaObject, index: number) => {
            const tableMap = mockDal.mapper.getTableMap(omegaObject.objectSource);
            omegaObject.objectData[tableMap.identity] = actualResults[index].objectData[tableMap.identity];
            expect(actualResults[index]).toStrictEqual(omegaObject as OmegaObject);
        });
    }
}
