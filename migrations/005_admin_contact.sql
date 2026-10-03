-- Owner-directed contact change (2026-10-03). The practice inbox moves to
-- appointments@drsumyapervin.com — Cloudflare Email Routing forwards it to the
-- doctor's mailbox — and the CMS WhatsApp field follows the new phone number.
-- Both remain editable in the admin Settings tab; this sets the current values.
UPDATE admin_settings SET admin_email = 'appointments@drsumyapervin.com' WHERE id = 1;
UPDATE admin_settings SET whatsapp = '8801353787080' WHERE id = 1;
