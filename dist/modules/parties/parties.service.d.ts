export declare class PartiesService {
    static getAllParties(filters?: {
        type?: string;
        search?: string;
    }): Promise<any[]>;
    static getPartyById(id: string): Promise<any>;
    static createParty(data: any): Promise<any>;
    static updateParty(id: string, data: any): Promise<any>;
}
