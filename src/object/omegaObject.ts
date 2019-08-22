import { IOmegaObject, OmegaObjectData } from '.';
import { IOmegaRepository } from '../repository';
import { OmegaTableMap } from '../mapper';

let sourceRepo: IOmegaRepository;
let tableMap: OmegaTableMap;

export class OmegaObject implements IOmegaObject {
    public objectSource: string;
    public objectData: OmegaObjectData;
    constructor(_sourceRepository: IOmegaRepository) {
        sourceRepo = _sourceRepository;
        this.objectData = {};
    }
    public async retrieveChildAssociations(target: string): Promise<IOmegaObject[]> {
        this.initTableMap();
        return null;
    }
    public async retrieveLateralAssociations(target: string): Promise<IOmegaObject[]> {
        this.initTableMap();
        return null;
    }
    public async createLateralAssociation(target: string, objectId: string | number): Promise<void> {
        this.initTableMap();
        return null;
    }
    public async deleteLateralAssociation(target: string, objectId: string | number): Promise<void> {
        this.initTableMap();
        return null;
    }

    private initTableMap(): void {
        if (!tableMap) {
            tableMap = sourceRepo.getTableMap(this.objectSource);
        }
    }
}
