export enum ErrorSource {
    TABLE_MAP_FILE = 'Table map file',
    REQUESTED_TABLE_MAP = 'Requested table map',
    REQUESTED_TABLE_MAP_FIELD = 'Requested table map field',
    OMEGA_DAL_RECORD = 'Omega Dal Record',
    OMEGA_NEW_OBJECT = 'New Omega Object',
    VALIDATION_ERROR = '{0} ({1} field)',
    PARENT_ASSOCIATION_ERROR = '{0} table map',
    LATERAL_ASSOCIATION_ERROR = '{0} table map'
}

export enum ErrorSuffix {
    NOT_FOUND = 'was not found',
    NOT_FOUND_EXAMPLE = 'was not found |{0}|',
    NOT_INTERNAL_EXAMPLE = 'is not internal |{0}|',
    NO_CHILD_ASSOCIATION = 'has no child association to {0}',
    NO_TARGET_ASSOCIATION = 'has no lateral association to {0}',
    BAD_JSON_FORMAT = 'contains JSON format errors',
    BAD_OMEGA_FORMAT = 'contains Omega format errors',
    MISSING_NO_NULL_FIELD = 'is missing an allowNull: false field',
    MIN_LENGTH = 'minimum length ({0})',
    MAX_LENGTH = 'maximum length ({0})',
    MIN_VALUE = 'minimum value ({0})',
    MAX_VALUE = 'maximum value ({0})',
    NOT_A_NUMBER = 'not a number',
    NOT_A_DATE = 'not a date',
    NOT_A_BOOLEAN = 'not true/false',
    NOT_IN_LIST = 'not an allowed value',
    MISSING_CHARACTER = 'missing required character ({0})',
    LOCKED_FIELD = 'read-only field'
}

export function throwStandardError(location: string, source: ErrorSource, suffix: ErrorSuffix, replacement?: string): never {
    let formattedSuffix: string = suffix;
    if (replacement) {
        formattedSuffix = suffix.replace('{0}', replacement);
    }
    throw new Error(location + ': ' + source + ' ' + formattedSuffix);
}

export function throwFieldValidationError(fieldName: string, type: string, errors: string[]): never {
    let errorMessage = 'Validation Error - ' + ErrorSource.VALIDATION_ERROR.replace('{0}', fieldName).replace('{1}', type) + ': ';
    errorMessage += errors.join(' | ');
    throw new Error(errorMessage);
}
export function throwAssociationError(source: ErrorSource, sourceParam: any, suffix: ErrorSuffix, suffixParam: any): never {
    let errorMessage = 'Association Error = ' + source.replace('{0}', sourceParam) + ' ' + suffix.replace('{0}', suffixParam);
    throw new Error(errorMessage);
}
