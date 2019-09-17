import { IOmegaFactory } from '.';
import { OmegaDalConfig, OmegaCriteria } from '../dal';
import { OmegaBaseObject } from '../object';
import { OmegaObject } from '../object/omegaObject';
import { OmegaRecordId } from '../common/types';
import { OmegaRepository } from '../repository/omegaRepository';
import { MySqlDal } from '../dal/mysqlDal';

const repoCollection: OmegaRepository[] = [];
const repoConfigCollection: OmegaDalConfig[] = [];

export class OmegaFactory implements IOmegaFactory {
    public async createConnection(dalConfig: OmegaDalConfig, tableMapPath: string): Promise<number> {
        let foundIndex = repoConfigCollection.findIndex(omegaConfig => {
            return omegaConfig.database === dalConfig.database && omegaConfig.host === dalConfig.host && omegaConfig.user == dalConfig.user;
        });
        if (foundIndex === -1) {
            const mySqlDal = new MySqlDal(dalConfig, tableMapPath);
            repoConfigCollection.push(dalConfig);
            const newRepo = new OmegaRepository(mySqlDal);
            repoCollection.push(newRepo);
            foundIndex = repoCollection.length - 1;
        }
        return foundIndex;
    }
    public async persistObjectToDb(externalObjects: OmegaBaseObject[], repoIndex: number, returnObjects?: boolean): Promise<void | OmegaObject[]> {
        return repoCollection[repoIndex].persist(externalObjects, returnObjects);
    }
    public async retreiveObjectFromDb(omegaObject: OmegaBaseObject, repoIndex: number): Promise<OmegaObject> {
        const tableMap = repoCollection[repoIndex].getTableMap(omegaObject.objectSource);
        const identityField = tableMap.identity;
        return repoCollection[repoIndex].retrieveOne(omegaObject.objectSource, omegaObject.objectData[identityField] as OmegaRecordId);
    }
    public async retrieveObjectsFromDb(source: string, criteria: OmegaCriteria, repoIndex: number): Promise<OmegaObject[]> {
        return repoCollection[repoIndex].retrieveMany(source, criteria);
    }
    public async deleteObjectFromDb(omegaObject: OmegaBaseObject, repoIndex: number): Promise<number> {
        const tableMap = repoCollection[repoIndex].getTableMap(omegaObject.objectSource);
        const identityField = tableMap.identity;
        return repoCollection[repoIndex].deleteOne(omegaObject.objectSource, omegaObject.objectData[identityField] as OmegaRecordId);
    }
    public async deleteObjectsFromDb(source: string, criteria: OmegaCriteria, repoIndex: number): Promise<number> {
        return repoCollection[repoIndex].deleteMany(source, criteria);
    }
}
