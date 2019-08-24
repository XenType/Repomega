import { MySqlDal } from '../../../src/dal/mysqlDal';
import { OmegaCriteria } from '../../../src/dal/index';
import { OmegaRepository } from '../../../src/repository/omegaRepository';
import { OmegaObject } from '../../../src/object/omegaObject';
import { createNewMarketObject } from './fixtures/fixtures';

const integrationConfig = {
    connectionLimit: 10,
    host: 'localhost',
    user: 'omegaint',
    password: 'dev1PASS@',
    database: 'omegaintegrationtest'
};
const integrationMapPath = 'test/repository/integration/fixtures/integration-map.json';
const mySqlDal = new MySqlDal(integrationConfig, integrationMapPath);
const testRepo = new OmegaRepository(mySqlDal);

describe('When an omegaRepository with a live omegaDal connection', () => {
    let destroyList: Array<{ table: string; identityCriteria: OmegaCriteria }> = [];
    describe('And using the persist method with return objects', () => {
        test('If passed a single new object, the object is returned with a new Id', async () => {
            const newMarket = createNewMarketObject('New Market', 'USD', testRepo);
            await runPersistTest([newMarket], destroyList);
        });
        test('If passed a series of new objects from the same source table, the objects are returned with new Ids', async () => {
            const newMarket1 = createNewMarketObject('Uptown', 'USD', testRepo);
            const newMarket2 = createNewMarketObject('Downtown', 'USD', testRepo);
            await runPersistTest([newMarket1, newMarket2], destroyList);
        });
        test('If passed a single existing object, the object is returned with update intact', async () => {
            const newMarket = createNewMarketObject('New Market', 'USD', testRepo);
            const savedMarkets = await testRepo.persist([newMarket], true);
            const savedMarket = savedMarkets[0];
            savedMarket.objectData.name = 'Old Market';
            const updatedMarkets = await runPersistTest([savedMarket], destroyList);
            const updatedMarket = updatedMarkets[0];
            expect(updatedMarket.objectData.name).toEqual('Old Market');
        });
        test('If passed a mix of new and existing objects from multiple sources, the objects are returned as expected', async () => {
            const newMarket = createNewMarketObject('First Market', 'USD', testRepo);
            const savedMarkets = await testRepo.persist([newMarket], true);
            const savedMarket = savedMarkets[0];
            const newCompany = new OmegaObject(testRepo);
            newCompany.objectSource = 'Company';
            newCompany.objectData = {
                name: 'New Company',
                marketId: savedMarket.objectData.id
            };
            savedMarket.objectData.name = 'Second Market';
            const savedItems = await runPersistTest([savedMarket, newMarket, newCompany], destroyList);
            const savedMarket1 = savedItems[0];
            expect(savedMarket1.objectData.name).toEqual('Second Market');
            const savedMarket2 = savedItems[1];
            expect(savedMarket2.objectData.name).toEqual('First Market');
            const savedCompany1 = savedItems[2];
            expect(savedCompany1.objectData.name).toEqual('New Company');
        });
    });
    describe('And using the retrieveOne method', () => {
        const retrieveOneNotFoundId = 1;
        let retrieveOneMarket;
        beforeAll(async () => {
            const newMarket = createNewMarketObject('West', 'USD', testRepo);
            const insertedItems = await testRepo.persist([newMarket], true);
            retrieveOneMarket = insertedItems[0];
            destroyList.push({
                table: testRepo.getTableMap('Market').name,
                identityCriteria: testRepo.createIdentityCriteria('Market', retrieveOneMarket.objectData.id)
            });
        });
        test('If passed a non-existing Id, null is returned', async () => {
            const foundMarket = await testRepo.retrieveOne('Market', retrieveOneNotFoundId);
            expect(foundMarket).toBeNull();
        });
        test('If passed an existing Id, expected object is returned', async () => {
            const foundMarket = await testRepo.retrieveOne('Market', retrieveOneMarket.objectData.id);
            expect(foundMarket).toStrictEqual(retrieveOneMarket);
        });
    });
    describe('And using the retrieveMany method', () => {
        const retrieveManyNotFoundCurrency = 'GBP';
        const retrieveManyFoundCurrency = 'YIN';
        let insertedItems: OmegaObject[];
        beforeAll(async () => {
            const newMarket1 = createNewMarketObject('Red', retrieveManyFoundCurrency, testRepo);
            const newMarket2 = createNewMarketObject('Yellow', retrieveManyFoundCurrency, testRepo);
            const newMarket3 = createNewMarketObject('Blue', retrieveManyFoundCurrency, testRepo);
            insertedItems = (await testRepo.persist([newMarket1, newMarket2, newMarket3], true)) as OmegaObject[];
            for (const insertedItem of insertedItems) {
                destroyList.push({
                    table: testRepo.getTableMap('Market').name,
                    identityCriteria: testRepo.createIdentityCriteria('Market', insertedItem.objectData.id as
                        | string
                        | number)
                });
            }
        });
        test('If passed criteria with no match, an empty array is returned', async () => {
            const externalCriteria: OmegaCriteria = {
                _and: [{ field: 'currencyType', value: retrieveManyNotFoundCurrency }]
            };
            const foundMarkets = await testRepo.retrieveMany('Market', externalCriteria);
            expect(foundMarkets.length).toEqual(0);
        });
        test('If passed criteria with matches, expected array is returned', async () => {
            const externalCriteria: OmegaCriteria = {
                _and: [{ field: 'currencyType', value: retrieveManyFoundCurrency }]
            };
            const foundMarkets = await testRepo.retrieveMany('Market', externalCriteria);
            expect(foundMarkets.length).toEqual(3);
            expect(foundMarkets).toStrictEqual(insertedItems);
        });
    });
    describe('And using the deleteOne method', () => {
        const deleteOneNotFoundId = 1;
        let deleteOneMarket;
        beforeAll(async () => {
            const newMarket = createNewMarketObject('Islands', 'USD', testRepo);
            const insertedItems = await testRepo.persist([newMarket], true);
            deleteOneMarket = insertedItems[0];
            destroyList.push({
                table: testRepo.getTableMap('Market').name,
                identityCriteria: testRepo.createIdentityCriteria('Market', deleteOneMarket.objectData.id)
            });
        });
        test('If passed a non-existing Id, 0 is returned', async () => {
            const deleteCount = await testRepo.deleteOne('Market', deleteOneNotFoundId);
            expect(deleteCount).toEqual(0);
        });
        test('If passed an existing Id, 1 is returned', async () => {
            const deleteCount = await testRepo.deleteOne('Market', deleteOneMarket.objectData.id);
            expect(deleteCount).toEqual(1);
        });
    });
    describe('And using the deleteMany method', () => {
        const deleteManyNotFoundCurrency = 'GBP';
        const deleteManyFoundCurrency = 'EUR';
        let insertedItems: OmegaObject[];
        beforeAll(async () => {
            const newMarket1 = createNewMarketObject('Star', deleteManyFoundCurrency, testRepo);
            const newMarket2 = createNewMarketObject('Circle', deleteManyFoundCurrency, testRepo);
            const newMarket3 = createNewMarketObject('Square', deleteManyFoundCurrency, testRepo);
            insertedItems = (await testRepo.persist([newMarket1, newMarket2, newMarket3], true)) as OmegaObject[];
            for (const insertedItem of insertedItems) {
                destroyList.push({
                    table: testRepo.getTableMap('Market').name,
                    identityCriteria: testRepo.createIdentityCriteria('Market', insertedItem.objectData.id as
                        | string
                        | number)
                });
            }
        });
        test('If passed criteria with no match, an empty array is returned', async () => {
            const externalCriteria: OmegaCriteria = {
                _and: [{ field: 'currencyType', value: deleteManyNotFoundCurrency }]
            };
            const deletedCount = await testRepo.deleteMany('Market', externalCriteria);
            expect(deletedCount).toEqual(0);
        });
        test('If passed criteria with matches, expected array is returned', async () => {
            const externalCriteria: OmegaCriteria = {
                _and: [{ field: 'currencyType', value: deleteManyFoundCurrency }]
            };
            const deletedCount = await testRepo.deleteMany('Market', externalCriteria);
            expect(deletedCount).toEqual(3);
        });
    });
    afterAll(async () => {
        for (const objectToDestroy of destroyList) {
            await mySqlDal.delete(objectToDestroy.table, objectToDestroy.identityCriteria);
        }
    });
});

async function runPersistTest(
    itemArray: OmegaObject[],
    destroyList: Array<{ table: string; identityCriteria: OmegaCriteria }>
): Promise<OmegaObject[] | void> {
    const savedItems = await testRepo.persist(itemArray, true);
    for (const savedItem of savedItems as OmegaObject[]) {
        const itemIdentityField = testRepo.getTableMap(savedItem.objectSource).identity;
        const identityCriteria = testRepo.createIdentityCriteria(savedItem.objectSource, savedItem.objectData[
            itemIdentityField
        ] as string | number);
        destroyList.push({ table: testRepo.getTableMap(savedItem.objectSource).name, identityCriteria });
        expect(savedItem.objectData[itemIdentityField]).not.toBeUndefined();
        expect(savedItem.objectData[itemIdentityField]).not.toBeNull();
        expect(savedItem.objectData[itemIdentityField]).not.toEqual(0);
    }
    return savedItems;
}
