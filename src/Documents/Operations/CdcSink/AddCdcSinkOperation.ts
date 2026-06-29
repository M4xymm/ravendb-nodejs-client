import { IMaintenanceOperation, OperationResultType } from "../OperationAbstractions.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { Stream } from "node:stream";
import { DocumentConventions } from "../../Conventions/DocumentConventions.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { IRaftCommand } from "../../../Http/IRaftCommand.js";
import { RaftIdGenerator } from "../../../Utility/RaftIdGenerator.js";
import { throwError } from "../../../Exceptions/index.js";
import { CdcSinkConfiguration } from "./CdcSinkConfiguration.js";

export interface AddCdcSinkOperationResult {
    raftCommandIndex: number;
    taskId: number;
}

export class AddCdcSinkOperation implements IMaintenanceOperation<AddCdcSinkOperationResult> {
    private readonly _configuration: CdcSinkConfiguration;

    public constructor(configuration: CdcSinkConfiguration) {
        if (!configuration) {
            throwError("InvalidArgumentException", "Configuration cannot be null");
        }
        this._configuration = configuration;
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    public getCommand(conventions: DocumentConventions): RavenCommand<AddCdcSinkOperationResult> {
        return new AddCdcSinkCommand(this._configuration);
    }
}

class AddCdcSinkCommand extends RavenCommand<AddCdcSinkOperationResult> implements IRaftCommand {
    private readonly _configuration: CdcSinkConfiguration;

    public constructor(configuration: CdcSinkConfiguration) {
        super();
        this._configuration = configuration;
    }

    public get isReadRequest(): boolean {
        return false;
    }

    public createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + node.database + "/admin/cdc-sink";

        const body = this._serializer.serialize(this._configuration);

        const headers = this._headers()
            .typeAppJson()
            .build();

        return {
            uri,
            method: "PUT",
            headers,
            body
        };
    }

    public async setResponseAsync(bodyStream: Stream, fromCache: boolean): Promise<string> {
        if (!bodyStream) {
            this._throwInvalidResponse();
        }

        return this._parseResponseDefaultAsync(bodyStream);
    }

    public getRaftUniqueRequestId(): string {
        return RaftIdGenerator.newId();
    }
}
