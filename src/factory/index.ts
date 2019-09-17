import { OmegaDalConfig, OmegaCriteria } from '../dal';
import { OmegaBaseObject } from '../object';
import { OmegaObject } from '../object/omegaObject';

export interface IOmegaFactory {
    createConnection(dalConfig: OmegaDalConfig, tableMapPath: string): Promise<number>;
    persistObjectToDb(externalObjects: OmegaBaseObject[], repoIndex: number, returnObjects?: boolean): Promise<void | OmegaObject[]>;
    retreiveObjectFromDb(externalObject: OmegaBaseObject, repoIndex: number): Promise<OmegaObject>;
    retrieveObjectsFromDb(source: string, criteria: OmegaCriteria, repoIndex: number): Promise<OmegaObject[]>;
    deleteObjectFromDb(externalObject: OmegaBaseObject, repoIndex: number): Promise<number>;
    deleteObjectsFromDb(source: string, criteria: OmegaCriteria, repoIndex: number): Promise<number>;
}
