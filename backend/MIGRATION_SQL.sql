-- Think Decision Backend - Initial Schema Migration
-- Run this in Supabase SQL Editor if alembic upgrade fails

-- Create ENUM types
CREATE TYPE userrole AS ENUM ('creator', 'expert');
CREATE TYPE decisionmethod AS ENUM ('AHP', 'ANP', 'FUZZY_AHP', 'FUZZY_ANP');
CREATE TYPE aggregationmethod AS ENUM ('GMJ', 'GMP');
CREATE TYPE casestatus AS ENUM ('draft', 'active', 'closed');
CREATE TYPE invitestatus AS ENUM ('pending', 'accepted', 'completed');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role userrole NOT NULL DEFAULT 'creator',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cases table
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    method decisionmethod NOT NULL DEFAULT 'AHP',
    aggregation_method aggregationmethod NOT NULL DEFAULT 'GMJ',
    status casestatus NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criteria table
CREATE TABLE criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES criteria(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Alternatives table
CREATE TABLE alternatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Expert invites table
CREATE TABLE expert_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status invitestatus NOT NULL DEFAULT 'pending',
    invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(case_id, expert_id)
);

-- Comparisons table
CREATE TABLE comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    node_type VARCHAR(50) NOT NULL CHECK (node_type IN ('criteria', 'alternative')),
    parent_id UUID,
    value_matrix JSONB NOT NULL,
    priority_vector JSONB,
    cr FLOAT,
    is_consistent BOOLEAN,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(case_id, expert_id, node_type, parent_id)
);

-- Aggregated results table
CREATE TABLE aggregated_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
    aggregation_method_used aggregationmethod NOT NULL,
    global_weights JSONB NOT NULL,
    criteria_weights JSONB NOT NULL,
    expert_priorities JSONB NOT NULL,
    aggregate_cr FLOAT,
    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_cases_creator_id ON cases(creator_id);
CREATE INDEX idx_criteria_case_id ON criteria(case_id);
CREATE INDEX idx_alternatives_case_id ON alternatives(case_id);
CREATE INDEX idx_expert_invites_case_id ON expert_invites(case_id);
CREATE INDEX idx_expert_invites_expert_id ON expert_invites(expert_id);
CREATE INDEX idx_comparisons_case_id ON comparisons(case_id);
CREATE INDEX idx_comparisons_expert_id ON comparisons(expert_id);
