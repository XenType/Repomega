import { IOmegaMapper } from '../mapper';
import { OmegaValue } from '../common/types';

export interface IOmegaDal {
    mapper: IOmegaMapper;
    create(table: string, newRecord: OmegaDalRecord): Promise<string | number>;
    read(table: string, criteria: OmegaCriteria, fieldList?: string[]): Promise<OmegaDalRecord[]>;
    update(table: string, updates: Partial<OmegaDalRecord>, criteria: OmegaCriteria): Promise<number>;
    delete(table: string, criteria: OmegaCriteria): Promise<number>;
    closeAll(): Promise<void>;
}

export interface OmegaDalRecord {
    [key: string]: OmegaValue;
}
export interface OmegaCriteria {
    _and?: Array<OmegaCriterion | OmegaCriteria | OmegaCriterionLinkTable>;
    _or?: Array<OmegaCriterion | OmegaCriteria | OmegaCriterionLinkTable>;
}
export interface OmegaCriterion {
    field: string;
    value: any;
}
export interface OmegaCriterionLinkTable {
    sourceField: string;
    targetTable: string;
    targetField: string;
    criteria: OmegaCriteria;
}

export interface OmegaDalConfig {
    host: string;
    database: string;
    user: string;
    password: string;
    connectionLimit: number;
}
