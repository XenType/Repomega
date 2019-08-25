// import { IOmegaRepository } from '../repository';
// import { OmegaField } from '../mapper';
// export interface IOmegaObject {
//     objectSource: string;
//     objectData: OmegaObjectData;
//     save(): Promise<void>;
//     retrieveParentAssociation(target: string): Promise<IOmegaObject>;
//     retrieveChildAssociations(target: string): Promise<IOmegaObject[]>;
//     createLateralAssociation(target: string, targetId: string | number): Promise<void>;
//     retrieveLateralAssociations(target: string): Promise<IOmegaObject[]>;
//     deleteLateralAssociation(target: string, targetId: string | number): Promise<void>;
//     validatePassword(mapField: OmegaField, password: string): Promise<boolean>;
//     modifyInternalField(mapField: OmegaField, value: string): Promise<boolean>;
// }
export interface OmegaObjectData {
    [key: string]: string | number | Date;
}
