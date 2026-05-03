-- Add optional exact location coordinates for local job matching.
-- These fields let clients share precise service location and let specialists filter jobs by radius.
alter table public.jobs
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_accuracy_m double precision;

create index if not exists jobs_geo_open_idx
  on public.jobs (status, latitude, longitude)
  where latitude is not null and longitude is not null;
