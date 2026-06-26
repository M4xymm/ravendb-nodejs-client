import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { IMaintenanceOperation, OperationResultType } from "../OperationAbstractions.js";
import { DocumentConventions } from "../../Conventions/DocumentConventions.js";
import { Stream } from "node:stream";
import { ObjectUtil } from "../../../Utility/ObjectUtil.js";
import { IndexPerformanceStats } from "../../Indexes/IndexPerformanceStats.js";
import { throwError } from "../../../Exceptions/index.js";

export class GetIndexPerformanceStatisticsOperation implements IMaintenanceOperation<IndexPerformanceStats[]> {

    private readonly _indexNames: string[];

    public constructor()
    public constructor(indexNames: string[])
    public constructor(indexNames?: string[]) {
        if (arguments.length > 0 && !indexNames) {
            throwError("InvalidArgumentException", "IndexNames cannot be null");
        }
        this._indexNames = indexNames;
    }

    public getCommand(conventions: DocumentConventions): RavenCommand<IndexPerformanceStats[]> {
        return new GetIndexPerformanceStatisticsCommand(this._indexNames);
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }
}

export class GetIndexPerformanceStatisticsCommand extends RavenCommand<IndexPerformanceStats[]> {
    private readonly _indexNames: string[];

    public constructor(indexNames: string[]) {
        super();
        this._indexNames = indexNames;
    }

    public createRequest(node: ServerNode): HttpRequestParameters {
        let uri = node.url + "/databases/" + node.database + "/indexes/performance";

        if (this._indexNames && this._indexNames.length > 0) {
            uri += "?";
            for (const indexName of this._indexNames) {
                uri += "&name=" + encodeURIComponent(indexName);
            }
        }

        return { uri };
    }

    public async setResponseAsync(bodyStream: Stream, fromCache: boolean): Promise<string> {
        if (!bodyStream) {
            this._throwInvalidResponse();
        }

        let body: string = null;
        const result = await this._pipeline<object>()
            .collectBody(b => body = b)
            .parseJsonSync()
            .objectKeysTransform({
                defaultTransform: ObjectUtil.camel
            })
            .process(bodyStream);

        this.result = result["results"];
        return body;
    }

    public get isReadRequest(): boolean {
        return true;
    }
}
