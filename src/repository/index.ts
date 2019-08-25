import { OmegaCriteria } from '../dal';
import { OmegaObject } from '../object/omegaObject';
import { OmegaTableMap } from '../mapper';

export interface IOmegaRepository {
    persist: RepositoryPersist;
    retrieveOne: RepositoryGetSingle;
    retrieveMany: RepositoryGetMany;
    deleteOne: RepositoryActSingle;
    deleteMany: RepositoryActMany;
    getTableMap(source: string): OmegaTableMap;
}

export type RepositoryPersist = (
    externalObjects: OmegaObject[],
    returnObjects?: boolean
) => Promise<void | OmegaObject[]>;
export type RepositoryGetSingle = (source: string, objectId: string | number) => Promise<OmegaObject>;
export type RepositoryGetMany = (source: string, criteria: OmegaCriteria) => Promise<OmegaObject[]>;
export type RepositoryActSingle = (source: string, objectId: string | number) => Promise<number>;
export type RepositoryActMany = (source: string, criteria: OmegaCriteria) => Promise<number>;

export interface ValidationField {
    fieldName: string;
    fieldValue: string | number | Date | undefined;
}
