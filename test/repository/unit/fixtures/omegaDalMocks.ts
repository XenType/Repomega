import { IOmegaDal, OmegaDalRecord, OmegaCriteria } from '../../../../src/dal';
import { FlatMapper } from '../../../../src/mapper/flatMapper';
import { cloneDeep } from 'lodash';

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
    create(table: string, newRecord: OmegaDalRecord): Promise<string | number> {
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
