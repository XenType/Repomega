import { createOmegaRepoMock } from './fixtures/omegaRepoMocks';
import { OmegaObject } from '../../../src/object/omegaObject';
import { RepositoryGetMany } from '../../../src/repository';
import { OmegaCriteria, OmegaCriterion } from '../../../src/dal';
import { IOmegaObject } from '../../../src/object';

const parentTable1 = 'Market';
const expectedParentId = 111;
const expectedDirectChildIds = [111, 222, 333];
const expectedIndirectChildIds = {
    111: ['aaa', 'bbb', 'ccc'],
    222: ['ddd', 'eee'],
    333: ['fff']
};
const expectedIndirectChildCount = 3;
const parentTable2 = 'Company';
const childTable1 = parentTable2;
const childTable2 = 'User';
const sourceTable = 'User';
const targetTable1 = 'OptionGroup';

describe('When using functions of an IOmegaObject', () => {
    describe('And a common private function is called', () => {
        xtest('If initTableMap is called the tableMap is initialized if undefined', async () => {
            // const getTableMapSpy = await runRetrieveChildAssociationTest([childTable1, childTable1], 'getTableMap');
            // expect(getTableMapSpy).toBeCalledTimes(1);
        });
    });
    describe('And calling retrieveChildAssociations', () => {
        // describe('For a direct child association', () => {
        //     test('It calls sourceRepo.retrieveMany once with expected parameters', async () => {
        //         const retrieveManySpy = await runRetrieveChildAssociationTest([childTable1], 'retrieveMany');
        //         const expectedParam1 = childTable1;
        //         const expectedParam2 = { _and: [{ field: 'marketId', value: expectedParentId }] };
        //         expect(retrieveManySpy).toBeCalledTimes(1);
        //         expect(retrieveManySpy).toBeCalledWith(expectedParam1, expectedParam2);
        //     });
        // });
        // xdescribe('For an indirect child association', () => {
        //     test('It calls sourceRepo.retrieveMany expected times with expected parameters', async () => {
        //         const retrieveManySpy = await runRetrieveChildAssociationTest([childTable2], 'retrieveMany');
        //         const expectedParam1a = childTable1;
        //         const expectedParam2a = { _and: [{ field: 'marketId', value: expectedParentId }] };
        //         const expectedParam1b = childTable2;
        //         const expectedParam2b = { _and: [{ field: 'userId', value: expectedParentId }] };
        //         expect(retrieveManySpy).toBeCalledTimes(expectedIndirectChildCount + 1);
        //         expect(retrieveManySpy).toBeCalledWith(expectedParam1a, expectedParam2a);
        //     });
        // });
    });
    describe('And calling retrieveLateralAssociations', () => {
        test('...', () => {
            // test
        });
    });
    describe('And calling createChildAssociation', () => {
        test('...', () => {
            // test
        });
    });
    describe('And calling createLateralAssociation', () => {
        test('...', () => {
            // test
        });
    });
    describe('And calling deleteChildAssociation', () => {
        test('...', () => {
            // test
        });
    });
    describe('And calling deleteLateralAssociation', () => {
        test('...', () => {
            // test
        });
    });
});

const retrieveMany: RepositoryGetMany = async (source: string, criteria: OmegaCriteria): Promise<IOmegaObject[]> => {
    let mockObjects = [];
    if (source === parentTable1) {
        mockObjects = expectedDirectChildIds.map(id => {
            return makeTempObject(source, id);
        });
    } else if (source === parentTable2) {
        mockObjects = expectedIndirectChildIds[(criteria._and[0] as OmegaCriterion).value].map(id => {
            return makeTempObject(source, id);
        });
    }
    return mockObjects;
};
function makeTempObject(source: string, id: number): OmegaObject {
    const tempObject = new OmegaObject(undefined);
    tempObject.objectSource = source;
    tempObject.objectData['id'] = id;
    return tempObject;
}
const runRetrieveChildAssociationTest = async (
    childTableList: string[],
    spyMethod: RepoMethods
): Promise<jest.SpyInstance> => {
    const mockRepository = createOmegaRepoMock(undefined, undefined, undefined, retrieveMany);
    const jestSpy = jest.spyOn(mockRepository, spyMethod);
    const testObject = new OmegaObject(mockRepository);
    testObject.objectSource = parentTable1;
    testObject.objectData.id = expectedParentId;
    await childTableList.forEach(async childTable => {
        const test = await testObject.retrieveChildAssociations(childTable);
    });
    return jestSpy;
};

type RepoMethods = 'persist' | 'retrieveOne' | 'retrieveMany' | 'deleteOne' | 'deleteMany' | 'getTableMap';
