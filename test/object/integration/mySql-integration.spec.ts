import { MySqlDal } from '../../../src/dal/mysqlDal';
import { OmegaRepository } from '../../../src/repository/omegaRepository';
import { OmegaObject } from '../../../src/object/omegaObject';
import { OmegaRecordId, OmegaValue } from '../../../src/common/types';
import { OmegaObjectData } from '../../../src/object';

const integrationConfig = {
    connectionLimit: 10,
    host: 'localhost',
    user: 'omegaint',
    password: 'dev1PASS@',
    database: 'omegaintegrationtest'
};
const integrationMapPath = 'test/dal/integration/fixtures/integration-map.json';
const mySqlDal = new MySqlDal(integrationConfig, integrationMapPath);
const testRepo = new OmegaRepository(mySqlDal);

describe('When using an OmegaObject with a live mySql connection', () => {
    describe('And using the save method', () => {
        let testObject: OmegaObject;
        beforeAll(async () => {
            const objectData = {
                name: 'Valid Change Test',
                currencyType: 'USD'
            };
            testObject = await createAndReturnTestObject('Market', objectData);
        });
        test('The save() operation completes without error', async () => {
            testObject.objectData.name = 'Changed';
            await testObject.save();
            expect(true).toEqual(true);
        });
        test('The change remains present on the object after completion', async () => {
            testObject.objectData.currencyType = 'GBP';
            await testObject.save();
            expect(testObject.objectData.currencyType).toEqual('GBP');
        });
        test('The change persists when requesting a new copy of the same object', async () => {
            const savedObject = await testRepo.retrieveOne('Market', testObject.objectData.id as OmegaRecordId);
            expect(savedObject.objectData.name).toEqual('Changed');
            expect(savedObject.objectData.currencyType).toEqual('GBP');
        });
        afterAll(async () => {
            await testRepo.deleteOne(testObject.objectSource, testObject.objectData.id as OmegaRecordId);
        });
    });
    describe('And using the internal field methods', () => {
        let testObject: OmegaObject;
        beforeAll(async () => {
            const objectData = {
                stringTest: 'a string',
                numberTest: 10,
                dateTest: new Date(),
                booleanTest: true
            };
            testObject = await createAndReturnTestObject('BasicTests', objectData);
        });
        test('The saveInternalField() operation completes without error', async () => {
            await testObject.saveInternalField('internalTest', 'testing');
            expect(true).toEqual(true);
        });
        test('The verifyInternalField() operation completes without error and returns the expected value', async () => {
            await testObject.saveInternalField('internalTest', 'testing again');
            const result = await testObject.verifyInternalField('internalTest', 'testing again');
            expect(result).toEqual(true);
        });
        afterAll(async () => {
            await testRepo.deleteOne(testObject.objectSource, testObject.objectData.id as OmegaRecordId);
        });
    });
    describe('And using parent/child methods', () => {
        let testMarkets: OmegaObject[] = [];
        let testCompanies: OmegaObject[] = [];
        let testUsers: OmegaObject[] = [];
        beforeAll(async () => {
            // create 2 markets
            await generateTestMarkets(2, testMarkets);
            const market1Id = testMarkets[0].objectData.id;
            const market2Id = testMarkets[1].objectData.id;
            // create 2 companies under market 1
            await generateTestCompanies(2, market1Id, testCompanies);
            const company1aId = testCompanies[0].objectData.id;
            const company1bId = testCompanies[1].objectData.id;
            // create 4 companies under market 2
            await generateTestCompanies(4, market2Id, testCompanies);
            const company2aId = testCompanies[2].objectData.id;
            const company2bId = testCompanies[3].objectData.id;
            const company2cId = testCompanies[4].objectData.id;
            const company2dId = testCompanies[5].objectData.id;
            // create 3 users under company 1a
            await generateTestUsers(3, market1Id, company1aId, testUsers);
            // create 2 users under company 1b
            await generateTestUsers(2, market1Id, company1bId, testUsers);
            // create 4 users under company 2a
            await generateTestUsers(4, market2Id, company2aId, testUsers);
            // create 6 users under company 2b
            await generateTestUsers(6, market2Id, company2bId, testUsers);
            // create 1 users under company 2c
            await generateTestUsers(1, market2Id, company2cId, testUsers);
            // create 3 users under company 2d
            await generateTestUsers(3, market2Id, company2dId, testUsers);
        });
        test('A request for a parent^1 object returns expected result', async () => {
            const testChild = testCompanies[3];
            const testParent = await testChild.retrieveParentObject('Market');
            expect(testParent).toStrictEqual(testMarkets[1]);
        });
        test('A request for child^1 objects returns expected result', async () => {
            const testParent = testCompanies[5];
            const testChildren = await testParent.retrieveChildObjects('User');
            expect(testChildren.length).toEqual(3);
            const expectedChildren = extractUsersOfCompany(testUsers, testParent.objectData.id);
            const actualArray = sortObjectArrayById(testChildren);
            const expectedArray = sortObjectArrayById(expectedChildren);
            expect(actualArray).toStrictEqual(expectedArray);
        });
        test('A request for a parent^N object returns expected result', async () => {
            const testChild = testUsers[0];
            const testParent = await testChild.retrieveParentObject('Market');
            expect(testParent).toStrictEqual(testMarkets[0]);
        });
        test('A request for child^N objects returns expected result', async () => {
            const testParent = testMarkets[1];
            const testChildren = await testParent.retrieveChildObjects('User');
            expect(testChildren.length).toEqual(14);
            const users2a = extractUsersOfCompany(testUsers, testCompanies[2].objectData.id);
            const users2b = extractUsersOfCompany(testUsers, testCompanies[3].objectData.id);
            const users2c = extractUsersOfCompany(testUsers, testCompanies[4].objectData.id);
            const users2d = extractUsersOfCompany(testUsers, testCompanies[5].objectData.id);
            const expectedChildren = users2a
                .concat(users2b)
                .concat(users2c)
                .concat(users2d);
            const actualArray = sortObjectArrayById(testChildren);
            const expectedArray = sortObjectArrayById(expectedChildren);
            expect(actualArray).toStrictEqual(expectedArray);
        });
        afterAll(async () => {
            const allTestObjects = testMarkets.concat(testCompanies).concat(testUsers);
            for (const testObject of allTestObjects) {
                await testRepo.deleteOne(testObject.objectSource, testObject.objectData.id as OmegaRecordId);
            }
        });
    });
    // Lateral tests
    describe('And using lateral link methods', () => {
        let testUsers: OmegaObject[] = [];
        let testGroups: OmegaObject[] = [];
        let testOptions: OmegaObject[] = [];
        beforeAll(async () => {
            await generateTestUsers(3, 1, 1, testUsers);
            await generateTestGroups(3, testGroups);
            const group1Id = testGroups[0].objectData.id as OmegaRecordId;
            const group2Id = testGroups[1].objectData.id as OmegaRecordId;
            const group3Id = testGroups[2].objectData.id as OmegaRecordId;
            await generateTestOptions(3, group1Id, testOptions);
            await generateTestOptions(4, group2Id, testOptions);
            await generateTestOptions(5, group3Id, testOptions);
        });
        test('A valid lateral link can be created without error', async () => {
            const testUser = testUsers[0];
            const testGroup = testGroups[0];
            await testUser.createLateralLink(testGroup.objectSource, testGroup.objectData.id as OmegaRecordId);
        });
        test('A valid lateral link can be deleted without error', async () => {
            const theUser = testUsers[2];
            const theGroup = testGroups[2];
            await theUser.createLateralLink(theGroup.objectSource, theGroup.objectData.id as OmegaRecordId);
            const usersGroups = await theUser.retrieveLateralObjects(theGroup.objectSource);
            expect(usersGroups.length).toEqual(1);
            await theUser.deleteLateralLink(theGroup.objectSource, theGroup.objectData.id as OmegaRecordId);
            const postDeleteGroups = await theUser.retrieveLateralObjects(theGroup.objectSource);
            expect(postDeleteGroups.length).toEqual(0);
        });
        const scenario = `1. A User is associated with a lateral object OptionGroup
        2. OptionGroup is retrieved vai later link to User
        3. Children of the OptionGroups are retrieved
        4. First 3 Children are associated with laterlal object OptionValue
        5. Same 3 objects are retrieved via lateral link to User`;
        test(`A full use case scenario passes: ${scenario}`, async () => {
            const theUser = testUsers[1];
            const theGroup = testGroups[1];
            await theUser.createLateralLink(theGroup.objectSource, theGroup.objectData.id as OmegaRecordId);
            const usersGroups = await theUser.retrieveLateralObjects(theGroup.objectSource);
            const usersGroup = usersGroups[0];
            const theOptions = await usersGroup.retrieveChildObjects('OptionValue');
            const passedOptions: OmegaObject[] = [];
            let counter = 1;
            for (let anOption of theOptions) {
                if (counter <= 3) {
                    await theUser.createLateralLink(anOption.objectSource, anOption.objectData.id as OmegaRecordId);
                    passedOptions.push(anOption);
                }
                counter++;
            }
            const usersOptions = await theUser.retrieveLateralObjects(theOptions[0].objectSource);
            const actualOptions = sortObjectArrayById(usersOptions);
            const expectedOptions = sortObjectArrayById(passedOptions);
            expect(actualOptions).toStrictEqual(expectedOptions);
        });
        afterAll(async () => {
            const allTestObjects = testUsers.concat(testGroups).concat(testOptions);
            for (const testObject of allTestObjects) {
                await testRepo.deleteOne(testObject.objectSource, testObject.objectData.id as OmegaRecordId);
            }
            for (const testUser of testUsers) {
                await testRepo.deleteMany('UserOptionGroupLink', { _and: [{ field: 'userId', value: testUser.objectData.id }] });
                await testRepo.deleteMany('UserOptionValueLink', { _and: [{ field: 'userId', value: testUser.objectData.id }] });
            }
        });
    });
});

