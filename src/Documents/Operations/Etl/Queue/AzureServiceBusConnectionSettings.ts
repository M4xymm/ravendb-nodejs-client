export interface AzureServiceBusEntraId {
    namespace: string;
    tenantId: string;
    clientId: string;
    clientSecret: string;
}

export interface AzureServiceBusPasswordless {
    namespace: string;
}

export interface AzureServiceBusConnectionSettings {
    connectionString?: string;
    entraId?: AzureServiceBusEntraId;
    passwordless?: AzureServiceBusPasswordless;
}
