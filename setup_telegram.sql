-- Enable the pg_net extension to make HTTP requests
create extension if not exists pg_net;

-- Function to send Telegram notifications
-- This keeps the Token and Chat ID secure on the server side
create or replace function send_telegram_notification(message_text text)
returns json
language plpgsql
security definer
as $$
declare
  -- TELEGRAM CONFIGURATION
  -- Replace these with your actual Token and Chat ID
  bot_token text := '5615970654:AAEiOd-m4fmQkps70wkZlvcwLvguk12FLNk';
  chat_id text := '-677659610';
  
  api_url text := 'https://api.telegram.org/bot' || bot_token || '/sendMessage';
  payload jsonb;
  request_id integer;
begin
  -- Construct the JSON payload
  payload := jsonb_build_object(
    'chat_id', chat_id,
    'text', message_text,
    'parse_mode', 'HTML'
  );

  -- Send the HTTP POST request using pg_net
  -- Note: pg_net requests are asynchronous
  select net.http_post(
    api_url,
    payload,
    '{}'::jsonb, -- params
    '{"Content-Type": "application/json"}'::jsonb -- headers
  ) into request_id;

  return json_build_object('status', 'queued', 'request_id', request_id);
exception when others then
  return json_build_object('error', SQLERRM);
end;
$$;

-- Grant permission for the API to call this function
grant execute on function send_telegram_notification(text) to anon, authenticated, service_role;
