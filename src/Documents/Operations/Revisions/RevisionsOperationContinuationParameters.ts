export interface RevisionsOperationContinuationParameters {
    startFromEtags: { [key: string]: number };
    etagBarriers: { [key: string]: number };
    nodeTags: { [key: string]: string };
}
