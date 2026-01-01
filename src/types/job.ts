export type JobType = 'clone' | 'index' | 'crawl';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface JobDetails {
  storeName?: string;
  storeId?: string;
  url?: string;
  path?: string;
  filesProcessed?: number;
  totalFiles?: number;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  error?: string;
}

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  progress: number; // 0-100
  message: string;
  details: JobDetails;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobParams {
  type: JobType;
  details: JobDetails;
  message?: string;
}

export interface UpdateJobParams {
  status?: JobStatus;
  progress?: number;
  message?: string;
  details?: Partial<JobDetails>;
}
