import { OmegaCriteria } from '../dal';
import { IOmegaObject } from '../object';
import { OmegaTableMap } from '../mapper';

export interface IOmegaRepository {
    persist: RepositoryPersist;
    persistLateralAssociation: RepositoryActAssociations;
    retrieveOne: RepositoryGetSingle;
    retrieveMany: RepositoryGetMany;
    retrieveByChildAssociation: RepositoryGetAssociations;
    retrieveByLateralAssociation: RepositoryGetAssociations;
    deleteOne: RepositoryActSingle;
    deleteMany: RepositoryActMany;
    deleteLateralAssociation: RepositoryActAssociations;
    getTableMap(source: string): OmegaTableMap;
}

export type RepositoryPersist = (
    externalObjects: IOmegaObject[],
    returnObjects?: boolean
) => Promise<void | IOmegaObject[]>;
export type RepositoryGetSingle = (source: string, objectId: string | number) => Promise<IOmegaObject>;
export type RepositoryGetMany = (source: string, criteria: OmegaCriteria) => Promise<IOmegaObject[]>;
export type RepositoryActSingle = (source: string, objectId: string | number) => Promise<number>;
export type RepositoryActMany = (source: string, criteria: OmegaCriteria) => Promise<number>;
export type RepositoryGetAssociations = (
    source: string,
    sourceId: number | string,
    target: string
) => Promise<IOmegaObject[]>;
export type RepositoryActAssociations = (
    source: string,
    sourceId: number | string,
    target: string,
    targetId: number | string
) => Promise<void>;

export interface ValidationField {
    fieldName: string;
    fieldValue: string | number | Date | undefined;
}
