import { RevisionsOperationContinuationParameters } from "./RevisionsOperationContinuationParameters.js";

export interface RevisionsOperationParameters {
    collections?: string[];
    continuationParameters?: RevisionsOperationContinuationParameters;
}
