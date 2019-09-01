import { createOmegaDalMock } from './fixtures/omegaDalMocks';
import { OmegaRepository } from '../../../src/repository/omegaRepository';
import { OmegaCriteria, OmegaDalRecord } from '../../../src/dal';
import { ErrorSource, ErrorSuffix } from '../../../src/common';
import { OmegaObjectData, OmegaBaseObject } from '../../../src/object';
import { OmegaObject } from '../../../src/object/omegaObject';
import { cloneDeep } from 'lodash';

// This is not the standard integration-map.json because a badly formatted table object is required for testing
const testMapPath = 'test/repository/unit/fixtures/mapping-function-testMap.json';
const testDal = createOmegaDalMock(testMapPath);
const testRepo = new OmegaRepository(testDal);

describe('When using mapping functions of an omegaRepository', () => {
    describe('And calling createIdentityCriteria', () => {
        test('If a valid table and objectId are passed the expected result is returned', () => {
            const expectedResult: OmegaCriteria = {
                _and: [{ field: 'test_market_id', value: 12 }]
            };
            const actualResult = testRepo.createIdentityCriteria('Market', 12);
            expect(actualResult).toStrictEqual(expectedResult);
        });
        test('If an invalid table name is passed the expected exception is thrown', () => {
            let message = '';
            try {
                testRepo.createIdentityCriteria('NotThere', 12);
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual(
                'Flat Mapper: ' +
                    ErrorSource.REQUESTED_TABLE_MAP +
                    ' ' +
                    ErrorSuffix.NOT_FOUND_EXAMPLE.replace('{0}', 'NotThere')
            );
        });
        test('If mapper schema is not sufficient to create request the expected exception is thrown', () => {
            let message = '';
            try {
                testRepo.createIdentityCriteria('InvalidMap', 12);
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual(
                'Omega Repository: ' + ErrorSource.REQUESTED_TABLE_MAP + ' ' + ErrorSuffix.BAD_OMEGA_FORMAT
            );
        });
    });
    describe('And calling mapExternalCriteriaToDalCriteria', () => {
        test('If a valid table and one-AND criteria are passed the expected result is returned', () => {
            const expectedResult: OmegaCriteria = {
                _and: [{ field: 'first_name', value: 'bob' }]
            };
            const inputCritera: OmegaCriteria = {
                _and: [{ field: 'firstName', value: 'bob' }]
            };
            const actualResult = testRepo.mapExternalCriteriaToDalCriteria('User', inputCritera);
            expect(actualResult).toStrictEqual(expectedResult);
        });
        test('If a valid table and two-AND criteria are passed the expected result is returned', () => {
            const expectedResult: OmegaCriteria = {
                _and: [{ field: 'first_name', value: 'bob' }, { field: 'last_name', value: 'smith' }]
            };
            const inputCritera: OmegaCriteria = {
                _and: [{ field: 'firstName', value: 'bob' }, { field: 'lastName', value: 'smith' }]
            };
            const actualResult = testRepo.mapExternalCriteriaToDalCriteria('User', inputCritera);
            expect(actualResult).toStrictEqual(expectedResult);
        });
        test('If a valid table and three-AND-subLast-one-AND criteria are passed the expected result is returned', () => {
            const expectedResult: OmegaCriteria = {
                _and: [
                    { field: 'first_name', value: 'bob' },
                    { field: 'last_name', value: 'smith' },
                    { _and: [{ field: 'last_rating', value: 1 }] }
                ]
            };
            const inputCritera: OmegaCriteria = {
                _and: [
                    { field: 'firstName', value: 'bob' },
                    { field: 'lastName', value: 'smith' },
                    { _and: [{ field: 'lastRating', value: 1 }] }
                ]
            };
            const actualResult = testRepo.mapExternalCriteriaToDalCriteria('User', inputCritera);
            expect(actualResult).toStrictEqual(expectedResult);
        });
        test('If a valid table and two-AND-subFirst-two-AND-subSecond-two-OR criteria are passed the expected result is returned', () => {
            const expectedResult: OmegaCriteria = {
                _and: [
                    { _and: [{ field: 'first_name', value: 'bob' }, { field: 'last_name', value: 'smith' }] },
                    { _or: [{ field: 'last_rating', value: 1 }, { field: 'user_type', value: 'demo' }] }
                ]
            };
            const inputCritera: OmegaCriteria = {
                _and: [
                    { _and: [{ field: 'firstName', value: 'bob' }, { field: 'lastName', value: 'smith' }] },
                    { _or: [{ field: 'lastRating', value: 1 }, { field: 'userType', value: 'demo' }] }
                ]
            };
            const actualResult = testRepo.mapExternalCriteriaToDalCriteria('User', inputCritera);
            expect(actualResult).toStrictEqual(expectedResult);
        });
        test('If a valid table and simple LinkTable criteria are passed the expected result is returned', () => {
            const expectedResult: OmegaCriteria = {
                _and: [
                    {
                        sourceField: 'test_user_id',
                        targetTable: 'test_user_group_link',
                        targetField: 'test_user_id',
                        criteria: { _or: [{ field: 'test_group_id', value: 1 }] }
                    }
                ]
            };
            const inputCritera: OmegaCriteria = {
                _and: [
                    {
                        sourceField: 'id',
                        targetTable: 'UserOptionGroupLink',
                        targetField: 'userId',
                        criteria: { _or: [{ field: 'optionGroupId', value: 1 }] }
                    }
                ]
            };
            const actualResult = testRepo.mapExternalCriteriaToDalCriteria('User', inputCritera);
            expect(actualResult).toStrictEqual(expectedResult);
        });
        test('If a valid table and a complex criteria are passed the expected result is returned', () => {
            const expectedResult: OmegaCriteria = {
                _or: [
                    { _and: [{ field: 'first_name', value: 'bob' }, { field: 'user_type', value: 'demo' }] },
                    {
                        _or: [
                            { field: 'last_rating', value: 1 },
                            {
                                sourceField: 'test_user_id',
                                targetTable: 'test_user_group_link',
                                targetField: 'test_user_id',
                                criteria: { _or: [{ field: 'test_group_id', value: 1 }] }
                            },
                            { field: 'last_name', value: 'smith' },
                            {
                                _and: [
                                    { field: 'first_name', value: 'jane' },
                                    { field: 'user_type', value: 'personal' }
                                ]
                            }
                        ]
                    }
                ]
            };
            const inputCritera: OmegaCriteria = {
                _or: [
                    { _and: [{ field: 'firstName', value: 'bob' }, { field: 'userType', value: 'demo' }] },
                    {
                        _or: [
                            { field: 'lastRating', value: 1 },
                            {
                                sourceField: 'id',
                                targetTable: 'UserOptionGroupLink',
                                targetField: 'userId',
                                criteria: { _or: [{ field: 'optionGroupId', value: 1 }] }
                            },
                            { field: 'lastName', value: 'smith' },
                            {
                                _and: [{ field: 'firstName', value: 'jane' }, { field: 'userType', value: 'personal' }]
                            }
                        ]
                    }
                ]
            };
            const actualResult = testRepo.mapExternalCriteriaToDalCriteria('User', inputCritera);
            expect(actualResult).toStrictEqual(expectedResult);
        });
        test('If an invalid table name is passed the expected exception is thrown', () => {
            let message = '';
            const inputCritera: OmegaCriteria = {
                _and: [{ field: 'firstName', value: 'bob' }]
            };
            try {
                testRepo.mapExternalCriteriaToDalCriteria('NotThere', inputCritera);
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual(
                'Flat Mapper: ' +
                    ErrorSource.REQUESTED_TABLE_MAP +
                    ' ' +
                    ErrorSuffix.NOT_FOUND_EXAMPLE.replace('{0}', 'NotThere')
            );
        });
        test('If mapper schema is not sufficient to create request the expected exception is thrown', () => {
            let message = '';
            const inputCritera: OmegaCriteria = {
                _and: [{ field: 'notthere', value: 'bob' }]
            };
            try {
                testRepo.mapExternalCriteriaToDalCriteria('User', inputCritera);
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual(
                'Omega Repository: ' + ErrorSource.REQUESTED_TABLE_MAP + ' ' + ErrorSuffix.BAD_OMEGA_FORMAT
            );
        });
    });
    describe('And calling mapRecordToObject', () => {
        test('If a valid table and record are passed it returns the expected object', () => {
            const expectedObjectData: OmegaObjectData = {
                id: 1,
                firstName: 'Bob',
                lastName: 'Smith',
                lastRating: null,
                createdOn: new Date('12/23/1977'),
                userType: 'admin',
                companyId: 1
            };
            const inputRecord: OmegaDalRecord = {
                test_user_id: 1,
                first_name: 'Bob',
                last_name: 'Smith',
                created_at: new Date('12/23/1977'),
                user_type: 'admin',
                test_company_id: 1
            };
            const actualObject = testRepo.mapRecordToObject('User', inputRecord);
            const expectedObject = new OmegaObject(undefined);
            expectedObject.objectSource = 'User';
            expectedObject.objectData = expectedObjectData;
            expect(actualObject).toEqual(expectedObject);
        });
        test('If transform function is present on a field, it is returned in the expected object', () => {
            const expectedObjectData: OmegaObjectData = {
                id: 1,
                firstName: 'Bob',
                lastName: 'Smith',
                lastRating: null,
                createdOn: new Date('12/23/1977'),
                userType: 'admin',
                companyId: 1
            };
            const inputRecord: OmegaDalRecord = {
                test_user_id: 1,
                first_name: 'Bob',
                last_name: 'Smith',
                created_at: new Date('12/23/1977'),
                user_type: 1,
                test_company_id: 1
            };
            function transform(value: number): string {
                if (value === 1) {
                    return 'admin';
                }
                return 'demo';
            }
            testRepo.addPropertyTransformToMap('User', 'userType', transform);
            const actualObject = testRepo.mapRecordToObject('User', inputRecord);
            const expectedObject = new OmegaObject(testRepo);
            expectedObject.objectSource = 'User';
            expectedObject.objectData = expectedObjectData;
            expect(actualObject).toEqual(expectedObject);
        });
        test('If an invalid table name is passed the expected exception is thrown', () => {
            let message = '';
            const inputRecord: OmegaDalRecord = {
                test_user_id: 1,
                first_name: 'Bob',
                last_name: 'Smith',
                last_rating: 10,
                created_at: new Date('12/23/1977'),
                user_type: 'admin',
                test_company_id: 1
            };
            try {
                testRepo.mapRecordToObject('NotThere', inputRecord);
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual(
                'Flat Mapper: ' +
                    ErrorSource.REQUESTED_TABLE_MAP +
                    ' ' +
                    ErrorSuffix.NOT_FOUND_EXAMPLE.replace('{0}', 'NotThere')
            );
        });
        test('If a record is missing an allowNull: false field the expected exception is thrown', () => {
            let message = '';
            const inputRecord: OmegaDalRecord = {
                test_user_id: 1,
                first_name: 'Bob',
                last_rating: 10,
                created_at: new Date('12/23/1977'),
                user_type: 'admin',
                test_company_id: 1
            };
            try {
                testRepo.mapRecordToObject('User', inputRecord);
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual(
                'Omega Repository: ' + ErrorSource.OMEGA_DAL_RECORD + ' ' + ErrorSuffix.MISSING_NO_NULL_FIELD
            );
        });
    });
    describe('And calling mapObjectToRecord', () => {
        test('If a valid non-new external object is passed the expected record is returned', () => {
            const expectedResult: OmegaDalRecord = {
                test_basic_id: 1,
                test_basic_string: 'abcd',
                test_basic_number: 10,
                test_basic_date: new Date('12/23/1977'),
                test_basic_null: null
            };
            const testObject: OmegaBaseObject = {
                objectSource: 'BasicTests',
                objectData: {
                    id: 1,
                    stringTest: 'abcd',
                    numberTest: 10,
                    dateTest: new Date('12/23/1977'),
                    nullTest: null
                }
            };
            const actualResult = testRepo.mapObjectToRecord(testObject);
            expect(actualResult).toEqual(expectedResult);
        });
        test('If a valid new external object is passed, the expected record is returned', () => {
            const expectedResult: OmegaDalRecord = {
                test_basic_string: 'abcd',
                test_basic_number: 10,
                test_basic_date: new Date('12/23/1977'),
                test_basic_null: null
            };
            const testObject: OmegaBaseObject = {
                objectSource: 'BasicTests',
                objectData: {
                    stringTest: 'abcd',
                    numberTest: 10,
                    dateTest: new Date('12/23/1977'),
                    nullTest: null
                }
            };
            const actualResult = testRepo.mapObjectToRecord(testObject);
            expect(actualResult).toEqual(expectedResult);
        });
        test('If a transformToField property exists on a field, the expected record is returned with transform applied', () => {
            const tempDal = createOmegaDalMock(testMapPath);
            const tempRepo = new OmegaRepository(tempDal);
            function transform(value: number) {
                return value * 4;
            }
            tempRepo.addFieldTransformToMap('BasicTests', 'numberTest', transform);
            const expectedResult: OmegaDalRecord = {
                test_basic_id: 1,
                test_basic_string: 'abcd',
                test_basic_number: 10
            };
            const testObject: OmegaBaseObject = {
                objectSource: 'BasicTests',
                objectData: {
                    id: 1,
                    stringTest: 'abcd',
                    numberTest: 2.5
                }
            };
            const actualResult = tempRepo.mapObjectToRecord(testObject);
            testRepo.addFieldTransformToMap('BasicTests', 'numberTest');
            expect(actualResult).toEqual(expectedResult);
        });
        test('If a valid new external object is passed, the expected record is returned', () => {
            const expectedResult: OmegaDalRecord = {
                test_basic_string: 'abcd',
                test_basic_number: 10,
                test_basic_date: new Date('12/23/1977'),
                test_basic_null: null
            };
            const testObject: OmegaBaseObject = {
                objectSource: 'BasicTests',
                objectData: {
                    stringTest: 'abcd',
                    numberTest: 10,
                    dateTest: new Date('12/23/1977'),
                    nullTest: null
                }
            };
            const actualResult = testRepo.mapObjectToRecord(testObject);
            expect(actualResult).toEqual(expectedResult);
        });

        test('If a valid partial new external object is passed, the expected record is returned', () => {
            const expectedResult: OmegaDalRecord = {
                test_basic_string: 'abcd',
                test_basic_number: 10,
                test_basic_date: new Date('12/23/1977')
            };
            const testObject: OmegaBaseObject = {
                objectSource: 'BasicTests',
                objectData: {
                    stringTest: 'abcd',
                    numberTest: 10,
                    dateTest: new Date('12/23/1977')
                }
            };
            const actualResult = testRepo.mapObjectToRecord(testObject);
            expect(actualResult).toEqual(expectedResult);
        });
        test('If an invalid partial new external object is passed, the exected exception is thrown', () => {
            const testObject: OmegaBaseObject = {
                objectSource: 'BasicTests',
                objectData: {
                    stringTest: 'abcd',
                    numberTest: 10
                }
            };
            let message = '';
            try {
                testRepo.mapObjectToRecord(testObject);
            } catch (error) {
                message = error.message;
            }
            expect(message).toEqual(
                'Omega Repository: ' + ErrorSource.OMEGA_NEW_OBJECT + ' ' + ErrorSuffix.MISSING_NO_NULL_FIELD
            );
        });
    });
});
