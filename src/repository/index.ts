import { OmegaCriteria } from '../dal';
import { OmegaObject } from '../object/omegaObject';
import { OmegaTableMap } from '../mapper';
import { OmegaValue } from '../common/types';

export interface IOmegaRepository {
    persist: RepositoryPersist;
    persistValue: RepositoryActSingleValue;
    retrieveOne: RepositoryGetSingle;
    retrieveOneValue: RepositoryGetSingleValue;
    retrieveMany: RepositoryGetMany;
    deleteOne: RepositoryActSingle;
    deleteMany: RepositoryActMany;
    getTableMap(source: string): OmegaTableMap;
    addFieldTransformToMap(source: string, field: string, f: FieldTransformFunction);
    addPropertyTransformToMap(source: string, field: string, f: FieldTransformFunction);
}
export type RepositoryPersist = (
    externalObjects: OmegaObject[],
    returnObjects?: boolean
) => Promise<void | OmegaObject[]>;
export type RepositoryGetSingle = (source: string, objectId: string | number) => Promise<OmegaObject>;
export type RepositoryGetSingleValue = (
    source: string,
    field: string,
    objectId: string | number
) => Promise<OmegaValue>;
export type RepositoryGetMany = (source: string, criteria: OmegaCriteria) => Promise<OmegaObject[]>;
export type RepositoryActSingle = (source: string, objectId: string | number) => Promise<number>;
export type RepositoryActSingleValue = (
    source: string,
    field: OmegaFieldValuePair,
    objectId: string | number
) => Promise<void>;
export type RepositoryActMany = (source: string, criteria: OmegaCriteria) => Promise<number>;
export interface OmegaFieldValuePair {
    fieldName: string;
    fieldValue: OmegaValue | undefined;
}
export type RepositorySingleParameters = { source: string; objectId: string | number };
export type RepositoryManyParameters = {
    source: string;
    criteria: OmegaCriteria;
    fields?: string[];
    values?: OmegaValue[];
};
export type FieldTransformFunction = (value: OmegaValue, savedValue?: OmegaValue) => Promise<OmegaValue>;
