-- Azure PostgreSQL Flexible Server 초기 스키마
-- Supabase PostgREST OpenAPI 스펙(GET /rest/v1/ with Accept: application/openapi+json)으로
-- 실제 컬럼 타입을 확인한 뒤 그대로 재현한 것 (추측 아님, 2026-08-14 확인).
-- 실행: psql "<Azure 연결문자열>" -f docs/azure-schema.sql

create extension if not exists pgcrypto; -- gen_random_uuid() 사용을 위함

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text,
  address text,
  phone text,
  business_type text,
  created_at timestamptz default now(),
  company_type text default 'client',
  business_no text,
  business_item text,
  email text,
  fax text,
  stamp_url text,
  ceo varchar(100),
  bank text
);

create table company_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  name text,
  phone text,
  created_at timestamptz default now()
);

create table quotations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  quote_date date default current_date,
  recipient text,
  total_amount bigint default 0,
  vat_type text default 'excluded',
  status text default 'draft',
  created_at timestamptz default now(),
  period integer default 1,
  project_name text,
  sender_company_id uuid references companies(id),
  sender_info jsonb,
  client_info jsonb
);

create table quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid references quotations(id),
  sort_order integer default 0,
  category text,
  item_name text,
  period integer default 1,
  unit_price bigint default 0,
  total_price bigint default 0,
  note text,
  created_at timestamptz default now(),
  sub_category text default ''
);

create table contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  contract_date date default current_date,
  content text,
  created_at timestamptz default now(),
  quotation_id uuid references quotations(id),
  recipient text,
  total_amount bigint default 0,
  vat_type text default 'excluded',
  status text default 'draft',
  start_date date,
  end_date date,
  special_terms text,
  sender_company_id uuid references companies(id),
  articles jsonb
);

create table contract_items (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references contracts(id),
  sort_order integer default 0,
  category text,
  item_name text,
  period integer default 1,
  unit_price bigint default 0,
  total_price bigint default 0,
  note text,
  created_at timestamptz default now(),
  sub_category text default ''
);

create table contract_templates (
  id uuid primary key default gen_random_uuid(),
  name text,
  description text,
  articles jsonb,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table note_templates (
  id uuid primary key default gen_random_uuid(),
  category text,
  title text,
  content text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text,
  sort_order integer default 0,
  created_at timestamptz default now()
);
