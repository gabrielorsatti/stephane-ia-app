-- RPC function to delete all user data and auth account.
-- Called from the client via supabase.rpc('delete_user_account').
-- Cascading deletes handle most relations; explicit cleanup for tables
-- without FK cascades or with composite keys.
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.push_subscriptions where user_id = uid;
  delete from public.blocks where blocker_id = uid or blocked_id = uid;
  delete from public.reports where reporter_id = uid;
  delete from public.notifications where user_id = uid or actor_id = uid;
  delete from public.likes where user_id = uid;
  delete from public.comments where user_id = uid;
  delete from public.sessions where user_id = uid;
  delete from public.nutrition_logs where user_id = uid;
  delete from public.body_weights where user_id = uid;
  delete from public.occupancy_feedback where user_id = uid;
  delete from public.friendships where sender_id = uid or receiver_id = uid;
  delete from public.api_usage_logs where user_id = uid;
  delete from public.profiles where id = uid;

  -- Finally, remove the auth user row itself
  delete from auth.users where id = uid;
end;
$$;
