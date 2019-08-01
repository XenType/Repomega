import { FlatMapper } from '../../src/mapper/flatMapper';
import { ErrorSource, ErrorSuffix } from '../../src/common';
import { OmegaTableIndex } from '../../src/mapper';
const tableMapFixture = require('./fixtures/flat-table-map-fixture.json');

describe('When using FlatMapper', () => {
    describe('And creating an instance of FlatMapper', () => {
        test('It throws expected error when file does not exist', () => {
            let message = '';
            const badFilePath = './bleh.json';
            try {
                const mapper = new FlatMapper(badFilePath);
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual('Flat Mapper: ' + ErrorSource.TABLE_MAP_FILE + ' ' + ErrorSuffix.NOT_FOUND);
        });
        test('It throws expected error when file does not contain valid JSON data', () => {
            let message = '';
            const badFilePath = 'test/mapper/fixtures/badjsonfixture.json';
            try {
                const mapper = new FlatMapper(badFilePath);
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual('Flat Mapper: ' + ErrorSource.TABLE_MAP_FILE + ' ' + ErrorSuffix.BAD_JSON_FORMAT);
        });
        test('It completes without error when given a file with vaild JSON', () => {
            let message = '';
            const goodFilePath = 'test/mapper/fixtures/flat-table-map-fixture.json';
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
            const goodFilePath = 'test/mapper/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            const tableIndex = mapper.getTableIndex();
            expect(tableIndex).toStrictEqual(expectedTableIndex);
        });
        test('It throws expected Error when a table has an invalid name property', () => {
            const invalidFilePath = 'test/mapper/fixtures/bad-format-fixture.json';
            const mapper = new FlatMapper(invalidFilePath);
            let message = '';
            try {
                const tableIndex = mapper.getTableIndex();
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual('Flat Mapper: ' + ErrorSource.TABLE_MAP_FILE + ' ' + ErrorSuffix.BAD_OMEGA_FORMAT);
        });
    });
    describe('And calling getTableMap', () => {
        test('It returns expected object with no errors when a valid table is requested', () => {
            const expectedTableMap = tableMapFixture.Market;
            const goodFilePath = 'test/mapper/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            const tableMap = mapper.getTableMap('Market');
            expect(tableMap).toStrictEqual(expectedTableMap);
        });
        test('It throws expected error when requested table is not found', () => {
            let message = '';
            const expectedTableMap = tableMapFixture.Market;
            const goodFilePath = 'test/mapper/fixtures/flat-table-map-fixture.json';
            const mapper = new FlatMapper(goodFilePath);
            try {
                const tableMap = mapper.getTableMap('notfound');
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual('Flat Mapper: ' + ErrorSource.REQUESTED_TABLE_MAP + ' ' + ErrorSuffix.NOT_FOUND);
        });
    });
});
