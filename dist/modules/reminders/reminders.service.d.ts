export declare class RemindersService {
    static getDailyFollowUpQueue(): Promise<any[]>;
    static logFollowUp(data: {
        party_id: string;
        call_date: string;
        caller_user_id?: string;
        client_response: string;
        next_follow_up_date?: string;
        audio_note_url?: string;
    }): Promise<any>;
    static updatePromisedDate(scheduleId: string, promisedDate: string): Promise<any>;
    static runDailyReminderJob(): Promise<number>;
}
