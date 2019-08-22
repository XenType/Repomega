import { IOmegaMapper } from '../mapper';

export interface IOmegaDal {
    mapper: IOmegaMapper;
    create(table: string, newRecord: OmegaDalRecord): Promise<string | number>;
    read(table: string, criteria: OmegaCriteria): Promise<OmegaDalRecord[]>;
    update(table: string, updates: Partial<OmegaDalRecord>, criteria: OmegaCriteria): Promise<number>;
    delete(table: string, criteria: OmegaCriteria): Promise<number>;
    closeAll(): Promise<void>;
}

export interface OmegaDalRecord {
    [key: string]: string | number | Date;
}
export interface OmegaCriteria {
    _and?: Array<OmegaCriterion | OmegaCriteria>;
    _or?: Array<OmegaCriterion | OmegaCriteria>;
}
export interface OmegaCriterion {
    field: string;
    value: any;
}

export interface OmegaDalConfig {
    host: string;
    database: string;
    user: string;
    password: string;
    connectionLimit: number;
}
