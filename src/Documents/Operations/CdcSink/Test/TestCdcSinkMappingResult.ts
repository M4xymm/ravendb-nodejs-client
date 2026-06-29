import { TestCdcSinkRowResult } from "./TestCdcSinkRowResult.js";

export interface TestCdcSinkMappingResult {
    results: TestCdcSinkRowResult[];
    errors: string[];
    warnings: string[];
}
