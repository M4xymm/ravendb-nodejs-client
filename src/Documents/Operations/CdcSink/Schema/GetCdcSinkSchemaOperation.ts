import { IMaintenanceOperation, OperationResultType } from "../../OperationAbstractions.js";
import { RavenCommand } from "../../../../Http/RavenCommand.js";
import { HttpRequestParameters } from "../../../../Primitives/Http.js";
import { Stream } from "node:stream";
import { DocumentConventions } from "../../../Conventions/DocumentConventions.js";
import { ServerNode } from "../../../../Http/ServerNode.js";
import { throwError } from "../../../../Exceptions/index.js";
import { CdcSinkSchemaRequest } from "./CdcSinkSchemaRequest.js";
import { CdcSinkSourceSchema } from "./CdcSinkSourceSchema.js";

export class GetCdcSinkSchemaOperation implements IMaintenanceOperation<CdcSinkSourceSchema> {
    private readonly _request: CdcSinkSchemaRequest;

    public constructor(request: CdcSinkSchemaRequest) {
        if (!request) {
            throwError("InvalidArgumentException", "Request cannot be null");
        }
        this._request = request;
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    public getCommand(conventions: DocumentConventions): RavenCommand<CdcSinkSourceSchema> {
        return new GetCdcSinkSchemaCommand(this._request);
    }
}

class GetCdcSinkSchemaCommand extends RavenCommand<CdcSinkSourceSchema> {
    private readonly _request: CdcSinkSchemaRequest;

    public constructor(request: CdcSinkSchemaRequest) {
        super();
        this._request = request;
    }

    public get isReadRequest(): boolean {
        return true;
    }

    public createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + node.database + "/admin/cdc-sink/schema";

        const body = this._serializer.serialize(this._request);

        const headers = this._headers()
            .typeAppJson()
            .build();

        return {
            uri,
            method: "POST",
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
}
