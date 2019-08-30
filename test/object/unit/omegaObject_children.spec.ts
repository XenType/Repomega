import { createOmegaRepoMock, createOmegaRepoSpies, assertRepoUsageCounts } from './fixtures/omegaRepoMocks';
import { OmegaObject } from '../../../src/object/omegaObject';
import { createTestObject } from '../../fixtures';
import { OmegaCriteria } from '../../../src/dal';

describe('When using functions of an IOmegaObject', () => {
    describe('And calling retrieveChildObjects', () => {
        describe('When no child association exists', () => {
            test('It interacts with the repository as expected', async () => {
                const mockRepo = createOmegaRepoMock();
                const spyContainer = createOmegaRepoSpies(mockRepo);
                const testObject = createTestObject(mockRepo, 'Company', 10, 2);
                try {
                    await testObject.retrieveChildObjects('Market');
                } catch {}
                assertRepoUsageCounts(spyContainer);
            });
            test('It throws the expected error', async () => {
                let message = '';
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'Company', 10, 2);
                try {
                    await testObject.retrieveChildObjects('Market');
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
                await testObject.retrieveChildObjects('User');
                assertRepoUsageCounts(spyContainer, 0, 0, 1);
                expect(spyContainer.spyRetrieveMany).toHaveBeenCalledWith('User', expectedCriteria);
            });
            test('And no records are present, an empty array is returned', async () => {
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'Company', 10, 2);
                const children = await testObject.retrieveChildObjects('User');
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
                const children = await testObject.retrieveChildObjects('User');
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
                await testObject.retrieveChildObjects('User');
                assertRepoUsageCounts(spyContainer, 0, 0, 1);
                expect(spyContainer.spyRetrieveMany).toHaveBeenCalledWith('User', expectedCriteria);
            });
            test('And no child^N records are present, an empty array is returned', async () => {
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'Market', 'USD', 1);
                const children = await testObject.retrieveChildObjects('User');
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
                const result = await testObject.retrieveChildObjects('User');
                expect(result).toStrictEqual(grandChildResonse);
            });
        });
    });
});
