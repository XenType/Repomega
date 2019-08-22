export enum ErrorSource {
    TABLE_MAP_FILE = 'Table map file',
    REQUESTED_TABLE_MAP = 'Requested table map',
    OMEGA_DAL_RECORD = 'Omega Dal Record',
    OMEGA_NEW_OBJECT = 'New Omega Object',
    VALIDATION_ERROR = '{0} ({1} field)'
}

export enum ErrorSuffix {
    NOT_FOUND = 'was not found',
    BAD_JSON_FORMAT = 'contains JSON format errors',
    BAD_OMEGA_FORMAT = 'contains Omega format errors',
    MISSING_NO_NULL_FIELD = 'is missing an allowNull: false field',
    MIN_LENGTH = 'minimum length ({0})',
    MAX_LENGTH = 'maximum length ({0})',
    MIN_VALUE = 'minimum value ({0})',
    MAX_VALUE = 'maximum value ({0})',
    NOT_A_NUMBER = 'not a number',
    NOT_A_DATE = 'not a date',
    NOT_IN_LIST = 'not an allowed value',
    MISSING_CHARACTER = 'missing required character ({0})'
}

export function throwStandardError(location: string, source: ErrorSource, suffix: ErrorSuffix): never {
    throw new Error(location + ': ' + source + ' ' + suffix);
}

export function throwFieldValidationError(fieldName: string, type: string, errors: string[]): never {
    let errorMessage =
        'Validation Error - ' + ErrorSource.VALIDATION_ERROR.replace('{0}', fieldName).replace('{1}', type) + ': ';
    errorMessage += errors.join(' | ');
    throw new Error(errorMessage);
}
