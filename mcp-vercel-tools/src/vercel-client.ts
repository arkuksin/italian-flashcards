import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  VercelProject,
  VercelDeployment,
  VercelDomain,
  VercelEnvironmentVariable,
  ListProjectsResponse,
  ListDeploymentsResponse,
  ListEnvironmentVariablesResponse,
  CreateProjectRequest,
  CreateDeploymentRequest,
  AddDomainRequest,
  UpsertEnvironmentVariableRequest,
  DeploymentLog,
  VercelApiError,
} from './types.js';

export class VercelClient {
  private client: AxiosInstance;
  private teamId?: string;

  constructor(token: string, teamId?: string) {
    this.teamId = teamId;
    this.client = axios.create({
      baseURL: 'https://api.vercel.com',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<VercelApiError>) => {
        if (error.response?.data?.error) {
          throw new Error(`Vercel API Error: ${error.response.data.error.message} (${error.response.data.error.code})`);
        }
        throw error;
      }
    );
  }

  private getTeamParams(): Record<string, string> {
    return this.teamId ? { teamId: this.teamId } : {};
  }

  // Project Management
  async listProjects(limit = 20, since?: number): Promise<ListProjectsResponse> {
    const params = {
      ...this.getTeamParams(),
      limit,
      ...(since && { since }),
    };
    const response = await this.client.get<ListProjectsResponse>('/v9/projects', { params });
    return response.data;
  }

  async getProject(projectId: string): Promise<VercelProject> {
    const params = this.getTeamParams();
    const response = await this.client.get<VercelProject>(`/v9/projects/${projectId}`, { params });
    return response.data;
  }

  async createProject(project: CreateProjectRequest): Promise<VercelProject> {
    const params = this.getTeamParams();
    const response = await this.client.post<VercelProject>('/v10/projects', project, { params });
    return response.data;
  }

  async deleteProject(projectId: string): Promise<void> {
    const params = this.getTeamParams();
    await this.client.delete(`/v9/projects/${projectId}`, { params });
  }

  // Deployment Management
  async listDeployments(projectId?: string, limit = 20, since?: number): Promise<ListDeploymentsResponse> {
    const params = {
      ...this.getTeamParams(),
      limit,
      ...(projectId && { projectId }),
      ...(since && { since }),
    };
    const response = await this.client.get<ListDeploymentsResponse>('/v6/deployments', { params });
    return response.data;
  }

  async getDeployment(deploymentId: string): Promise<VercelDeployment> {
    const params = this.getTeamParams();
    const response = await this.client.get<VercelDeployment>(`/v13/deployments/${deploymentId}`, { params });
    return response.data;
  }

  async createDeployment(deployment: CreateDeploymentRequest): Promise<VercelDeployment> {
    const params = this.getTeamParams();
    const response = await this.client.post<VercelDeployment>('/v13/deployments', deployment, { params });
    return response.data;
  }

  async cancelDeployment(deploymentId: string): Promise<VercelDeployment> {
    const params = this.getTeamParams();
    const response = await this.client.patch<VercelDeployment>(
      `/v13/deployments/${deploymentId}/cancel`,
      {},
      { params }
    );
    return response.data;
  }

  async getDeploymentLogs(deploymentId: string): Promise<DeploymentLog[]> {
    const params = this.getTeamParams();
    const response = await this.client.get<DeploymentLog[]>(`/v2/deployments/${deploymentId}/events`, { params });
    return response.data;
  }

  // Domain Management
  async listDomains(projectId: string): Promise<VercelDomain[]> {
    const params = this.getTeamParams();
    const response = await this.client.get<VercelDomain[]>(`/v9/projects/${projectId}/domains`, { params });
    return response.data;
  }

  async addDomain(projectId: string, domain: AddDomainRequest): Promise<VercelDomain> {
    const params = this.getTeamParams();
    const response = await this.client.post<VercelDomain>(
      `/v10/projects/${projectId}/domains`,
      domain,
      { params }
    );
    return response.data;
  }

  async removeDomain(projectId: string, domain: string): Promise<void> {
    const params = this.getTeamParams();
    await this.client.delete(`/v9/projects/${projectId}/domains/${domain}`, { params });
  }

  async verifyDomain(projectId: string, domain: string): Promise<VercelDomain> {
    const params = this.getTeamParams();
    const response = await this.client.post<VercelDomain>(
      `/v9/projects/${projectId}/domains/${domain}/verify`,
      {},
      { params }
    );
    return response.data;
  }

  // Environment Variables
  async listEnvironmentVariables(projectId: string): Promise<VercelEnvironmentVariable[]> {
    const params = this.getTeamParams();
    const response = await this.client.get<ListEnvironmentVariablesResponse>(
      `/v8/projects/${projectId}/env`,
      { params }
    );
    return response.data.envs;
  }

  async getEnvironmentVariable(projectId: string, envId: string): Promise<VercelEnvironmentVariable> {
    const params = this.getTeamParams();
    const response = await this.client.get<VercelEnvironmentVariable>(
      `/v8/projects/${projectId}/env/${envId}`,
      { params }
    );
    return response.data;
  }

  async createEnvironmentVariable(
    projectId: string,
    env: UpsertEnvironmentVariableRequest
  ): Promise<VercelEnvironmentVariable> {
    const params = this.getTeamParams();
    const response = await this.client.post<VercelEnvironmentVariable>(
      `/v10/projects/${projectId}/env`,
      env,
      { params }
    );
    return response.data;
  }

  async updateEnvironmentVariable(
    projectId: string,
    envId: string,
    env: Partial<UpsertEnvironmentVariableRequest>
  ): Promise<VercelEnvironmentVariable> {
    const params = this.getTeamParams();
    const response = await this.client.patch<VercelEnvironmentVariable>(
      `/v9/projects/${projectId}/env/${envId}`,
      env,
      { params }
    );
    return response.data;
  }

  async deleteEnvironmentVariable(projectId: string, envId: string): Promise<void> {
    const params = this.getTeamParams();
    await this.client.delete(`/v9/projects/${projectId}/env/${envId}`, { params });
  }
}
