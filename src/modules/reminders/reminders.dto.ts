import { z } from 'zod';

export const logFollowUpSchema = z.object({
  party_id: z.string().uuid(),
  call_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  client_response: z.string().min(2),
  next_follow_up_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  audio_note_url: z.string().url().optional()
});

export const updateSchedulePromiseSchema = z.object({
  schedule_id: z.string().uuid(),
  promised_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
