import { MySqlDal } from '../../../src/dal/mysqlDal';
import { OmegaRepository } from '../../../src/repository/omegaRepository';
import { OmegaFactory } from '../../../src/factory/repoFactory';
jest.mock('../../../src/dal/mysqlDal');
jest.mock('../../../src/repository/omegaRepository');

const integrationConfig1 = {
    connectionLimit: 10,
    host: 'localhost',
    user: 'omegaint',
    password: 'dev1PASS@',
    database: 'omegaintegrationtest'
};
const integrationConfig2 = {
    connectionLimit: 10,
    host: 'site.mysql.com',
    user: 'omegaint',
    password: 'dev1PASS@',
    database: 'omegaintegrationtest'
};
const integrationMapPath = 'test/dal/integration/fixtures/integration-map.json';

describe('When creating a new connection', () => {
    test('It passes the dalConfig argument to the OmegaDal object constructor', async () => {
        const factory = new OmegaFactory();
        const index = await factory.createConnection(integrationConfig1, integrationMapPath);
        expect(MySqlDal).toHaveBeenCalledTimes(1);
        expect(MySqlDal).toHaveBeenCalledWith(integrationConfig1, integrationMapPath);
    });
    test('It creates an OmegaRepository Object', async () => {
        const factory = new OmegaFactory();
        const index = await factory.createConnection(integrationConfig2, integrationMapPath);
        expect(OmegaRepository).toHaveBeenCalledTimes(1);
    });
    test('It returns a sequential index for each unique connection request', async () => {
        const factory = new OmegaFactory();
        const index1 = await factory.createConnection(integrationConfig1, integrationMapPath);
        const index2 = await factory.createConnection(integrationConfig2, integrationMapPath);
        const index3 = await factory.createConnection(integrationConfig1, integrationMapPath);
        expect(index1).toEqual(0);
        expect(index2).toEqual(1);
        expect(index3).toEqual(0);
    });
});
