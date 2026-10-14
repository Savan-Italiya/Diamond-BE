export declare const config: {
    env: string;
    port: number;
    db: {
        client: string;
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
    };
    redis: {
        host: string;
        port: number;
        password: string | undefined;
    };
    kafka: {
        clientId: string;
        brokers: string[];
        groupId: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    logging: {
        level: string;
    };
};
