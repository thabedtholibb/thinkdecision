export type UserRole = 'creator' | 'expert';
export type DecisionMethod = 'AHP' | 'ANP' | 'FUZZY_AHP' | 'FUZZY_ANP';
export type AggregationMethod = 'GMJ' | 'GMP';
export type CaseStatus = 'draft' | 'active' | 'closed';
export type InviteStatus = 'pending' | 'accepted' | 'completed';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Case {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  method: DecisionMethod;
  aggregation_method: AggregationMethod;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
}

export interface Criteria {
  id: string;
  case_id: string;
  parent_id?: string;
  label: string;
  description?: string;
  level: number;
  order_index: number;
  children: Criteria[];
}

export interface Alternative {
  id: string;
  case_id: string;
  label: string;
  description?: string;
  order_index: number;
}

export interface ExpertProgress {
  expert_id: string;
  email: string;
  full_name: string;
  status: InviteStatus;
  invited_at: string;
  accepted_at?: string;
  completed_at?: string;
  comparisons_submitted: number;
  comparisons_required: number;
  progress_percent: number;
}

export interface Comparison {
  id: string;
  case_id: string;
  expert_id: string;
  node_type: string;
  parent_id?: string;
  value_matrix: number[][];
  priority_vector?: number[];
  cr?: number;
  is_consistent?: boolean;
  submitted_at: string;
  updated_at: string;
}

export interface RankingItem {
  rank: number;
  alternative_id: string;
  alternative_label: string;
  global_weight: number;
  percentage: number;
}

export interface AggregatedResult {
  case_id: string;
  aggregation_method_used: AggregationMethod;
  ranking: RankingItem[];
  criteria_weights: Record<string, number>;
  aggregate_cr?: number;
  computed_at: string;
  experts_included: number;
}

export interface CaseProgress {
  total_experts: number;
  completed: number;
  pending: number;
  accepted: number;
  completion_percent: number;
}
