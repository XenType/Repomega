import {
    RepositoryPersist,
    RepositoryGetSingle,
    RepositoryGetMany,
    RepositoryActMany,
    RepositoryActSingle,
    IOmegaRepository,
    RepositoryActAssociations,
    RepositoryGetAssociations
} from '../../../src/repository';
import { IOmegaObject } from '../../../src/object';
import { OmegaCriteria } from '../../../src/dal';
import { FlatMapper } from '../../../src/mapper/flatMapper';
import { OmegaTableMap } from '../../../src/mapper';

const testMapPath = 'test/repository/fixtures/mapping-function-testMap.json';

export function createOmegaRepoMock(
    _persist?: RepositoryPersist,
    _persistAssoc?: RepositoryActAssociations,
    _retrieveOne?: RepositoryGetSingle,
    _retrieveMany?: RepositoryGetMany,
    _getChildAssoc?: RepositoryGetAssociations,
    _getLatAssoc?: RepositoryGetAssociations,
    _deleteOne?: RepositoryActSingle,
    _deleteMany?: RepositoryActMany,
    _deleteAssoc?: RepositoryActAssociations
): IOmegaRepository {
    const tableMapper = new FlatMapper(testMapPath);
    const persist = _persist !== undefined ? _persist : defaultPersist;
    const retrieveOne = _retrieveOne !== undefined ? _retrieveOne : defaultGetOne;
    const retrieveMany = _retrieveMany !== undefined ? _retrieveMany : defaultGetMany;
    const deleteOne = _deleteOne !== undefined ? _deleteOne : defaultActOne;
    const deleteMany = _deleteMany !== undefined ? _deleteMany : defaultActMany;
    const persistLateralAssociation = _persistAssoc !== undefined ? _persistAssoc : defaultActLatAssoc;
    const retrieveByChildAssociation = _getChildAssoc !== undefined ? _getChildAssoc : defaultGetChildAssoc;
    const retrieveByLateralAssociation = _getLatAssoc !== undefined ? _getLatAssoc : defaultGetLatAssoc;
    const deleteLateralAssociation = _deleteAssoc !== undefined ? _deleteAssoc : defaultActLatAssoc;
    const getTableMap = (source: string): OmegaTableMap => {
        return tableMapper.getTableMap(source);
    };
    const mockOmegaRepository: IOmegaRepository = {
        persist,
        persistLateralAssociation,
        retrieveOne,
        retrieveMany,
        retrieveByChildAssociation,
        retrieveByLateralAssociation,
        deleteOne,
        deleteMany,
        getTableMap,
        deleteLateralAssociation
    };
    return mockOmegaRepository;
}

const defaultPersist: RepositoryPersist = async (a: IOmegaObject[], b?: boolean): Promise<void | IOmegaObject[]> => {
    if (b) {
        return null;
    }
};
const defaultGetOne: RepositoryGetSingle = async (a: string, b: string | number): Promise<IOmegaObject> => {
    return null;
};
const defaultGetMany: RepositoryGetMany = async (a: string, b: OmegaCriteria): Promise<IOmegaObject[]> => {
    return [];
};
const defaultGetChildAssoc: RepositoryGetAssociations = async (
    source: string,
    sourceId: number | string,
    target: string
): Promise<IOmegaObject[]> => {
    return null;
};
const defaultGetLatAssoc: RepositoryGetAssociations = async (
    source: string,
    sourceId: number | string,
    target: string
): Promise<IOmegaObject[]> => {
    return null;
};
const defaultActOne: RepositoryActSingle = async (a: string, b: string | number): Promise<number> => {
    return 0;
};
const defaultActMany: RepositoryActMany = async (a: string, b: OmegaCriteria): Promise<number> => {
    return 0;
};
const defaultActLatAssoc: RepositoryActAssociations = async (
    source: string,
    sourceId: string | number,
    target: string,
    targetId: string | number
): Promise<void> => {
    return;
};
