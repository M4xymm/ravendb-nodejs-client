import { IMaintenanceOperation, OperationResultType } from "../../OperationAbstractions.js";
import { Stream } from "node:stream";
import type { AiConversationMessagesResult } from "./AiConversationMessagesResult.js";
import type { AiConversationDetailLevel } from "./AiConversationDetailLevel.js";
import { DocumentConventions } from "../../../Conventions/DocumentConventions.js";
import { RavenCommand } from "../../../../Http/RavenCommand.js";
import { ServerNode } from "../../../../Http/ServerNode.js";
import { HttpRequestParameters } from "../../../../Primitives/Http.js";
import { throwError } from "../../../../Exceptions/index.js";
import { StringUtil } from "../../../../Utility/StringUtil.js";

export interface GetConversationMessagesOptions {
    conversationId: string;
    before?: string;
    after?: string;
    pageSize?: number;
    detailLevel?: AiConversationDetailLevel;
}

export class GetConversationMessagesOperation implements IMaintenanceOperation<AiConversationMessagesResult> {
    private readonly _parameters: GetConversationMessagesOptions;

    public constructor(options: GetConversationMessagesOptions);
    public constructor(conversationId: string);
    public constructor(optionsOrConversationId: GetConversationMessagesOptions | string) {
        const parameters: GetConversationMessagesOptions = typeof optionsOrConversationId === "string"
            ? { conversationId: optionsOrConversationId }
            : optionsOrConversationId;

        if (!parameters) {
            throwError("InvalidArgumentException", "parameters cannot be null.");
        }
        if (StringUtil.isNullOrEmpty(parameters.conversationId)) {
            throwError("InvalidArgumentException", "conversationId cannot be null or empty.");
        }
        if (parameters.before != null && parameters.after != null) {
            throwError("InvalidArgumentException", "before and after cannot both be specified.");
        }
        if (parameters.pageSize != null && parameters.pageSize <= 0) {
            throwError("InvalidArgumentException", "pageSize must be greater than 0.");
        }

        this._parameters = {
            ...parameters,
            pageSize: parameters.pageSize ?? 2147483647,
            detailLevel: parameters.detailLevel ?? "Simple"
        };
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    public getCommand(conventions: DocumentConventions): RavenCommand<AiConversationMessagesResult> {
        return new GetConversationMessagesCommand(this._parameters);
    }
}

class GetConversationMessagesCommand extends RavenCommand<AiConversationMessagesResult> {
    private readonly _params: GetConversationMessagesOptions;

    public constructor(parameters: GetConversationMessagesOptions) {
        super();
        this._params = parameters;
    }

    get isReadRequest(): boolean {
        return true;
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        let uri = `${node.url}/databases/${node.database}/ai/agent/conversation/messages`
            + `?conversationId=${encodeURIComponent(this._params.conversationId)}`;

        if (this._params.before != null) {
            uri += `&before=${encodeURIComponent(this._params.before)}`;
        }
        if (this._params.after != null) {
            uri += `&after=${encodeURIComponent(this._params.after)}`;
        }
        uri += `&pageSize=${this._params.pageSize}`;
        uri += `&detailLevel=${this._params.detailLevel}`;

        return {
            method: "GET",
            uri
        };
    }

    async setResponseAsync(bodyStream: Stream, fromCache: boolean): Promise<string> {
        if (!bodyStream) {
            return;
        }

        return this._parseResponseDefaultAsync(bodyStream);
    }
}
