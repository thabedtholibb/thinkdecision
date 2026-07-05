export type UserRole = "creator" | "expert";

export interface User {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
  institution?: string;
}

export type CaseMethod = "AHP" | "ANP" | "Fuzzy AHP" | "Fuzzy ANP";
export type CaseStatus = "draft" | "active" | "completed";
export type ExpertStatus = "invited" | "in_progress" | "completed";

export interface Case {
  id: string;
  name: string;
  description?: string;
  objective?: string;
  method: CaseMethod;
  status: CaseStatus;
  deadline?: string;
  created_at: string;
  creator_id: string;
  // Field tambahan dari list endpoint
  expertsCount?: number;
  criteriaCount?: number;
  alternativesCount?: number;
  progress?: number;
  // Field tambahan dari detail endpoint
  goal?: { id?: string; name: string };
  criteria?: Criterion[];
  alternatives?: Alternative[];
  experts?: CaseExpert[];
}

export interface Criterion {
  id: string;
  name: string;
  description?: string;
  parent_criteria_id?: string | null;
  level: number;
}

export interface Alternative {
  id: string;
  name: string;
}

// Baris case_experts dengan data user tersemat (dari GET /cases/:id)
export interface CaseExpert {
  case_id: string;
  expert_id: string;
  weight: number;
  status: ExpertStatus;
  created_at?: string;
  completed_at?: string;
  users?: User;
}

export interface Expert {
  id: string;
  email: string;
  name?: string;
  institution?: string;
  weight: number;
  status: ExpertStatus;
  invited_at?: string;
  completed_at?: string;
}

// Sparse map perbandingan segitiga atas: { "0-1": 3, "0-2": 5, ... }
export type ComparisonMap = Record<string, number>;

export interface CaseResults {
  caseId: string;
  caseName: string;
  method: CaseMethod;
  aggregationMethod?: string;
  totalExperts: number;
  completedExperts: number;
  message?: string;
  experts?: { id: string; name: string; email: string; weight: number; cr: number }[];
  criteriaWeights?: { id: string; name: string; weight: number }[];
  alternativeScores?: { id: string; name: string; score: number; rank: number }[];
  consistencyRatio?: number | null;
  recommendation?: { id: string; name: string; score: number; rank: number } | null;
  criteria?: Criterion[];
  alternatives?: Alternative[];
}

export interface ResultsResponse {
  success: boolean;
  status: "waiting" | "completed";
  data: CaseResults;
}

export interface ExpertInvitation {
  case_id: string;
  status: ExpertStatus;
  cases?: {
    id: string;
    name: string;
    method: CaseMethod;
    deadline?: string;
    creator_id: string;
    users?: { name: string; institution?: string };
  };
}

export interface ExpertDashboard {
  stats: {
    activeCases: number;
    completedCases: number;
    avgCR: number;
    totalContributions: number;
  };
  invitations: ExpertInvitation[];
}
