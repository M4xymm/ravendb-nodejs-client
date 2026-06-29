import { CompressionLevel } from "../Operations/Backups/CompressionLevel.js";

export interface BulkInsertOptions {
    useCompression?: boolean;
    compressionLevel?: CompressionLevel;
    skipOverwriteIfUnchanged?: boolean;
}