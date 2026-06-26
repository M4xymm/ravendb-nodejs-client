import { CompressionLevel } from "./CompressionLevel.js";

export interface BulkInsertOptions {
    useCompression?: boolean;
    compressionLevel?: CompressionLevel;
    skipOverwriteIfUnchanged?: boolean;
}