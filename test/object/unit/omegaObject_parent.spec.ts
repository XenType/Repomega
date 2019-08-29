import { createOmegaRepoMock, createOmegaRepoSpies, assertRepoUsageCounts } from './fixtures/omegaRepoMocks';
import { OmegaObject } from '../../../src/object/omegaObject';
import { createTestObject } from './fixtures';
import { OmegaCriteria } from '../../../src/dal';

describe('When using functions of an IOmegaObject', () => {
    describe('And calling retrieveParentObject', () => {
        describe('When no parent association exists', () => {
            test('It interacts with the repository as expected', async () => {
                const mockRepo = createOmegaRepoMock();
                const spyContainer = createOmegaRepoSpies(mockRepo);
                const testObject = createTestObject(mockRepo, 'Market', 'USD');
                try {
                    await testObject.retrieveParentObject('Company');
                } catch {}
                assertRepoUsageCounts(spyContainer);
            });
            test('It throws the expected error', async () => {
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'Market', 'USD');
                let message = '';
                try {
                    await testObject.retrieveParentObject('Company');
                } catch (error) {
                    message = error.message;
                }
                expect(message).toEqual('Association Error = Company table map has no child association to Market');
            });
        });
        describe('When a parent^1 association exists', () => {
            test('It interacts with the repository as expected', async () => {
                const mockRepo = createOmegaRepoMock();
                const spyContainer = createOmegaRepoSpies(mockRepo);
                const testObject = createTestObject(mockRepo, 'Company', 2, 1);
                const expectedCriteria: OmegaCriteria = { _and: [{ field: 'id', value: 2 }] };
                await testObject.retrieveParentObject('Market');
                assertRepoUsageCounts(spyContainer, 0, 0, 1);
                expect(spyContainer.spyRetrieveMany).toHaveBeenLastCalledWith('Market', expectedCriteria);
            });
            test('And if the parent record does not exist, it returns null', async () => {
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'Company', 2, 1);
                const parent = await testObject.retrieveParentObject('Market');
                expect(parent).toBeNull();
            });
            test('And if the parent record does exist, it returns the expected OmegaObject', async () => {
                const mockRepo = createOmegaRepoMock();
                const parentObject = createTestObject(mockRepo, 'Market', 'USD', 2);
                mockRepo.retrieveMany = async (source: string, criteria: OmegaCriteria): Promise<OmegaObject[]> => {
                    return [parentObject];
                };
                const testObject = createTestObject(mockRepo, 'Company', 2, 1);
                const parent = await testObject.retrieveParentObject('Market');
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
                await testObject.retrieveParentObject('Market');
                assertRepoUsageCounts(spyContainer, 0, 0, 1);
                expect(spyContainer.spyRetrieveMany).toHaveBeenCalledWith('Market', expectedCriteria);
            });
            test('And if parent^2 record does not exist, it returns null', async () => {
                const mockRepo = createOmegaRepoMock();
                mockRepo.retrieveMany = async (source: string, criteria: OmegaCriteria): Promise<OmegaObject[]> => {
                    return [];
                };
                const testObject = createTestObject(mockRepo, 'User', 3, 10);
                const parent = await testObject.retrieveParentObject('Market');
                expect(parent).toBeNull();
            });
            test('And if the parent record does exist, it returns the expected OmegaObject', async () => {
                const mockRepo = createOmegaRepoMock();
                const grandParentObject = createTestObject(mockRepo, 'Master', 'USD', 5);
                mockRepo.retrieveMany = async (source: string, criteria: OmegaCriteria): Promise<OmegaObject[]> => {
                    return [grandParentObject];
                };
                const testObject = createTestObject(mockRepo, 'User', 3, 10);
                const parent = await testObject.retrieveParentObject('Market');
                expect(parent).toStrictEqual(grandParentObject);
            });
        });
    });
});
