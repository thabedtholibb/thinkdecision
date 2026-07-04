-- Create dependencies table for ANP method support
-- Stores which criteria influence which other criteria

CREATE TABLE IF NOT EXISTS dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  from_criteria_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  to_criteria_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_dependency CHECK (from_criteria_id != to_criteria_id),
  CONSTRAINT unique_dependency UNIQUE(case_id, from_criteria_id, to_criteria_id)
);

-- Index for fast lookup of dependencies for a case
CREATE INDEX IF NOT EXISTS idx_dependencies_case_id ON dependencies(case_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_from_to ON dependencies(case_id, from_criteria_id, to_criteria_id);

-- Comments
COMMENT ON TABLE dependencies IS 'ANP network dependencies: from_criteria_id influences to_criteria_id';
COMMENT ON COLUMN dependencies.from_criteria_id IS 'The criterion that influences (source)';
COMMENT ON COLUMN dependencies.to_criteria_id IS 'The criterion being influenced (target)';
