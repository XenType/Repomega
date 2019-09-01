import { createOmegaDalMock } from './fixtures/omegaDalMocks';
import { OmegaRepository } from '../../../src/repository/omegaRepository';
import { OmegaField, OmegaFieldValidation } from '../../../src/mapper';
import { cloneDeep } from 'lodash';
import { ValidationField } from '../../../src/repository';
import { OmegaValue } from '../../../src/common/types';

const testMapPath = 'test/dal/integration/fixtures/integration-map.json';
const testDal = createOmegaDalMock(testMapPath);
const testRepo = new OmegaRepository(testDal);
const baseMapField: OmegaField = {
    name: 'field',
    allowNull: false,
    external: true,
    locked: false,
    validation: {
        type: ''
    }
};
const expectedFieldName = 'testField';

describe('When calling validateField', () => {
    describe('When checking string-related constraints', () => {
        test('If the string has no validation then no exception is thrown', () => {
            const message = runValidationTest('whatever', { type: 'string' });
            expect(message).toEqual('');
        });
        test('If the string passes all validation then no exception is thrown', () => {
            const validation = {
                type: 'string',
                minLength: 9,
                maxLength: 11
            };
            const message = runValidationTest('just right', validation);
            expect(message).toEqual('');
        });
        test('If the string is too short the expected exception is thrown', () => {
            const validation = {
                type: 'string',
                minLength: 5
            };
            const message = runValidationTest('tiny', validation);
            expect(message).toEqual('Validation Error - ' + expectedFieldName + ' (string field): minimum length (5)');
        });
        test('If the string is too long the expected exception is thrown', () => {
            const validation = {
                type: 'string',
                maxLength: 12
            };
            const message = runValidationTest('It is too big', validation);
            expect(message).toEqual('Validation Error - ' + expectedFieldName + ' (string field): maximum length (12)');
        });
    });
    describe('When checking number-related constraints', () => {
        test('If it is a number with no validation then no exception is thrown', () => {
            const message = runValidationTest(1, { type: 'number' });
            expect(message).toEqual('');
        });
        test('If it is a number and it passes validation exception is thrown', () => {
            const validation: OmegaFieldValidation = {
                type: 'number',
                minValue: 2,
                maxValue: 4
            };
            const message = runValidationTest(3, validation);
            expect(message).toEqual('');
        });
        test('If the number is too low the expected exception is thrown', () => {
            const validation: OmegaFieldValidation = {
                type: 'number',
                minValue: 2
            };
            const message = runValidationTest(1, validation);
            expect(message).toEqual('Validation Error - ' + expectedFieldName + ' (number field): minimum value (2)');
        });
        test('If the number is too high the expected exception is thrown', () => {
            const validation: OmegaFieldValidation = {
                type: 'number',
                maxValue: 12
            };
            const message = runValidationTest(13, validation);
            expect(message).toEqual('Validation Error - ' + expectedFieldName + ' (number field): maximum value (12)');
        });
        test('If the number is not a number the expected exception is thrown', () => {
            const validation: OmegaFieldValidation = {
                type: 'number',
                minValue: 10
            };
            const message = runValidationTest('word', validation);
            expect(message).toEqual('Validation Error - ' + expectedFieldName + ' (number field): not a number');
        });
    });
    describe('When checking Date-related constraints', () => {
        test('If the Date is valid then no exception is thrown', () => {
            const validation: OmegaFieldValidation = {
                type: 'datetime'
            };
            const message = runValidationTest(new Date(), validation);
            expect(message).toEqual('');
        });
        test('If the Date is not a date the expected exception is thrown', () => {
            const validation: OmegaFieldValidation = {
                type: 'datetime'
            };
            const message = runValidationTest('abcd', validation);
            expect(message).toEqual('Validation Error - ' + expectedFieldName + ' (datetime field): not a date');
        });
    });
    describe('When checking enum-related constraints', () => {
        test('If the enum is valid then no exception is thrown', () => {
            const validation: OmegaFieldValidation = {
                type: 'enum',
                enumList: ['demo', 'personal', 'enterprise', 'admin']
            };
            const message = runValidationTest('personal', validation);
            expect(message).toEqual('');
        });
        test('If the enum is invalid the expected exception is thrown', () => {
            const validation: OmegaFieldValidation = {
                type: 'enum',
                enumList: ['demo', 'personal', 'enterprise', 'admin']
            };
            const message = runValidationTest('not there', validation);
            expect(message).toEqual('Validation Error - ' + expectedFieldName + ' (enum field): not an allowed value');
        });
    });
    describe('When checking password-related constraints', () => {
        test('If the password has no requirements then no exception is thrown', () => {
            const validation: OmegaFieldValidation = {
                type: 'password'
            };
            const message = runValidationTest('simple', validation);
            expect(message).toEqual('');
        });
        test('If the password passes all requirements then no exception is thrown', () => {
            const validation: OmegaFieldValidation = {
                type: 'password',
                minLength: 6,
                maxLength: 20,
                requireCharacters: {
                    lowerCase: true,
                    upperCase: true,
                    number: true,
                    symbol: true
                }
            };
            const message = runValidationTest('g0T!t@1l9', validation);
            expect(message).toEqual('');
        });
        test('If the password is too short the expected exception is thrown', () => {
            const validation = {
                type: 'password',
                minLength: 5
            };
            const message = runValidationTest('tiny', validation);
            expect(message).toEqual(
                'Validation Error - ' + expectedFieldName + ' (password field): minimum length (5)'
            );
        });
        test('If the password is too long the expected exception is thrown', () => {
            const validation = {
                type: 'password',
                maxLength: 15
            };
            const message = runValidationTest('agiantpasswordliveshere', validation);
            expect(message).toEqual(
                'Validation Error - ' + expectedFieldName + ' (password field): maximum length (15)'
            );
        });
        test('If the password is lacking a lower case character the expected exception is thrown', () => {
            const validation = {
                type: 'password',
                requireCharacters: {
                    lowerCase: true
                }
            };
            const message = runValidationTest('ALLUPPER', validation);
            expect(message).toEqual(
                'Validation Error - ' + expectedFieldName + ' (password field): missing required character (lowercase)'
            );
        });
        test('If the password is lacking an upper case character the expected exception is thrown', () => {
            const validation = {
                type: 'password',
                requireCharacters: {
                    upperCase: true
                }
            };
            const message = runValidationTest('alllower', validation);
            expect(message).toEqual(
                'Validation Error - ' + expectedFieldName + ' (password field): missing required character (uppercase)'
            );
        });
        test('If the password is lacking a number the expected exception is thrown', () => {
            const validation = {
                type: 'password',
                requireCharacters: {
                    number: true
                }
            };
            const message = runValidationTest('nonumber', validation);
            expect(message).toEqual(
                'Validation Error - ' + expectedFieldName + ' (password field): missing required character (number)'
            );
        });
        test('If the password is lacking a symbol the expected exception is thrown', () => {
            const validation = {
                type: 'password',
                requireCharacters: {
                    symbol: true
                }
            };
            const message = runValidationTest('nosymbol', validation);
            expect(message).toEqual(
                'Validation Error - ' + expectedFieldName + ' (password field): missing required character (symbol)'
            );
        });
        test('If the password is lacking a combination of required characters the expected exception is thrown', () => {
            const validation = {
                type: 'password',
                requireCharacters: {
                    lowerCase: true,
                    upperCase: true,
                    symbol: true
                }
            };
            const message = runValidationTest('alllower', validation);
            expect(message).toEqual(
                'Validation Error - ' +
                    expectedFieldName +
                    ' (password field): missing required character (uppercase) | missing required character (symbol)'
            );
        });
    });
});

function runValidationTest(testValue: OmegaValue | undefined, validation: OmegaFieldValidation): string {
    let message = '';
    const testFieldMap = cloneDeep(baseMapField);
    testFieldMap.validation = validation;
    const validationField: ValidationField = {
        fieldName: expectedFieldName,
        fieldValue: testValue
    };
    try {
        testRepo.validateField(testFieldMap, validationField, false);
    } catch (error) {
        message = error.message;
    }
    return message;
}
