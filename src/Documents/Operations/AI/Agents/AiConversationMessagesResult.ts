import { AiUsage } from "./AiUsage.js";
import { AiConversationMessage } from "./AiConversationMessage.js";

export interface AiConversationMessagesResult {
    conversationId: string;
    agent: string;
    parameters: { [key: string]: object };
    totalUsage: AiUsage;
    lastMessageAt: string;
    messages: AiConversationMessage[];
    hasMoreMessages: boolean;
    subConversationIds: string[];
    attachments: string[];
}
