import { CdcColumnType } from "../CdcColumnType.js";

export interface CdcSinkSourceColumn {
    name: string;
    nativeType: string;
    suggestedType: CdcColumnType;
    isPrimaryKey: boolean;
    isCdcCapturable: boolean;
    unsupportedReason: string;
}
