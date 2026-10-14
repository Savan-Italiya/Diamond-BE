export declare class AuthService {
    static login(email: string, password: string): Promise<{
        token: string;
        user: any;
    }>;
    static register(data: {
        name: string;
        phone: string;
        email: string;
        password: string;
        roleNames: string[];
    }): Promise<any>;
}
