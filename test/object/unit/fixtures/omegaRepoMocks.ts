import {
    RepositoryPersist,
    RepositoryGetSingle,
    RepositoryGetMany,
    RepositoryActMany,
    RepositoryActSingle,
    IOmegaRepository,
    FieldTransformFunction,
    RepositoryGetSingleValue,
    OmegaFieldValuePair,
    RepositoryActSingleValue
} from '../../../../src/repository';
import { OmegaCriteria } from '../../../../src/dal';
import { FlatMapper } from '../../../../src/mapper/flatMapper';
import { OmegaTableMap, OmegaField } from '../../../../src/mapper';
import { OmegaObject } from '../../../../src/object/omegaObject';
import { OmegaValue, OmegaRecordId } from '../../../../src/common/types';

const testMapPath = 'test/dal/integration/fixtures/integration-map.json';

export function assertRepoUsageCounts(
    spyContainer: RepoSpies,
    persist?: number,
    retrieveOne?: number,
    retrieveMany?: number,
    deleteOne?: number,
    deleteMany?: number,
    persistValue?: number,
    retrieveOneValue?: number
): void {
    const {
        spyPersist,
        spyRetrieveOne,
        spyRetrieveMany,
        spyDeleteOne,
        spyDeleteMany,
        spyPersistValue,
        spyRetrieveOneValue
    } = spyContainer;
    if (persist) {
        expect(spyPersist).toHaveBeenCalledTimes(persist);
    } else {
        expect(spyPersist).toHaveBeenCalledTimes(0);
    }
    if (persistValue) {
        expect(spyPersistValue).toHaveBeenCalledTimes(persistValue);
    } else {
        expect(spyPersistValue).toHaveBeenCalledTimes(0);
    }
    if (retrieveOne) {
        expect(spyRetrieveOne).toHaveBeenCalledTimes(retrieveOne);
    } else {
        expect(spyRetrieveOne).toHaveBeenCalledTimes(0);
    }
    if (retrieveOneValue) {
        expect(spyRetrieveOneValue).toHaveBeenCalledTimes(retrieveOneValue);
    } else {
        expect(spyRetrieveOneValue).toHaveBeenCalledTimes(0);
    }
    if (retrieveMany) {
        expect(spyRetrieveMany).toHaveBeenCalledTimes(retrieveMany);
    } else {
        expect(spyRetrieveMany).toHaveBeenCalledTimes(0);
    }
    if (deleteOne) {
        expect(spyDeleteOne).toHaveBeenCalledTimes(deleteOne);
    } else {
        expect(spyDeleteOne).toHaveBeenCalledTimes(0);
    }
    if (deleteMany) {
        expect(spyDeleteMany).toHaveBeenCalledTimes(deleteMany);
    } else {
        expect(spyDeleteMany).toHaveBeenCalledTimes(0);
    }
}

export function createOmegaRepoSpies(mockRepo: IOmegaRepository): RepoSpies {
    const spyPersist = jest.spyOn(mockRepo, 'persist');
    const spyRetrieveOne = jest.spyOn(mockRepo, 'retrieveOne');
    const spyRetrieveMany = jest.spyOn(mockRepo, 'retrieveMany');
    const spyDeleteOne = jest.spyOn(mockRepo, 'deleteOne');
    const spyDeleteMany = jest.spyOn(mockRepo, 'deleteMany');
    const spyPersistValue = jest.spyOn(mockRepo, 'persistValue');
    const spyRetrieveOneValue = jest.spyOn(mockRepo, 'retrieveOneValue');

    return {
        spyPersist,
        spyRetrieveOne,
        spyRetrieveMany,
        spyDeleteOne,
        spyDeleteMany,
        spyPersistValue,
        spyRetrieveOneValue
    };
}

export type RepoSpies = {
    spyPersist: any;
    spyRetrieveOne: any;
    spyRetrieveMany: any;
    spyDeleteOne: any;
    spyDeleteMany: any;
    spyPersistValue: any;
    spyRetrieveOneValue: any;
};

export function createOmegaRepoMock(
    _persist?: RepositoryPersist,
    _retrieveOne?: RepositoryGetSingle,
    _retrieveMany?: RepositoryGetMany,
    _deleteOne?: RepositoryActSingle,
    _deleteMany?: RepositoryActMany,
    _persistValue?: RepositoryActSingleValue,
    _retrieveOneValue?: RepositoryGetSingleValue
): IOmegaRepository {
    const tableMapper = new FlatMapper(testMapPath);
    const mockOmegaRepository = new MockOmegaRepository(tableMapper);
    if (_persist) {
        mockOmegaRepository.persist = _persist;
    }
    if (_persistValue) {
        mockOmegaRepository.persistValue = _persistValue;
    }
    if (_retrieveOne) {
        mockOmegaRepository.retrieveOne = _retrieveOne;
    }
    if (_retrieveOneValue) {
        mockOmegaRepository.retrieveOneValue = _retrieveOneValue;
    }
    if (_retrieveMany) {
        mockOmegaRepository.retrieveMany = _retrieveMany;
    }
    if (_deleteOne) {
        mockOmegaRepository.deleteOne = _deleteOne;
    }
    if (_deleteMany) {
        mockOmegaRepository.deleteMany = _deleteMany;
    }

    return mockOmegaRepository;
}
class MockOmegaRepository implements IOmegaRepository {
    private tableMapper: FlatMapper;
    constructor(_tableMapper: FlatMapper) {
        this.tableMapper = _tableMapper;
    }
    public persist: RepositoryPersist = async (a: OmegaObject[], b?: boolean): Promise<void | OmegaObject[]> => {
        if (b) {
            return a;
        }
        return;
    };
    public persistValue: RepositoryActSingleValue = async (
        a: string,
        b: OmegaFieldValuePair,
        c: OmegaRecordId
    ): Promise<void> => {
        return;
    };
    public retrieveOne: RepositoryGetSingle = async (a: string, b: OmegaRecordId): Promise<OmegaObject> => {
        return null;
    };
    public retrieveOneValue: RepositoryGetSingleValue = async (
        a: string,
        b: string,
        c: OmegaRecordId
    ): Promise<OmegaValue> => {
        return null;
    };
    public retrieveMany: RepositoryGetMany = async (a: string, b: OmegaCriteria): Promise<OmegaObject[]> => {
        return [];
    };
    public deleteOne: RepositoryActSingle = async (a: string, b: OmegaRecordId): Promise<number> => {
        return 0;
    };
    public deleteMany: RepositoryActMany = async (a: string, b: OmegaCriteria): Promise<number> => {
        return 0;
    };
    public addFieldTransformToMap(source: string, field: string, f?: FieldTransformFunction) {
        if (typeof f === 'function') {
            this.tableMapper.addFieldTransform(source, field, f);
        } else {
            this.tableMapper.removeFieldTransform(source, field);
        }
        return;
    }
    public addPropertyTransformToMap(source: string, field: string, f?: FieldTransformFunction) {
        if (typeof f === 'function') {
            this.tableMapper.addPropertyTransform(source, field, f);
        } else {
            this.tableMapper.removeFieldTransform(source, field);
        }
        return;
    }
    public getTableMap = (source: string): OmegaTableMap => {
        return this.tableMapper.getTableMap(source);
    };
}
