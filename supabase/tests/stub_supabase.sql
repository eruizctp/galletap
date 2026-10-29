-- Imitación mínima de Supabase para probar el esquema en Postgres local.
do $$ begin create role anon; create role authenticated; exception when duplicate_object then null; end $$;
create schema auth;
create table auth.users (id uuid primary key, phone text);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id serial primary key, bucket_id text, name text);
create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
alter table storage.objects enable row level security;
grant usage on schema public, auth to authenticated;
