alter table class_sessions
  add column if not exists auto_close_at timestamptz;

update class_sessions
set auto_close_at = ((session_date::text || ' 23:59:59')::timestamp + interval '1 day') at time zone 'America/Guayaquil'
where auto_close_at is null;
