import { IMaintenanceOperation, OperationResultType } from "../../OperationAbstractions.js";
import { RavenCommand } from "../../../../Http/RavenCommand.js";
import { HttpRequestParameters } from "../../../../Primitives/Http.js";
import { Stream } from "node:stream";
import { DocumentConventions } from "../../../Conventions/DocumentConventions.js";
import { ServerNode } from "../../../../Http/ServerNode.js";
import { throwError } from "../../../../Exceptions/index.js";
import { TestCdcSinkMappingRequest } from "./TestCdcSinkMappingRequest.js";
import { TestCdcSinkMappingResult } from "./TestCdcSinkMappingResult.js";

export class TestCdcSinkMappingOperation implements IMaintenanceOperation<TestCdcSinkMappingResult> {
    private readonly _request: TestCdcSinkMappingRequest;

    public constructor(request: TestCdcSinkMappingRequest) {
        if (!request) {
            throwError("InvalidArgumentException", "Request cannot be null");
        }
        this._request = request;
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    public getCommand(conventions: DocumentConventions): RavenCommand<TestCdcSinkMappingResult> {
        return new TestCdcSinkMappingCommand(this._request);
    }
}

class TestCdcSinkMappingCommand extends RavenCommand<TestCdcSinkMappingResult> {
    private readonly _request: TestCdcSinkMappingRequest;

    public constructor(request: TestCdcSinkMappingRequest) {
        super();
        this._request = request;
    }

    public get isReadRequest(): boolean {
        return true;
    }

    public createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + node.database + "/admin/cdc-sink/test";

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
