export interface AzureQueueStorageEntraId {
    storageAccountName: string;
    tenantId: string;
    clientId: string;
    clientSecret: string;
}

export interface AzureQueueStoragePasswordless {
    storageAccountName: string;
}

export interface AzureQueueStorageConnectionSettings {
    entraId?: AzureQueueStorageEntraId;
    connectionString?: string;
    passwordless?: AzureQueueStoragePasswordless;
}
