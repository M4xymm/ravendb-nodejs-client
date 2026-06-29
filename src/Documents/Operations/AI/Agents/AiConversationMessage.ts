import { AiUsage } from "./AiUsage.js";

export type AiMessageRole = "System" | "User" | "Assistant" | "Summary" | "Internal";

export interface AiToolCallResult {
    id: string;
    name: string;
    arguments: string;
    result: string;
    subConversationId: string;
}

export interface AiConversationMessage {
    role: AiMessageRole;
    content: string;
    attachments: string[];
    timestamp: string;
    toolCalls: AiToolCallResult[];
    usage: AiUsage;
    subConversationId: string;
}
