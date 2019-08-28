import { createOmegaRepoMock, createOmegaRepoSpies, assertRepoUsageCounts } from './fixtures/omegaRepoMocks';
import { OmegaObject } from '../../../src/object/omegaObject';
import { cloneDeep } from 'lodash';
import { createTestObject } from './fixtures';
import { OmegaCriteria } from '../../../src/dal';

describe('When using functions of an IOmegaObject', () => {
    describe('And calling save', () => {
        test('With a valid object, it interacts with the internal repo as expected', async () => {
            const mockRepo = createOmegaRepoMock();
            const spyContainer = createOmegaRepoSpies(mockRepo);
            const testObject = createTestObject(mockRepo, 'Market', 'USD');
            const expectedParam1 = [cloneDeep(testObject)];
            await testObject.save();
            expectedParam1[0].tableMap = testObject.tableMap;
            assertRepoUsageCounts(spyContainer, 1);
            expect(spyContainer.spyPersist).toHaveBeenCalledWith(expectedParam1, true);
        });
        test('When the object is new, an identity field is added to the object', async () => {
            const mockPersist = async (a: OmegaObject[], b?: boolean): Promise<OmegaObject[]> => {
                a[0].objectData.id = 1;
                return a;
            };
            const mockRepo = createOmegaRepoMock(mockPersist);
            const testObject = createTestObject(mockRepo, 'Market', 'USD');
            await testObject.save();
            expect(testObject.objectData.id).not.toBeUndefined();
            expect(testObject.objectData.id).not.toBeNull();
            expect(testObject.objectData.id).toEqual(1);
        });
    });
    describe('And calling retrieveParentAssociation', () => {
        describe('When no parent association exists', () => {
            test('It interacts with the repository as expected', async () => {
                const mockRepo = createOmegaRepoMock();
                const spyContainer = createOmegaRepoSpies(mockRepo);
                const testObject = createTestObject(mockRepo, 'Market', 'USD');
                try {
                    await testObject.retrieveParentAssociation('Company');
                } catch {}
                assertRepoUsageCounts(spyContainer);
            });
            test('It throws the expected error', async () => {
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'Market', 'USD');
                let message = '';
                try {
                    await testObject.retrieveParentAssociation('Company');
                } catch (error) {
                    message = error.message;
                }
                expect(message).toEqual('Association Error = Company table map has no child association to Market');
            });
        });
        describe('When a parent^1 record association exists', () => {
            test('It interacts with the repository as expected', async () => {
                const mockRepo = createOmegaRepoMock();
                const spyContainer = createOmegaRepoSpies(mockRepo);
                const testObject = createTestObject(mockRepo, 'Company', 2, 1);
                const expectedCriteria: OmegaCriteria = { _and: [{ field: 'id', value: 2 }] };
                await testObject.retrieveParentAssociation('Market');
                assertRepoUsageCounts(spyContainer, 0, 0, 1);
                expect(spyContainer.spyRetrieveMany).toHaveBeenLastCalledWith('Market', expectedCriteria);
            });
            test('And if the parent record does not exist, it returns null', async () => {
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'Company', 2, 1);
                const parent = await testObject.retrieveParentAssociation('Market');
                expect(parent).toBeNull();
            });
            test('And if the parent record does exist, it returns the expected OmegaObject', async () => {
                const mockRepo = createOmegaRepoMock();
                const parentObject = createTestObject(mockRepo, 'Market', 'USD', 2);
                mockRepo.retrieveMany = async (source: string, criteria: OmegaCriteria): Promise<OmegaObject[]> => {
                    return [parentObject];
                };
                const testObject = createTestObject(mockRepo, 'Company', 2, 1);
                const parent = await testObject.retrieveParentAssociation('Market');
                expect(parent).toStrictEqual(parentObject);
            });
        });
        describe('When a parent^N association exists', () => {
            test('It interacts with the repository as expected', async () => {
                const mockRepo = createOmegaRepoMock();
                const parentObject = createTestObject(mockRepo, 'Market', 'USD', 1);
                mockRepo.retrieveMany = async (source: string, criteria: OmegaCriteria): Promise<OmegaObject[]> => {
                    return [parentObject];
                };
                const expectedCriteria: OmegaCriteria = {
                    _and: [
                        {
                            sourceField: 'id',
                            targetTable: 'Company',
                            targetField: 'marketId',
                            criteria: { _and: [{ field: 'id', value: 3 }] }
                        }
                    ]
                };
                const spyContainer = createOmegaRepoSpies(mockRepo);
                const testObject = createTestObject(mockRepo, 'User', 3, 10);
                await testObject.retrieveParentAssociation('Market');
                assertRepoUsageCounts(spyContainer, 0, 0, 1);
                expect(spyContainer.spyRetrieveMany).toHaveBeenCalledWith('Market', expectedCriteria);
            });
            test('And if parent^2 record does not exist, it returns null', async () => {
                const mockRepo = createOmegaRepoMock();
                mockRepo.retrieveMany = async (source: string, criteria: OmegaCriteria): Promise<OmegaObject[]> => {
                    return [];
                };
                const testObject = createTestObject(mockRepo, 'User', 3, 10);
                const parent = await testObject.retrieveParentAssociation('Market');
                expect(parent).toBeNull();
            });
            test('And if the parent record does exist, it returns the expected OmegaObject', async () => {
                const mockRepo = createOmegaRepoMock();
                const grandParentObject = createTestObject(mockRepo, 'Master', 'USD', 5);
                mockRepo.retrieveMany = async (source: string, criteria: OmegaCriteria): Promise<OmegaObject[]> => {
                    return [grandParentObject];
                };
                const testObject = createTestObject(mockRepo, 'User', 3, 10);
                const parent = await testObject.retrieveParentAssociation('Market');
                expect(parent).toStrictEqual(grandParentObject);
            });
        });
    });
    describe('And calling retrieveChildAssociations', () => {
        describe('When no child association exists', () => {
            test('It interacts with the repository as expected', async () => {
                const mockRepo = createOmegaRepoMock();
                const spyContainer = createOmegaRepoSpies(mockRepo);
                const testObject = createTestObject(mockRepo, 'Company', 10, 2);
                try {
                    await testObject.retrieveChildAssociations('Market');
                } catch {}
                assertRepoUsageCounts(spyContainer);
            });
            test('It throws the expected error', async () => {
                let message = '';
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'Company', 10, 2);
                try {
                    await testObject.retrieveChildAssociations('Market');
                } catch (error) {
                    message = error.message;
                }
                expect(message).toEqual('Association Error = Company table map has no child association to Market');
            });
        });
        describe('When a child^1 association exists', () => {
            test('It interacts with the repository as expected', async () => {
                const mockRepo = createOmegaRepoMock();
                const spyContainer = createOmegaRepoSpies(mockRepo);
                const testObject = createTestObject(mockRepo, 'Company', 10, 2);
                const expectedCriteria = { _and: [{ field: 'companyId', value: 2 }] };
                await testObject.retrieveChildAssociations('User');
                assertRepoUsageCounts(spyContainer, 0, 0, 1);
                expect(spyContainer.spyRetrieveMany).toHaveBeenCalledWith('User', expectedCriteria);
            });
            test('And no records are present, an empty array is returned', async () => {
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'Company', 10, 2);
                const children = await testObject.retrieveChildAssociations('User');
                expect(children).toEqual([]);
            });
            test('And records are present, the expected array is returned', async () => {
                const mockRepo = createOmegaRepoMock();
                const firstChild = createTestObject(mockRepo, 'User', 2, 1);
                const secondChild = createTestObject(mockRepo, 'User', 2, 2);
                const thirdChild = createTestObject(mockRepo, 'User', 2, 3);
                const expectedChildren = [firstChild, secondChild, thirdChild];
                mockRepo.retrieveMany = async (source: string, criteria: OmegaCriteria): Promise<OmegaObject[]> => {
                    return expectedChildren;
                };
                const testObject = createTestObject(mockRepo, 'Company', 10, 2);
                const children = await testObject.retrieveChildAssociations('User');
                expect(children).toEqual(expectedChildren);
            });
        });
        describe('When a child^N association exists', () => {
            test('It interacts with the repository as expected', async () => {
                const mockRepo = createOmegaRepoMock();
                const spyContainer = createOmegaRepoSpies(mockRepo);
                const testObject = createTestObject(mockRepo, 'Market', 'USD', 1);
                const expectedCriteria = {
                    _and: [
                        {
                            sourceField: 'companyId',
                            targetField: 'id',
                            targetTable: 'Company',
                            criteria: { _and: [{ field: 'marketId', value: 1 }] }
                        }
                    ]
                };
                await testObject.retrieveChildAssociations('User');
                assertRepoUsageCounts(spyContainer, 0, 0, 1);
                expect(spyContainer.spyRetrieveMany).toHaveBeenCalledWith('User', expectedCriteria);
            });
            test('And no child^N records are present, an empty array is returned', async () => {
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'Market', 'USD', 1);
                const children = await testObject.retrieveChildAssociations('User');
                expect(children).toStrictEqual([]);
            });
            test('And child^N records are present, the expected array is returned', async () => {
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'Market', 'USD', 1);
                const firstGrandChild = createTestObject(mockRepo, 'User', 1, 10);
                const secondGrandChild = createTestObject(mockRepo, 'User', 1, 11);
                const thirdGrandChild = createTestObject(mockRepo, 'User', 2, 12);
                const grandChildResonse = [firstGrandChild, secondGrandChild, thirdGrandChild];
                mockRepo.retrieveMany = async (source: string, criteria: OmegaCriteria): Promise<OmegaObject[]> => {
                    return grandChildResonse;
                };
                const result = await testObject.retrieveChildAssociations('User');
                expect(result).toStrictEqual(grandChildResonse);
            });
        });
    });
    describe('And calling retrieveLateralAssociations', () => {
        describe('And no lateral association exists', () => {
            test('It interacts with the repository as expected', async () => {
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'Market', 'USD', 1);
                const spyContainer = createOmegaRepoSpies(mockRepo);
                try {
                    await testObject.retrieveLateralAssociations('User');
                } catch {}
                await assertRepoUsageCounts(spyContainer, 0, 0, 0);
            });
            test('The expected error message is thrown', async () => {
                let message = '';
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'Market', 'USD', 1);
                try {
                    await testObject.retrieveLateralAssociations('User');
                } catch (error) {
                    message = error.message;
                }
                expect(message).toEqual('Association Error = Market table map has no lateral association to User');
            });
        });
        describe('And no lateral target records exist', () => {
            // HERE
            xtest('It interacts with the repository as expected', async () => {
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'User', 1, 11);
                mockRepo.retrieveMany = async (target: string, criteria: OmegaCriteria): Promise<OmegaObject[]> => {
                    return [];
                };
                const spyContainer = createOmegaRepoSpies(mockRepo);
                await testObject.retrieveLateralAssociations('OptionGroup');
                await assertRepoUsageCounts(spyContainer, 0, 0, 1);
            });
            // test('It returns an empty array', async () => {
            //     // test
            // });
        });
        // describe('And lateral target records exist', () => {
        //     test('It interacts with the repository as expected', async () => {
        //         // test
        //     });
        //     test('It returns the expected array', async () => {
        //         // test
        //     });
        // });
    });
    // describe('And calling createLateralAssociation', () => {
    //     test('...', async () => {
    //         // test
    //     });
    // });
    // describe('And calling deleteLateralAssociation', () => {
    //     test('...', async () => {
    //         // test
    //     });
    // });
    // describe('And calling validatePassword', () => {
    //     test('...', async () => {
    //         // test
    //     });
    // });
    // describe('And calling modifyInternalField', () => {
    //     test('...', async () => {
    //         // test
    //     });
    // });
});