const extractUsersOfCompany = (testUsers: OmegaObject[], companyId: OmegaValue): OmegaObject[] => {
    const filteredUsers = testUsers.filter((testUser: OmegaObject) => {
        if (testUser.objectData.companyId === companyId) {
            return true;
        }
        return false;
    });
    return filteredUsers;
};

const sortObjectArrayById = (objectArray: OmegaObject[]): OmegaObject[] => {
    const sortedArray = objectArray.sort((a: OmegaObject, b: OmegaObject) => {
        return (a.objectData.id as number) - (b.objectData.id as number);
    });
    return sortedArray;
};

const createAndReturnTestObject = async (table: string, objectData: OmegaObjectData): Promise<OmegaObject> => {
    const newObject = new OmegaObject(testRepo);
    newObject.objectSource = table;
    newObject.objectData = objectData;
    const returnObjects = await testRepo.persist([newObject], true);
    return returnObjects[0];
};

const generateTestGroups = async (count: number, testGroups: OmegaObject[]): Promise<void> => {
    for (let i = 1; i <= count; i++) {
        const objectData: OmegaObjectData = {
            groupName: `Group ${i}`
        };
        const newObject = await createAndReturnTestObject('OptionGroup', objectData);
        testGroups.push(newObject);
    }
    return;
};
const generateTestOptions = async (count: number, optionGroupId: OmegaRecordId, testOptions: OmegaObject[]): Promise<void> => {
    for (let i = 1; i <= count; i++) {
        const objectData: OmegaObjectData = {
            optionGroupId,
            value: `Option ${i}`
        };
        const newObject = await createAndReturnTestObject('OptionValue', objectData);
        testOptions.push(newObject);
    }
    return;
};

