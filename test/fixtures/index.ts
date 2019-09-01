import { IOmegaRepository } from '../../src/repository';
import { OmegaObject } from '../../src/object/omegaObject';
import { OmegaCriteria, OmegaCriterion } from '../../src/dal';
import { OmegaValue } from '../../src/common/types';
type stringOrArray = string | string[];
type valueOrArray = OmegaValue | Array<OmegaValue>;

export function createAndCriteria(field: stringOrArray, value: valueOrArray): OmegaCriteria {
    return createCriteria('_and', field, value);
}
export function createOrCriteria(field: stringOrArray, value: valueOrArray): OmegaCriteria {
    return createCriteria('_or', field, value);
}
export function createCriteria(type: string, field: stringOrArray, value: valueOrArray): OmegaCriteria {
    const criteria: OmegaCriteria = {};
    criteria[type] = [];
    if (Array.isArray(field) && Array.isArray(value)) {
        if (field.length !== value.length) {
            throw new Error(`invalid parameter lengths for createCriteria(len=${field.length},len=${value.length})`);
        }
        field.forEach((item: string, index: number) => {
            criteria[type].push(createCriterion(item, value[index]));
        });
    } else {
        if (Array.isArray(field) || Array.isArray(value)) {
            throw new Error(`invalid parameters for createAndCriteria(${field}, ${value}) fixture function`);
        }
        criteria[type] = [createCriterion(field, value)];
    }
    return criteria;
}
export function createCriterion(field: string, value: OmegaValue): OmegaCriterion {
    return { field, value };
}

export function createTestObject(
    repo: IOmegaRepository,
    source: string,
    secondValue: any,
    identityValue?: number
): OmegaObject {
    const testObject = new OmegaObject(repo);
    testObject.objectSource = source;
    testObject.objectData.name = `Test ${source}`;
    if (identityValue) {
        testObject.objectData.name += ` ${identityValue}`;
    }
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

export function createLinkObject(
    repo: IOmegaRepository,
    linkTable: string,
    sourceId: string | number,
    targetId: string | number
): OmegaObject {
    const linkObject = new OmegaObject(repo);
    linkObject.objectSource = linkTable;
    switch (linkTable) {
        case 'OptionGroup':
            linkObject.objectData.userId = sourceId;
            linkObject.objectData.optionGroupId = targetId;
    }
    return linkObject;
}
