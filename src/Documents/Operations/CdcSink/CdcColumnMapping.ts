import { CdcColumnType } from "./CdcColumnType.js";

export interface CdcColumnMapping {
    column: string;
    name: string;
    type: CdcColumnType;
}
