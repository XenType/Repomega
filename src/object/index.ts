import { OmegaValue } from '../../src/common/types';

export interface OmegaBaseObject {
    objectSource: string;
    objectData: OmegaObjectData;
}

export interface OmegaObjectData {
    [key: string]: OmegaValue;
}
