import { MySqlDal } from '../../../src/dal/mysqlDal';
import { OmegaRepository } from '../../../src/repository/omegaRepository';

const integrationConfig = {
    connectionLimit: 10,
    host: 'localhost',
    user: 'omegaint',
    password: 'dev1PASS@',
    database: 'omegaintegrationtest'
};
const integrationMapPath = 'test/dal/integration/fixtures/integration-map.json';
const mySqlDal = new MySqlDal(integrationConfig, integrationMapPath);
const testRepo = new OmegaRepository(mySqlDal);

describe('When using an OmegaObject with a live mySql connection', () => {
    describe('And using the save method', () => {
        describe('After making a valid change', () => {
            xtest('The operation completes without error', async () => {
                // test
            });
            xtest('The change remains present on the object after completion', async () => {
                // test
            });
            xtest('The change persists when requesting a new copy of the same object', async () => {
                // test
            });
        });
        describe('After making a change that violates the data type', () => {
            xtest('The operation failes with the expected error', () => {
                // test
            })
        })
        describe('After making a change that violates the data valiation rules', () => {
            xtest('The operation failes with the expected error', () => {
                // test
            })
        })
    })
})