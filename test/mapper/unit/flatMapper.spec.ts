import { FlatMapper } from '../../../src/mapper/flatMapper';
import { ErrorSource, ErrorSuffix } from '../../../src/common';
import { OmegaTableIndex } from '../../../src/mapper';
const tableMapFixture = require('./fixtures/flat-table-map-fixture.json');

describe('When using FlatMapper', () => {
    describe('And creating an instance of FlatMapper', () => {
        test('It throws expected error when file does not exist', () => {
            let message = '';
            const badFilePath = 'bleh.json';
            try {
                const mapper = new FlatMapper(badFilePath);
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual('Flat Mapper: ' + ErrorSource.TABLE_MAP_FILE + ' ' + ErrorSuffix.NOT_FOUND);
        });
        test('It throws expected error when file does not contain valid JSON data', () => {
            let message = '';
            const badFilePath = 'test/mapper/unit/fixtures/badjsonfixture.json';
            try {
                const mapper = new FlatMapper(badFilePath);
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual('Flat Mapper: ' + ErrorSource.TABLE_MAP_FILE + ' ' + ErrorSuffix.BAD_JSON_FORMAT);
        });
        test('It completes without error when given a file with vaild JSON', () => {
            let message = '';
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            try {
                const mapper = new FlatMapper(goodFilePath);
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual('');
        });
    });
    describe('And calling getTableIndex', () => {
        test('It returns expected OmegaTableIndex', () => {
            const expectedTableIndex: OmegaTableIndex = {
                Market: 'test_market',
                Company: 'test_company',
                OptionGroup: 'test_group',
                OptionValue: 'test_value',
                User: 'test_user',
                UserOptionGroupLink: 'test_user_group_link',
                UserOptionValueLink: 'test_user_value_link',
                BasicTests: 'test_basic'
            };
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            const tableIndex = mapper.getTableIndex();
            expect(tableIndex).toStrictEqual(expectedTableIndex);
        });
        test('It throws expected Error when a table has an invalid name property', () => {
            const invalidFilePath = 'test/mapper/unit/fixtures/bad-format-fixture.json';
            const mapper = new FlatMapper(invalidFilePath);
            let message = '';
            try {
                mapper.getTableIndex();
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual('Flat Mapper: ' + ErrorSource.TABLE_MAP_FILE + ' ' + ErrorSuffix.BAD_OMEGA_FORMAT);
        });
    });
    describe('And calling getTableMap', () => {
        test('It returns expected object with no errors when a valid table is requested', () => {
            const expectedTableMap = tableMapFixture.Market;
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            const tableMap = mapper.getTableMap('Market');
            expect(tableMap).toStrictEqual(expectedTableMap);
        });
        test('It throws expected error when requested table is not found', () => {
            let message = '';
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            try {
                mapper.getTableMap('notfound');
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual(
                'Flat Mapper: ' +
                    ErrorSource.REQUESTED_TABLE_MAP +
                    ' ' +
                    ErrorSuffix.NOT_FOUND_EXAMPLE.replace('{0}', 'notfound')
            );
        });
    });
    describe('And calling addFieldTransform', () => {
        test('It throws expected error when requested table is not found', () => {
            let message = '';
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            try {
                mapper.addFieldTransform('notfound', 'notfoundfield', async function(a) {
                    return a;
                });
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual(
                'Flat Mapper: ' +
                    ErrorSource.REQUESTED_TABLE_MAP +
                    ' ' +
                    ErrorSuffix.NOT_FOUND_EXAMPLE.replace('{0}', 'notfound')
            );
        });
        test('It throws expected error when requested field is not found', () => {
            let message = '';
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            try {
                mapper.addFieldTransform('Market', 'notfoundfield', async function(a) {
                    return a;
                });
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual(
                'Flat Mapper: ' +
                    ErrorSource.REQUESTED_TABLE_MAP_FIELD +
                    ' ' +
                    ErrorSuffix.NOT_FOUND_EXAMPLE.replace('{0}', 'notfoundfield')
            );
        });
        test('It adds the function as the transform property of the tables field', () => {
            let message = '';
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            const transform = async a => {
                return `--${a}--`;
            };
            mapper.addFieldTransform('User', 'password', transform);
            const tableMap = mapper.getTableMap('User');
            expect(tableMap.fields['password'].transformToField).toStrictEqual(transform);
        });
        test('The provided function returns the expected result after being added', async () => {
            let message = '';
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            const transform = async a => {
                return `--${a}--`;
            };
            mapper.addFieldTransform('User', 'password', transform);
            const tableMap = mapper.getTableMap('User');
            const value = await tableMap.fields['password'].transformToField('word');
            expect(value).toEqual(`--word--`);
        });
    });
    describe('And calling addPropertyTransform', () => {
        test('It throws expected error when requested table is not found', () => {
            let message = '';
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            try {
                mapper.addPropertyTransform('notfound', 'notfoundfield', async function(a) {
                    return a;
                });
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual(
                'Flat Mapper: ' +
                    ErrorSource.REQUESTED_TABLE_MAP +
                    ' ' +
                    ErrorSuffix.NOT_FOUND_EXAMPLE.replace('{0}', 'notfound')
            );
        });
        test('It throws expected error when requested field is not found', () => {
            let message = '';
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            try {
                mapper.addPropertyTransform('Market', 'notfoundfield', async function(a) {
                    return a;
                });
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual(
                'Flat Mapper: ' +
                    ErrorSource.REQUESTED_TABLE_MAP_FIELD +
                    ' ' +
                    ErrorSuffix.NOT_FOUND_EXAMPLE.replace('{0}', 'notfoundfield')
            );
        });
        test('It adds the function as the transform property of the tables field', () => {
            let message = '';
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            const transform = async a => {
                return `--${a}--`;
            };
            mapper.addPropertyTransform('User', 'password', transform);
            const tableMap = mapper.getTableMap('User');
            expect(tableMap.fields['password'].transformToProperty).toStrictEqual(transform);
        });
        test('The provided function returns the expected result after being added', async () => {
            let message = '';
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            const transform = async a => {
                return `--${a}--`;
            };
            mapper.addPropertyTransform('User', 'password', transform);
            const tableMap = mapper.getTableMap('User');
            const value = await tableMap.fields['password'].transformToProperty('word');
            expect(value).toEqual(`--word--`);
        });
    });
    describe('And calling removeFieldTransform', () => {
        test('It throws expected error when requested table is not found', () => {
            let message = '';
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            try {
                mapper.removeFieldTransform('notfound', 'notfoundfield');
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual(
                'Flat Mapper: ' +
                    ErrorSource.REQUESTED_TABLE_MAP +
                    ' ' +
                    ErrorSuffix.NOT_FOUND_EXAMPLE.replace('{0}', 'notfound')
            );
        });
        test('It throws expected error when requested field is not found', () => {
            let message = '';
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            try {
                mapper.removeFieldTransform('Market', 'notfoundfield');
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual(
                'Flat Mapper: ' +
                    ErrorSource.REQUESTED_TABLE_MAP_FIELD +
                    ' ' +
                    ErrorSuffix.NOT_FOUND_EXAMPLE.replace('{0}', 'notfoundfield')
            );
        });
        test('It removes the function from the transform property of the tables field', () => {
            let message = '';
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            const transform = async a => {
                return `--${a}--`;
            };
            mapper.addFieldTransform('User', 'password', transform);
            mapper.removeFieldTransform('User', 'password');
            const tableMap = mapper.getTableMap('User');
            expect(tableMap.fields['password'].transformToField).toBeUndefined();
        });
    });
    describe('And calling removePropertyTransform', () => {
        test('It throws expected error when requested table is not found', () => {
            let message = '';
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            try {
                mapper.removePropertyTransform('notfound', 'notfoundfield');
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual(
                'Flat Mapper: ' +
                    ErrorSource.REQUESTED_TABLE_MAP +
                    ' ' +
                    ErrorSuffix.NOT_FOUND_EXAMPLE.replace('{0}', 'notfound')
            );
        });
        test('It throws expected error when requested field is not found', () => {
            let message = '';
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            try {
                mapper.removePropertyTransform('Market', 'notfoundfield');
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual(
                'Flat Mapper: ' +
                    ErrorSource.REQUESTED_TABLE_MAP_FIELD +
                    ' ' +
                    ErrorSuffix.NOT_FOUND_EXAMPLE.replace('{0}', 'notfoundfield')
            );
        });
        test('It removes the function as the transform property of the tables field', () => {
            let message = '';
            const goodFilePath = 'test/mapper/unit/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            const transform = async a => {
                return `--${a}--`;
            };
            mapper.addPropertyTransform('User', 'password', transform);
            mapper.removePropertyTransform('User', 'password');
            const tableMap = mapper.getTableMap('User');
            expect(tableMap.fields['password'].transformToProperty).toBeUndefined();
        });
    });
});
