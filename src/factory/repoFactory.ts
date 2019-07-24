export interface IRepoFactory {}

export interface OmegaRepository {
    create(newObject: OmegaObject, returnIdentityOnly?: boolean): Promise<OmegaObject | string | number>;
    retrieve(identity: string | number): Promise<OmegaObject>;
    retrieveOnly(criteria: OmegaCriteria): Promise<OmegaObject[]>;
    retrieveAny(criteria: OmegaCriteria): Promise<OmegaObject[]>;
    update(
        updates: Partial<OmegaObject>,
        identity: string | number,
        returnIdentityOnly?: boolean
    ): Promise<OmegaObject | string | number>;
    updateOnly(
        updates: Partial<OmegaObject>,
        criteria: OmegaCriteria,
        returnIdentityOnly?: boolean
    ): Promise<OmegaObject | string | number>;
    updateAny(
        updates: Partial<OmegaObject>,
        criteria: OmegaCriteria,
        returnIdentityOnly?: boolean
    ): Promise<OmegaObject | string | number>;
    delete(identity: string | number): Promise<OmegaObject>;
    deleteOnly(criteria: OmegaCriteria): Promise<OmegaObject[]>;
    deleteAny(criteria: OmegaCriteria): Promise<OmegaObject[]>;
}

export interface OmegaObject {
    [key: string]: any;
}
export interface OmegaCriteria {
    [key: string]: any;
}
