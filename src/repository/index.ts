import { OmegaCriteria } from '../dal';
import { OmegaObject } from '../object/omegaObject';
import { OmegaTableMap } from '../mapper';
import { OmegaValue } from '../common/types';

export interface IOmegaRepository {
    persist: RepositoryPersist;
    retrieveOne: RepositoryGetSingle;
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
export type RepositoryGetMany = (source: string, criteria: OmegaCriteria) => Promise<OmegaObject[]>;
export type RepositoryActSingle = (source: string, objectId: string | number) => Promise<number>;
export type RepositoryActMany = (source: string, criteria: OmegaCriteria) => Promise<number>;
export interface ValidationField {
    fieldName: string;
    fieldValue: OmegaValue | undefined;
    fieldTransform?: FieldTransformFunction;
}
export type FieldTransformFunction = (value: OmegaValue) => OmegaValue;
