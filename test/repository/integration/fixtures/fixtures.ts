import { OmegaObject } from '../../../../src/object/omegaObject';
import { OmegaRepository } from '../../../../src/repository/omegaRepository';

export const createNewMarketObject = (name: string, currency: string, repo: OmegaRepository): OmegaObject => {
    const newMarket = new OmegaObject(repo);
    newMarket.objectSource = 'Market';
    newMarket.objectData.name = name;
    newMarket.objectData.currencyType = currency;
    return newMarket;
};
