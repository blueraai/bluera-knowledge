import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================

export const JobTypeSchema = z.enum(['clone', 'index', 'crawl']);
export const JobStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']);

export const JobDetailsSchema = z.object({
  storeName: z.string().optional(),
  storeId: z.string().optional(),
  url: z.string().optional(),
  path: z.string().optional(),
  filesProcessed: z.number().optional(),
  totalFiles: z.number().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  cancelledAt: z.string().optional(),
  error: z.string().optional(),
  // Crawl-specific fields
  crawlInstruction: z.string().optional(),
  extractInstruction: z.string().optional(),
  maxPages: z.number().optional(),
  simple: z.boolean().optional(),
  useHeadless: z.boolean().optional(),
  pagesCrawled: z.number().optional(),
});

export const JobSchema = z.object({
  id: z.string(),
  type: JobTypeSchema,
  status: JobStatusSchema,
  progress: z.number().min(0).max(100),
  message: z.string(),
  details: JobDetailsSchema.default({}),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ============================================================================
// Types (inferred from schemas)
// ============================================================================

export type JobType = z.infer<typeof JobTypeSchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
export type JobDetails = z.infer<typeof JobDetailsSchema>;
export type Job = z.infer<typeof JobSchema>;

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
