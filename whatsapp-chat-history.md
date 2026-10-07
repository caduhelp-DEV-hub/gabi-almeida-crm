# WhatsApp Chat History & Bot Control

## Goal
Implement a complete chat history interface inside the CRM to visualize WhatsApp messages processed by the external bot, and add a control to manually disable the bot for specific numbers.

## Tasks
- [ ] Task 1: Create Supabase Migration → Verify: `supabase/migrations/[timestamp]_whatsapp_chats.sql` created with `whatsapp_chats` and `whatsapp_messages` tables.
- [ ] Task 2: Update Types and Mappers → Verify: `lib/types.ts` and `lib/mappers.ts` updated with `WhatsappChat` and `WhatsappMessage` interfaces.
- [ ] Task 3: Create Webhook API → Verify: `app/api/bot/webhook/route.ts` created to receive POST requests and insert messages into DB.
- [ ] Task 4: Add API for Toggling Bot → Verify: `app/api/bot/toggle/route.ts` created to allow disabling the bot for a specific chat.
- [ ] Task 5: Build Chat Interface UI → Verify: `app/page.tsx` has a new "WhatsApp" tab or a modal inside settings to list chats and messages, and a switch to "Desativar Robô" for a chat.
- [ ] Task 6: Add Bot Status API for External Bot → Verify: `app/api/bot/status/route.ts` created so the external bot can check if it should talk to a number.

## Done When
- [ ] The CRM has a database table for storing messages.
- [ ] The CRM has a webhook endpoint ready for the external bot to post messages.
- [ ] The UI displays the conversations and has a toggle to disable the bot per-number.
- [ ] The external bot can query an endpoint to know if it's disabled for a number.

## Notes
- The actual integration (n8n/Evolution) will still need to be configured by the user to POST messages to `/api/bot/webhook`.
- The `whatsapp_chats` table will store the `bot_disabled` flag and the `disabled_at` timestamp.
- The 24h auto-reactivation logic can be checked dynamically inside `app/api/bot/status/route.ts`.
