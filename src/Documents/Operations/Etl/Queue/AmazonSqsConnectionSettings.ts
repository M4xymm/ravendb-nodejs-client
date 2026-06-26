export interface AmazonSqsBasicCredentials {
    accessKey: string;
    secretKey: string;
    regionName: string;
}

export interface AmazonSqsConnectionSettings {
    basic?: AmazonSqsBasicCredentials;
    passwordless?: boolean;
}
