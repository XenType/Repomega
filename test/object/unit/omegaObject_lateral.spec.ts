import { createOmegaRepoMock, createOmegaRepoSpies, assertRepoUsageCounts } from './fixtures/omegaRepoMocks';
import { OmegaObject } from '../../../src/object/omegaObject';
import { createTestObject } from './fixtures';
import { OmegaCriteria } from '../../../src/dal';

describe('When using functions of an IOmegaObject', () => {
    describe('And calling retrieveLateralAssociations', () => {
        describe('And no lateral association exists', () => {
            test('It interacts with the repository as expected', async () => {
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'Market', 'USD', 1);
                const spyContainer = createOmegaRepoSpies(mockRepo);
                try {
                    await testObject.retrieveLateralObjects('User');
                } catch {}
                await assertRepoUsageCounts(spyContainer, 0, 0, 0);
            });
            test('The expected error message is thrown', async () => {
                let message = '';
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'Market', 'USD', 1);
                try {
                    await testObject.retrieveLateralObjects('User');
                } catch (error) {
                    message = error.message;
                }
                expect(message).toEqual('Association Error = Market table map has no lateral association to User');
            });
        });
        describe('And a lateral association does exist', () => {
            // SELECT * FROM OptionGroup WHERE id IN
            // (SELECT optionGroupId FROM UserOptionGroupLink WHERE userId = 11)
            test('It interacts with the repository as expected', async () => {
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'User', 1, 11);
                const spyContainer = createOmegaRepoSpies(mockRepo);
                const expectedCriteria = {
                    _and: [
                        {
                            sourceField: 'id',
                            targetField: 'optionGroupId',
                            targetTable: 'UserOptionGroupLink',
                            criteria: { _and: [{ field: 'userId', value: 11 }] }
                        }
                    ]
                };
                await testObject.retrieveLateralObjects('OptionGroup');
                await assertRepoUsageCounts(spyContainer, 0, 0, 1);
                expect(spyContainer.spyRetrieveMany).toBeCalledWith('OptionGroup', expectedCriteria);
            });
            test('When no associated records exist, it returns an empty array', async () => {
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'User', 1, 11);
                const results = await testObject.retrieveLateralObjects('OptionGroup');
                expect(results).toStrictEqual([]);
            });
            test('When associated records exist, it returns the expected array', async () => {
                const mockRepo = createOmegaRepoMock();
                const firstGroup = createTestObject(mockRepo, 'OptionGroup', undefined, 1);
                const secondGroup = createTestObject(mockRepo, 'OptionGroup', undefined, 2);
                const thirdGroup = createTestObject(mockRepo, 'OptionGroup', undefined, 3);
                const expectedGroups = [firstGroup, secondGroup, thirdGroup];
                mockRepo.retrieveMany = async (source: string, criteria: OmegaCriteria): Promise<OmegaObject[]> => {
                    return expectedGroups;
                };
                const testObject = createTestObject(mockRepo, 'User', 1, 11);
                const results = await testObject.retrieveLateralObjects('OptionGroup');
                expect(results).toStrictEqual(expectedGroups);
            });
        });
    });
    // NEXT TODO: This will require new methods in the repo afterall
    // ONCE DONE: Build external criteria here and use repo methods
    // INSERT INTO UserOptionGroupLink (userId, optionGroupId)
    // VALUES (11, 1)
    // describe('And calling createLateralAssociation', () => {
    //     test('...', async () => {
    //         // tests:
    //     });
    // });
    // describe('And calling deleteLateralAssociation', () => {
    //     test('...', async () => {
    //         // test
    //     });
    // });
});
