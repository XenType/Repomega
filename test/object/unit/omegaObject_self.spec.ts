import { createOmegaRepoMock, createOmegaRepoSpies, assertRepoUsageCounts } from './fixtures/omegaRepoMocks';
import { OmegaObject } from '../../../src/object/omegaObject';
import { cloneDeep } from 'lodash';
import { createTestObject } from '../../fixtures';

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
