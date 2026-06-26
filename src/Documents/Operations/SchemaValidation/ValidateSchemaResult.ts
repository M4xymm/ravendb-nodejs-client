export interface ValidateSchemaProgress {
    errorCount: number;
    validatedCount: number;
}

export interface ValidateSchemaResult extends ValidateSchemaProgress {
    errors: { [key: string]: string };
    lastEtag: number;
}

export interface StartValidateSchemaOperationResult {
    responsibleNode: string;
    operationId: number;
}

export interface StartSchemaValidationParameters {
    schemaDefinition: string;
    collection: string;
    maxErrorMessages?: number;
    maxDocumentsToValidate?: number;
    startEtag?: number;
}
