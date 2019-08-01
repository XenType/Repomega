export interface IOmegaDal {
    // if !returnNewObject, function will return Identity of new object
    create(table: string, newRecord: OmegaDalRecord): Promise<string | number>;
    retrieve(table: string, criteria: OmegaCriteria): Promise<OmegaDalRecord[]>;
    // if !returnUpdatedObjects, function will return the number of objects updated
    update(table: string, updates: Partial<OmegaDalRecord>, criteria: OmegaCriteria): Promise<number>;
    // returns number of objects deleted
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
