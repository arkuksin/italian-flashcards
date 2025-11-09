export interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  createdAt: number;
  updatedAt: number;
  framework?: string;
  devCommand?: string;
  buildCommand?: string;
  outputDirectory?: string;
  rootDirectory?: string;
  directoryListing: boolean;
  nodeVersion: string;
  speedInsights?: {
    id: string;
    hasData: boolean;
  };
  analytics?: {
    id: string;
    hasData: boolean;
  };
  env?: VercelEnvironmentVariable[];
  targets?: {
    production?: {
      alias?: string[];
    };
  };
}

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  type: 'LAMBDAS';
  creator: {
    uid: string;
    username: string;
  };
  inspectorUrl: string;
  meta: Record<string, unknown>;
  target?: string;
  aliasError?: unknown;
  aliasAssigned?: number;
  isRollbackCandidate?: boolean;
  createdAt: number;
  buildingAt?: number;
  ready?: number;
  projectId?: string;
  checksState?: 'registered' | 'running' | 'completed';
  checksConclusion?: 'succeeded' | 'failed' | 'skipped' | 'canceled';
}

export interface VercelDomain {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string | null;
  redirectStatusCode?: number;
  gitBranch?: string | null;
  updatedAt?: number;
  createdAt?: number;
  verified: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
}

export interface VercelEnvironmentVariable {
  type: 'system' | 'secret' | 'encrypted' | 'plain';
  id: string;
  key: string;
  value: string;
  target?: string[] | string;
  gitBranch?: string;
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
}

export interface VercelApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface ListProjectsResponse {
  projects: VercelProject[];
  pagination?: {
    count: number;
    next: number | null;
    prev: number | null;
  };
}

export interface ListDeploymentsResponse {
  deployments: VercelDeployment[];
  pagination?: {
    count: number;
    next: number | null;
    prev: number | null;
  };
}

export interface ListDomainsResponse {
  domains: VercelDomain[];
  pagination?: {
    count: number;
    next: number | null;
    prev: number | null;
  };
}

export interface ListEnvironmentVariablesResponse {
  envs: VercelEnvironmentVariable[];
}

export interface CreateProjectRequest {
  name: string;
  gitRepository?: {
    repo: string;
    type: 'github' | 'gitlab' | 'bitbucket';
  };
  framework?: string;
  buildCommand?: string;
  devCommand?: string;
  installCommand?: string;
  outputDirectory?: string;
  publicSource?: boolean;
  rootDirectory?: string;
  serverlessFunctionRegion?: string;
  environmentVariables?: Array<{
    key: string;
    value: string;
    target: string[];
    type?: 'system' | 'secret' | 'encrypted' | 'plain';
  }>;
}

export interface CreateDeploymentRequest {
  name: string;
  files?: Array<{
    file: string;
    data: string;
  }>;
  gitSource?: {
    ref: string;
    repoId: string;
    type: 'github' | 'gitlab' | 'bitbucket';
  };
  target?: 'production' | 'staging';
  meta?: Record<string, string>;
}

export interface AddDomainRequest {
  name: string;
  gitBranch?: string | null;
  redirect?: string | null;
  redirectStatusCode?: number;
}

export interface UpsertEnvironmentVariableRequest {
  key: string;
  value: string;
  type?: 'system' | 'secret' | 'encrypted' | 'plain';
  target?: string[];
  gitBranch?: string;
}

export interface DeploymentLog {
  type: 'command' | 'stdout' | 'stderr';
  created: number;
  payload: string;
}
