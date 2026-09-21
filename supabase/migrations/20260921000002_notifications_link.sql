-- Add link column to notifications so clicking a notification can navigate
-- to the relevant page (e.g. the member's detail page for an inscription request).
alter table notifications add column if not exists link text;
