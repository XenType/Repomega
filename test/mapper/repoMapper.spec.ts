import { RepoMapper } from '../../src/mapper/repoMapper';
import { TestTable } from './fixtures';

describe('When using dal-to-serviceMapper', () => {
    describe('And passing invalid file parameter', () => {
        test('It throws an error with the expected message when file does not exist', () => {
            let errorMessage = '';
            const badFilePath = './bleh.json';
            try {
                const mapper = new RepoMapper(badFilePath);
            } catch (error) {
                errorMessage = error.message;
            }
            expect(errorMessage).toEqual(`Unable to load map file: ${badFilePath}`);
        });
        test('It throws an error with the expected message when file is not JSON', () => {
            let errorMessage = '';
            const badFilePath = 'test/mapper/badjsonfixture.json';
            try {
                const mapper = new RepoMapper(badFilePath);
            } catch (error) {
                errorMessage = error.message;
            }
            expect(errorMessage).toEqual(`File does not contain valid JSON data: ${badFilePath}`);
        });
        test('It throws an error with expected message when getTableMap is called for a missing table', () => {
            let errorMessage = '';
            const badFilePath = 'test/mapper/fixtures.json';
            const mapper = new RepoMapper(badFilePath);
            try {
                mapper.getTableMap(TestTable.MISSINGTEST);
            } catch (error) {
                errorMessage = error.message;
            }
            expect(errorMessage).toEqual(
                `File does not contain requested table (${TestTable.MISSINGTEST}): ${badFilePath}`
            );
        });
    });
    describe('And passing a path to a valid JSON file', () => {
        describe('And calling getTableMap', () => {
            test('It returns expected map object', () => {
                const expectedMap = {
                    id: { name: 'rt_id', external: true },
                    testOne: { name: 'test_one', external: true },
                    testTwo: { name: 'test_two', external: true },
                    testThree: { name: 'test_three', external: true },
                    testExternal: { name: 'ext_test', external: false }
                };
                const mapper = new RepoMapper('test/mapper/fixtures.json');
                const actualMap = mapper.getTableMap(TestTable.READTEST);
                expect(actualMap).toStrictEqual(expectedMap);
            });
        });
        describe('And calling getTableList', () => {
            test('It returns expected list of table names', () => {
                const expectedTableList = {
                    ReadTests: 'reading_test',
                    WriteTests: 'writing_test'
                };
                const mapper = new RepoMapper('test/mapper/fixtures.json');
                const actualTableList = mapper.getTableList();
                expect(actualTableList).toStrictEqual(expectedTableList);
            });
        });
    });
});
