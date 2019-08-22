import { IOmegaRepository } from '../repository';

export interface IOmegaObject {
    objectSource: string;
    objectData: OmegaObjectData;
    retrieveChildAssociations(target: string): Promise<IOmegaObject[]>;
    retrieveLateralAssociations(target: string): Promise<IOmegaObject[]>;
    createLateralAssociation(target: string, targetId: string | number): Promise<void>;
    deleteLateralAssociation(target: string, targetId: string | number): Promise<void>;
}
export interface OmegaObjectData {
    [key: string]: string | number | Date;
}
