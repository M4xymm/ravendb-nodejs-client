export interface RevertResult {
    scannedRevisions: number;
    scannedDocuments: number;
    revertedDocuments: number;
    warnings: { [key: string]: string };
    lastProcessedEtags: { [key: string]: number };
    etagBarriersUsed: { [key: string]: number };
    nodeTags: { [key: string]: string };
}
