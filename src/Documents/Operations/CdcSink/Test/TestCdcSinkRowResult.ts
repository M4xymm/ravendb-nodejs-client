export interface TestCdcSinkRowResult {
    documentId: string;
    document: string;
    sourceRow: string;
    wouldDelete: boolean;
    ignoreDeletes: boolean;
    debugOutput: string[];
    error: string;
}
