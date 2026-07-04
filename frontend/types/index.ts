// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'creator' | 'expert';
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'creator' | 'expert';
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Cases
export interface Case {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  method: 'AHP' | 'TOPSIS';
  aggregationMethod: 'GMJ' | 'GMP';
  status: 'draft' | 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface CaseWithStats extends Case {
  criteriaCount: number;
  alternativesCount: number;
  expertsCount: number;
  completedCount: number;
}

// Criteria
export interface Criterion {
  id: string;
  caseId: string;
  name: string;
  parentId?: string;
  level: number;
  order: number;
  createdAt: string;
}

export interface CriterionWithChildren extends Criterion {
  children: CriterionWithChildren[];
}

// Alternatives
export interface Alternative {
  id: string;
  caseId: string;
  name: string;
  description?: string;
  order: number;
  createdAt: string;
}

// Experts
export interface Expert {
  id: string;
  caseId: string;
  email: string;
  name: string;
  status: 'pending' | 'accepted' | 'completed';
  invitedAt: string;
  acceptedAt?: string;
  completedAt?: string;
}

// Comparisons & Matrices
export interface ComparisonMatrix {
  id: string;
  caseId: string;
  nodeId: string; // criteria ID
  expertId: string;
  matrix: number[][];
  consistencyRatio: number;
  status: 'pending' | 'completed';
  submittedAt?: string;
  createdAt: string;
}

export interface PairwiseComparison {
  itemI: string;
  itemJ: string;
  value: number;
}

// Results
export interface AggregatedResult {
  caseId: string;
  aggregationMethod: 'GMJ' | 'GMP';
  criteria: {
    [criteriaId: string]: {
      name: string;
      priority: number;
      children?: {
        [childId: string]: {
          name: string;
          priority: number;
        };
      };
    };
  };
  alternatives: {
    [altId: string]: {
      name: string;
      finalScore: number;
      rank: number;
    };
  };
  aggregatedAt: string;
}

// Consistency
export interface ConsistencyInfo {
  cr: number; // Consistency Ratio
  ci: number; // Consistency Index
  rm: number; // Random Index (RI)
  isConsistent: boolean;
  threshold: number;
}

export interface PriorityVector {
  [itemId: string]: number;
}

// API Responses
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ErrorResponse {
  message: string;
  code: string;
  details?: Record<string, any>;
}

// Form Data
export interface CreateCaseForm {
  name: string;
  description: string;
  method: 'AHP' | 'TOPSIS';
  aggregationMethod: 'GMJ' | 'GMP';
}

export interface CreateCriterionForm {
  name: string;
  parentId?: string;
}

export interface CreateAlternativeForm {
  name: string;
  description: string;
}

export interface InviteExpertForm {
  email: string;
}