const generateTestMarkets = async (count: number, testMarkets: OmegaObject[]): Promise<void> => {
    for (let i = 1; i <= count; i++) {
        const objectData: OmegaObjectData = {
            name: `Market ${i}`,
            currencyType: 'USD'
        };
        const newObject = await createAndReturnTestObject('Market', objectData);
        testMarkets.push(newObject);
    }
    return;
};

const generateTestCompanies = async (count: number, marketId: OmegaValue, testCompanies: OmegaObject[]): Promise<void> => {
    for (let i = 1; i <= count; i++) {
        const objectData: OmegaObjectData = {
            name: `Company ${marketId}-${i}`,
            marketId: marketId
        };
        const newObject = await createAndReturnTestObject('Company', objectData);
        testCompanies.push(newObject);
    }
    return;
};

const generateTestUsers = async (count: number, marketId: OmegaValue, companyId: OmegaValue, testUsers: OmegaObject[]): Promise<void> => {
    for (let i = 1; i <= count; i++) {
        const objectData: OmegaObjectData = {
            firstName: `User ${marketId}-${companyId}-${i}`,
            lastName: `Testing`,
            userType: `personal`,
            companyId: companyId
        };
        const newObject = await createAndReturnTestObject('User', objectData);
        testUsers.push(newObject);
    }
    return;
};
