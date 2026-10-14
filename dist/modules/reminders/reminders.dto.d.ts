import { z } from 'zod';
export declare const logFollowUpSchema: z.ZodObject<{
    party_id: z.ZodString;
    call_date: z.ZodString;
    client_response: z.ZodString;
    next_follow_up_date: z.ZodOptional<z.ZodString>;
    audio_note_url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    party_id: string;
    call_date: string;
    client_response: string;
    next_follow_up_date?: string | undefined;
    audio_note_url?: string | undefined;
}, {
    party_id: string;
    call_date: string;
    client_response: string;
    next_follow_up_date?: string | undefined;
    audio_note_url?: string | undefined;
}>;
export declare const updateSchedulePromiseSchema: z.ZodObject<{
    schedule_id: z.ZodString;
    promised_date: z.ZodString;
}, "strip", z.ZodTypeAny, {
    schedule_id: string;
    promised_date: string;
}, {
    schedule_id: string;
    promised_date: string;
}>;
