export enum ErrorSource {
    TABLE_MAP_FILE = 'Table map file',
    REQUESTED_TABLE_MAP = 'Requested table map'
}

export enum ErrorSuffix {
    NOT_FOUND = 'was not found',
    BAD_JSON_FORMAT = 'contains JSON format errors',
    BAD_OMEGA_FORMAT = 'contains Omega format errors'
}

export function throwStandardError(location: string, source: ErrorSource, suffix: ErrorSuffix): never {
    throw new Error(location + ': ' + source + ' ' + suffix);
}
