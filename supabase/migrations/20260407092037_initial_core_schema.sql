-- 20260407092037_initial_core_schema.sql

-- TEXT search extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enums
CREATE TYPE member_role AS ENUM ('admin', 'pastor', 'presbítero', 'diácono', 'tesoureiro', 'líder', 'membro', 'visitante');
CREATE TYPE relationship_type AS ENUM ('cônjuge', 'pai', 'mãe', 'filho', 'filha', 'irmão', 'irmã');
CREATE TYPE gender_type AS ENUM ('M', 'F');

-- Trigger function definitions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cnpj TEXT,
    slug TEXT NOT NULL UNIQUE,
    parent_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    shared_finances BOOLEAN DEFAULT FALSE,
    plan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- members table
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    home_church_id UUID REFERENCES tenants(id),
    name TEXT NOT NULL,
    cpf TEXT,
    rg TEXT,
    email TEXT,
    birth_date DATE,
    gender gender_type, 
    role member_role NOT NULL DEFAULT 'visitante',
    phone TEXT,
    avatar_url TEXT,
    invited_by UUID, -- Self-referencing constraint added later via ALTER TABLE
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_church_id_cpf UNIQUE (church_id, cpf)
);

-- Adds self-reference constraint
ALTER TABLE members ADD CONSTRAINT members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES members(id) ON DELETE SET NULL;

CREATE TRIGGER set_members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for members
CREATE INDEX idx_members_name_gin ON members USING GIN (name gin_trgm_ops);
CREATE INDEX idx_members_church_id ON members (church_id);
CREATE INDEX idx_members_role ON members (role);

-- family_links table
CREATE TABLE family_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    related_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    relationship relationship_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_church_member_related UNIQUE (church_id, member_id, related_member_id),
    CONSTRAINT family_link_no_self CHECK (member_id != related_member_id)
);

-- invite_links table
CREATE TABLE invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invite_links_code ON invite_links (code);

-- consent_records table
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    consented BOOLEAN NOT NULL,
    ip TEXT,
    terms_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES members(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB,
    ip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger bidirecional para family_links
CREATE OR REPLACE FUNCTION family_link_bidirectional_sync()
RETURNS TRIGGER AS $$
DECLARE
    reverse_rel relationship_type;
    target_gender gender_type;
BEGIN
    -- Previne loop infinito: se já foi startada pelo próprio trigger
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    IF NEW.relationship = 'cônjuge' THEN
        reverse_rel := 'cônjuge';
    ELSIF NEW.relationship IN ('pai', 'mãe') THEN
        SELECT gender INTO target_gender FROM members WHERE id = NEW.related_member_id;
        IF target_gender = 'M' THEN
            reverse_rel := 'filho';
        ELSE
            reverse_rel := 'filha';
        END IF;
    ELSIF NEW.relationship IN ('filho', 'filha') THEN
        SELECT gender INTO target_gender FROM members WHERE id = NEW.member_id;
        IF target_gender = 'M' THEN
            reverse_rel := 'pai';
        ELSE
            reverse_rel := 'mãe';
        END IF;
    ELSIF NEW.relationship IN ('irmão', 'irmã') THEN
        SELECT gender INTO target_gender FROM members WHERE id = NEW.related_member_id;
        IF target_gender = 'M' THEN
            reverse_rel := 'irmão';
        ELSE
            reverse_rel := 'irmã';
        END IF;
    END IF;

    -- Tenta inserir o lado inverso, pulando em caso de conflito (já inserido)
    IF reverse_rel IS NOT NULL THEN
        INSERT INTO family_links (church_id, member_id, related_member_id, relationship)
        VALUES (NEW.church_id, NEW.related_member_id, NEW.member_id, reverse_rel)
        ON CONFLICT (church_id, member_id, related_member_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_family_link_sync
AFTER INSERT ON family_links
FOR EACH ROW EXECUTE FUNCTION family_link_bidirectional_sync();
