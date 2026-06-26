export interface PostgreSqlUser {
    username: string;
    password: string;
}

export interface PostgreSqlAuthenticationConfiguration {
    users: PostgreSqlUser[];
}

export interface PostgreSqlConfiguration {
    authentication: PostgreSqlAuthenticationConfiguration;
}
