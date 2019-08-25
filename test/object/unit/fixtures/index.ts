import { IOmegaRepository } from '../../../../src/repository';
import { OmegaObject } from '../../../../src/object/omegaObject';
import { OmegaCriteria } from '../../../../src/dal';

export function createAndCriteria(field: string, value: number | string | Date): OmegaCriteria {
    return { _or: [{ field, value }] };
}

export function createTestObject(
    repo: IOmegaRepository,
    source: string,
    secondValue: any,
    identityValue?: number
): OmegaObject {
    const testObject = new OmegaObject(repo);
    testObject.objectSource = source;
    testObject.objectData.name = 'Test ' + source;
    switch (source) {
        case 'Market':
            testObject.objectData.currencyType = secondValue as string;
            break;
        case 'Company':
            testObject.objectData.marketId = secondValue as number;
            break;
        case 'User':
            testObject.objectData.companyId = secondValue as number;
            break;
    }
    if (identityValue) {
        testObject.objectData.id = identityValue;
    }
    return testObject;
}
