import { IOmegaDal, OmegaDalRecord, OmegaCriteria } from '../../../../src/dal';
import { FlatMapper } from '../../../../src/mapper/flatMapper';
import { cloneDeep } from 'lodash';
import { OmegaRecordId } from '../../../../src/common/types';

export function assertDalUsageCounts(
    spyContainer: DalSpies,
    createTimes?: number,
    readTimes?: number,
    updateTimes?: number,
    deleteTimes?: number
): void {
    const { spyCreate, spyRead, spyUpdate, spyDelete } = spyContainer;
    if (createTimes) {
        expect(spyCreate).toHaveBeenCalledTimes(createTimes);
    } else {
        expect(spyCreate).toHaveBeenCalledTimes(0);
    }
    if (readTimes) {
        expect(spyRead).toHaveBeenCalledTimes(readTimes);
    } else {
        expect(spyRead).toHaveBeenCalledTimes(0);
    }
    if (updateTimes) {
        expect(spyUpdate).toHaveBeenCalledTimes(updateTimes);
    } else {
        expect(spyUpdate).toHaveBeenCalledTimes(0);
    }
    if (deleteTimes) {
        expect(spyDelete).toHaveBeenCalledTimes(deleteTimes);
    } else {
        expect(spyDelete).toHaveBeenCalledTimes(0);
    }
}

export function createOmegaDalSpies(mockDal: IOmegaDal): DalSpies {
    const spyCreate = jest.spyOn(mockDal, 'create');
    const spyRead = jest.spyOn(mockDal, 'read');
    const spyUpdate = jest.spyOn(mockDal, 'update');
    const spyDelete = jest.spyOn(mockDal, 'delete');
    return { spyCreate, spyRead, spyUpdate, spyDelete };
}
export type DalSpies = {
    spyCreate: any;
    spyRead: any;
    spyUpdate: any;
    spyDelete: any;
};

export function createOmegaDalMock(
    mapPath: string,
    _create?: IOmegaDal['create'],
    _read?: IOmegaDal['read'],
    _update?: IOmegaDal['update'],
    _delete?: IOmegaDal['delete']
): IOmegaDal {
    const omegaDalMock = cloneDeep(genericOmegaDal);
    omegaDalMock.mapper = new FlatMapper(mapPath);
    if (_create) {
        omegaDalMock.create = _create;
    }
    if (_read) {
        omegaDalMock.read = _read;
    }
    if (_update) {
        omegaDalMock.update = _update;
    }
    if (_delete) {
        omegaDalMock.delete = _delete;
    }
    return omegaDalMock;
}

const genericOmegaDal = {
    mapper: null,
    create(table: string, newRecord: OmegaDalRecord): Promise<OmegaRecordId> {
        return null;
    },
    read(table: string, criteria: OmegaCriteria): Promise<OmegaDalRecord[]> {
        return null;
    },
    update(table: string, updates: Partial<OmegaDalRecord>, criteria: OmegaCriteria): Promise<number> {
        return null;
    },
    delete(table: string, criteria: OmegaCriteria): Promise<number> {
        return null;
    },
    closeAll(): Promise<void> {
        return null;
    }
};
