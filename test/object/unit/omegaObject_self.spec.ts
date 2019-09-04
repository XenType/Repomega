import { createOmegaRepoMock, createOmegaRepoSpies, assertRepoUsageCounts } from './fixtures/omegaRepoMocks';
import { OmegaObject } from '../../../src/object/omegaObject';
import { cloneDeep } from 'lodash';
import { createTestObject } from '../../fixtures';
import { OmegaValue } from '../../../src/common/types';

describe('When using functions of an IOmegaObject', () => {
    describe('And calling save', () => {
        test('With a valid object, it interacts with the internal repo as expected', async () => {
            const mockRepo = createOmegaRepoMock();
            const spyContainer = createOmegaRepoSpies(mockRepo);
            const testObject = createTestObject(mockRepo, 'Market', 'USD');
            const expectedParam1 = [cloneDeep(testObject)];
            await testObject.save();
            expectedParam1[0].tableMap = testObject.tableMap;
            assertRepoUsageCounts(spyContainer, 1);
            expect(spyContainer.spyPersist).toHaveBeenCalledWith(expectedParam1, true);
        });
        test('When the object is new, an identity field is added to the object', async () => {
            const mockPersist = async (a: OmegaObject[], b?: boolean): Promise<OmegaObject[]> => {
                a[0].objectData.id = 1;
                return a;
            };
            const mockRepo = createOmegaRepoMock(mockPersist);
            const testObject = createTestObject(mockRepo, 'Market', 'USD');
            await testObject.save();
            expect(testObject.objectData.id).not.toBeUndefined();
            expect(testObject.objectData.id).not.toBeNull();
            expect(testObject.objectData.id).toEqual(1);
        });
    });
    describe('And calling verifyInternalField', () => {
        describe('If the field does not exist', () => {
            test('It interacts with the Repository as expected', async () => {
                const mockRepo = createOmegaRepoMock();
                const spyContainer = createOmegaRepoSpies(mockRepo);
                const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                try {
                    await testObject.verifyInternalField('notAfield', 'testing');
                } catch {}
                assertRepoUsageCounts(spyContainer);
            });
            test('It throws the expected error', async () => {
                let message = '';
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                try {
                    await testObject.verifyInternalField('notAfield', 'testing');
                } catch (error) {
                    message = error.message;
                }
                expect(message).toEqual('OmegaObject: Requested table map field was not found |notAfield|');
            });
        });
        describe('If the field exists and is "external"', () => {
            test('It interacts with the Repository as expected', async () => {
                const mockRepo = createOmegaRepoMock();
                const spyContainer = createOmegaRepoSpies(mockRepo);
                const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                try {
                    await testObject.verifyInternalField('stringTest', 'testing');
                } catch {}
                assertRepoUsageCounts(spyContainer);
            });
            test('It throws the expected error', async () => {
                let message = '';
                const mockRepo = createOmegaRepoMock();
                const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                try {
                    await testObject.verifyInternalField('stringTest', 'testing');
                } catch (error) {
                    message = error.message;
                }
                expect(message).toEqual('OmegaObject: Requested table map field is not internal |stringTest|');
            });
        });
        describe('If the field exists and is "internal"', () => {
            test('It interacts with the Repository as expected', async () => {
                const mockRepoRetrieveOneValue = async (
                    a: string,
                    b: string,
                    c: string | number
                ): Promise<OmegaValue> => {
                    return 'testing';
                };
                const mockRepo = createOmegaRepoMock();
                mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                const spyContainer = createOmegaRepoSpies(mockRepo);
                const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                await testObject.verifyInternalField('internalTest', 'testing');
                assertRepoUsageCounts(spyContainer, 0, 0, 0, 0, 0, 0, 1);
                expect(spyContainer.spyRetrieveOneValue).toBeCalledWith('BasicTests', 'internalTest', 1);
            });
            test('It returns true if the values match', async () => {
                const mockRepoRetrieveOneValue = async (
                    a: string,
                    b: string,
                    c: string | number
                ): Promise<OmegaValue> => {
                    return 'testing';
                };
                const mockRepo = createOmegaRepoMock();
                mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                const result = await testObject.verifyInternalField('internalTest', 'testing');
                expect(result).toEqual(true);
            });
            test('It returns false if the values do not match', async () => {
                const mockRepoRetrieveOneValue = async (
                    a: string,
                    b: string,
                    c: string | number
                ): Promise<OmegaValue> => {
                    return 'testing';
                };
                const mockRepo = createOmegaRepoMock();
                mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                const result = await testObject.verifyInternalField('internalTest', 'nottesting');
                expect(result).toEqual(false);
            });
        });
        describe('If the field exists and is locked', () => {
            test('It interacts with the Repository as expected', async () => {
                const mockRepoRetrieveOneValue = async (
                    a: string,
                    b: string,
                    c: string | number
                ): Promise<OmegaValue> => {
                    return 'testing';
                };
                const mockRepo = createOmegaRepoMock();
                mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                const spyContainer = createOmegaRepoSpies(mockRepo);
                const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                await testObject.verifyInternalField('lockedTest', 'testing');
                assertRepoUsageCounts(spyContainer, 0, 0, 0, 0, 0, 0, 1);
                expect(spyContainer.spyRetrieveOneValue).toBeCalledWith('BasicTests', 'lockedTest', 1);
            });
            test('It returns true if the values match', async () => {
                const mockRepoRetrieveOneValue = async (
                    a: string,
                    b: string,
                    c: string | number
                ): Promise<OmegaValue> => {
                    return 'testing';
                };
                const mockRepo = createOmegaRepoMock();
                mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                const result = await testObject.verifyInternalField('lockedTest', 'testing');
                expect(result).toEqual(true);
            });
            test('It returns false if the values do not match', async () => {
                const mockRepoRetrieveOneValue = async (
                    a: string,
                    b: string,
                    c: string | number
                ): Promise<OmegaValue> => {
                    return 'testing';
                };
                const mockRepo = createOmegaRepoMock();
                mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                const result = await testObject.verifyInternalField('lockedTest', 'nottesting');
                expect(result).toEqual(false);
            });
        });
        describe('With non-password types', () => {
            describe('If the field exists and has only a "toProperty" transformation', () => {
                test('It interacts with the Repository as expected', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return 'testing';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transform = async (value: OmegaValue): Promise<OmegaValue> => {
                        return `--${value}--`;
                    };
                    mockRepo.addPropertyTransformToMap('BasicTests', 'internalTest', transform);
                    const spyContainer = createOmegaRepoSpies(mockRepo);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    await testObject.verifyInternalField('internalTest', '--testing--');
                    assertRepoUsageCounts(spyContainer, 0, 0, 0, 0, 0, 0, 1);
                    expect(spyContainer.spyRetrieveOneValue).toBeCalledWith('BasicTests', 'internalTest', 1);
                });
                test('It returns true if the values match', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return 'testing';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transform = async (value: OmegaValue): Promise<OmegaValue> => {
                        return `--${value}--`;
                    };
                    mockRepo.addPropertyTransformToMap('BasicTests', 'internalTest', transform);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    const result = await testObject.verifyInternalField('internalTest', '--testing--');
                    expect(result).toEqual(true);
                });
                test('It returns false if the values do not match', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return 'testing';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transform = async (value: OmegaValue): Promise<OmegaValue> => {
                        return `--${value}--`;
                    };
                    mockRepo.addPropertyTransformToMap('BasicTests', 'internalTest', transform);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    const result = await testObject.verifyInternalField('internalTest', 'testing');
                    expect(result).toEqual(false);
                });
            });
            describe('If the field exists and has a "toField" and "toProperty" transformation', () => {
                test('It interacts with the Repository as expected', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return 'testing';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transformToProperty = async (value: OmegaValue): Promise<OmegaValue> => {
                        return `--${value}--`;
                    };
                    const transformToField = async (value: OmegaValue): Promise<OmegaValue> => {
                        return value
                            .toString()
                            .replace('--', '')
                            .replace('--', '');
                    };
                    mockRepo.addPropertyTransformToMap('BasicTests', 'internalTest', transformToProperty);
                    mockRepo.addFieldTransformToMap('BasicTests', 'internalTest', transformToField);
                    const spyContainer = createOmegaRepoSpies(mockRepo);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    await testObject.verifyInternalField('internalTest', 'testing');
                    assertRepoUsageCounts(spyContainer, 0, 0, 0, 0, 0, 0, 1);
                    expect(spyContainer.spyRetrieveOneValue).toBeCalledWith('BasicTests', 'internalTest', 1);
                });
                test('It returns true if the values match', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return 'testing';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transformToProperty = async (value: OmegaValue): Promise<OmegaValue> => {
                        return `--${value}--`;
                    };
                    const transformToField = async (value: OmegaValue): Promise<OmegaValue> => {
                        return value
                            .toString()
                            .replace('--', '')
                            .replace('--', '');
                    };
                    mockRepo.addPropertyTransformToMap('BasicTests', 'internalTest', transformToProperty);
                    mockRepo.addFieldTransformToMap('BasicTests', 'internalTest', transformToField);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    const result = await testObject.verifyInternalField('internalTest', '--testing--');
                    expect(result).toEqual(true);
                });
                test('It returns false if the values do not match', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return 'testing';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transformToProperty = async (value: OmegaValue): Promise<OmegaValue> => {
                        return `--${value}--`;
                    };
                    const transformToField = async (value: OmegaValue): Promise<OmegaValue> => {
                        return value
                            .toString()
                            .replace('--', '')
                            .replace('--', '');
                    };
                    mockRepo.addPropertyTransformToMap('BasicTests', 'internalTest', transformToProperty);
                    mockRepo.addFieldTransformToMap('BasicTests', 'internalTest', transformToField);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    const result = await testObject.verifyInternalField('internalTest', 'testing');
                    expect(result).toEqual(false);
                });
            });
            describe('If the field exists and has only a "toField" transformation', () => {
                test('It interacts with the Repository as expected', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return '--testing--';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transformToField = async (value: OmegaValue): Promise<OmegaValue> => {
                        return `--${value}--`;
                    };
                    mockRepo.addFieldTransformToMap('BasicTests', 'internalTest', transformToField);
                    const spyContainer = createOmegaRepoSpies(mockRepo);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    await testObject.verifyInternalField('internalTest', 'testing');
                    assertRepoUsageCounts(spyContainer, 0, 0, 0, 0, 0, 0, 1);
                    expect(spyContainer.spyRetrieveOneValue).toBeCalledWith('BasicTests', 'internalTest', 1);
                });
                test('It returns true if the values match', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return '--testing--';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transformToField = async (value: OmegaValue): Promise<OmegaValue> => {
                        return `--${value}--`;
                    };
                    mockRepo.addFieldTransformToMap('BasicTests', 'internalTest', transformToField);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    const result = await testObject.verifyInternalField('internalTest', 'testing');
                    expect(result).toEqual(true);
                });
                test('It returns false if the values do not match', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return '--testing--';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transformToField = async (value: OmegaValue): Promise<OmegaValue> => {
                        return `--${value}--`;
                    };
                    mockRepo.addFieldTransformToMap('BasicTests', 'internalTest', transformToField);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    const result = await testObject.verifyInternalField('internalTest', 'wrong');
                    expect(result).toEqual(false);
                });
            });
        });
        describe('With password types', () => {
            describe('If the field exists and has only a "toProperty" transformation', () => {
                test('It interacts with the Repository as expected', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return 'testing';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transform = async (value: OmegaValue): Promise<OmegaValue> => {
                        return `--${value}--`;
                    };
                    mockRepo.addPropertyTransformToMap('BasicTests', 'passwordTest', transform);
                    const spyContainer = createOmegaRepoSpies(mockRepo);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    await testObject.verifyInternalField('passwordTest', 'gnitset');
                    assertRepoUsageCounts(spyContainer, 0, 0, 0, 0, 0, 0, 1);
                    expect(spyContainer.spyRetrieveOneValue).toBeCalledWith('BasicTests', 'passwordTest', 1);
                });
                test('It returns true if the values match', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return 'testing';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transform = async (value: OmegaValue, savedValue: OmegaValue): Promise<OmegaValue> => {
                        let result = '';
                        for (let i = 0; i < savedValue.toString().length; i++) {
                            result = savedValue[i] + result;
                        }
                        return result === value;
                    };
                    mockRepo.addPropertyTransformToMap('BasicTests', 'passwordTest', transform);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    const result = await testObject.verifyInternalField('passwordTest', 'gnitset');
                    expect(result).toEqual(true);
                });
                test('It returns false if the values do not match', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return 'testing';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transform = async (value: OmegaValue, savedValue: OmegaValue): Promise<OmegaValue> => {
                        let result = '';
                        for (let i = 0; i < savedValue.toString().length; i++) {
                            result = savedValue[i] + result;
                        }
                        return result === value;
                    };
                    mockRepo.addPropertyTransformToMap('BasicTests', 'passwordTest', transform);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    const result = await testObject.verifyInternalField('passwordTest', 'notit');
                    expect(result).toEqual(false);
                });
            });
            describe('If the field exists and has a "toField" and "toProperty" transformation', () => {
                test('It interacts with the Repository as expected', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return 'testing';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transformToProperty = async (
                        value: OmegaValue,
                        savedValue: OmegaValue
                    ): Promise<OmegaValue> => {
                        let result = '';
                        for (let i = 0; i < savedValue.toString().length; i++) {
                            result = savedValue[i] + result;
                        }
                        return result === value;
                    };
                    const transformToField = async (value: OmegaValue): Promise<OmegaValue> => {
                        return value
                            .toString()
                            .replace('--', '')
                            .replace('--', '');
                    };
                    mockRepo.addPropertyTransformToMap('BasicTests', 'passwordTest', transformToProperty);
                    mockRepo.addFieldTransformToMap('BasicTests', 'passwordTest', transformToField);
                    const spyContainer = createOmegaRepoSpies(mockRepo);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    await testObject.verifyInternalField('passwordTest', 'gnitset');
                    assertRepoUsageCounts(spyContainer, 0, 0, 0, 0, 0, 0, 1);
                    expect(spyContainer.spyRetrieveOneValue).toBeCalledWith('BasicTests', 'passwordTest', 1);
                });
                test('It returns true if the values match', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return 'testing';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transformToProperty = async (
                        value: OmegaValue,
                        savedValue: OmegaValue
                    ): Promise<OmegaValue> => {
                        let result = '';
                        for (let i = 0; i < savedValue.toString().length; i++) {
                            result = savedValue[i] + result;
                        }
                        return result === value;
                    };
                    const transformToField = async (value: OmegaValue): Promise<OmegaValue> => {
                        return value
                            .toString()
                            .replace('--', '')
                            .replace('--', '');
                    };
                    mockRepo.addPropertyTransformToMap('BasicTests', 'passwordTest', transformToProperty);
                    mockRepo.addFieldTransformToMap('BasicTests', 'passwordTest', transformToField);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    const result = await testObject.verifyInternalField('passwordTest', 'gnitset');
                    expect(result).toEqual(true);
                });
                test('It returns false if the values do not match', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return 'testing';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transformToProperty = async (
                        value: OmegaValue,
                        savedValue: OmegaValue
                    ): Promise<OmegaValue> => {
                        let result = '';
                        for (let i = 0; i < savedValue.toString().length; i++) {
                            result = savedValue[i] + result;
                        }
                        return result === value;
                    };
                    const transformToField = async (value: OmegaValue): Promise<OmegaValue> => {
                        return value
                            .toString()
                            .replace('--', '')
                            .replace('--', '');
                    };
                    mockRepo.addPropertyTransformToMap('BasicTests', 'passwordTest', transformToProperty);
                    mockRepo.addFieldTransformToMap('BasicTests', 'passwordTest', transformToField);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    const result = await testObject.verifyInternalField('passwordTest', 'testing');
                    expect(result).toEqual(false);
                });
            });
            describe('If the field exists and has only a "toField" transformation', () => {
                test('It interacts with the Repository as expected', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return '--testing--';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transformToField = async (value: OmegaValue): Promise<OmegaValue> => {
                        return `--${value}--`;
                    };
                    mockRepo.addFieldTransformToMap('BasicTests', 'passwordTest', transformToField);
                    const spyContainer = createOmegaRepoSpies(mockRepo);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    await testObject.verifyInternalField('passwordTest', 'testing');
                    assertRepoUsageCounts(spyContainer, 0, 0, 0, 0, 0, 0, 1);
                    expect(spyContainer.spyRetrieveOneValue).toBeCalledWith('BasicTests', 'passwordTest', 1);
                });
                test('It returns true if the values match', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return '--testing--';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transformToField = async (value: OmegaValue): Promise<OmegaValue> => {
                        return `--${value}--`;
                    };
                    mockRepo.addFieldTransformToMap('BasicTests', 'passwordTest', transformToField);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    const result = await testObject.verifyInternalField('passwordTest', 'testing');
                    expect(result).toEqual(true);
                });
                test('It returns false if the values do not match', async () => {
                    const mockRepoRetrieveOneValue = async (
                        a: string,
                        b: string,
                        c: string | number
                    ): Promise<OmegaValue> => {
                        return '--testing--';
                    };
                    const mockRepo = createOmegaRepoMock();
                    mockRepo.retrieveOneValue = mockRepoRetrieveOneValue;
                    const transformToField = async (value: OmegaValue): Promise<OmegaValue> => {
                        return `--${value}--`;
                    };
                    mockRepo.addFieldTransformToMap('BasicTests', 'passwordTest', transformToField);
                    const testObject = createTestObject(mockRepo, 'BasicTests', 10, 1);
                    const result = await testObject.verifyInternalField('passwordTest', 'wrong');
                    expect(result).toEqual(false);
                });
            });
        });
    });
    describe('And calling saveInternalField', () => {
        describe('If the field does not exist', () => {
            xtest('It interacts with the Repository as expected', async () => {
                // test
            });
            xtest('It throws the expected error', async () => {
                // test
            });
        });
        describe('If the field exists and is "normal"', () => {
            xtest('It interacts with the Repository as expected', async () => {
                // test
            });
        });
        describe('If the field exists and has a a form of validation', () => {
            xtest('It interacts with the Repository as expected', async () => {
                // test
            });
            xtest('It throws the expected error when validation does not pass', async () => {
                // test
            });
            xtest('It completes when validation passes and can be verified as persisted', async () => {
                // test
            });
        });
        describe('If the field exists and has a "toField" transformation', () => {
            xtest('It interacts with the Repository as expected', async () => {
                // test
            });
            xtest('It completes when validation passes and can be verified as persisted', async () => {
                // test
            });
        });
        describe('If the field exists and is locked', () => {
            xtest('It interacts with the Repository as expected', async () => {
                // test
            });
            xtest('It throws the expected error', async () => {
                // test
            });
        });
    });
});
