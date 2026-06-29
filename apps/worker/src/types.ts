/** Payload shape shared with the web app's queue producer. */
export interface ContextJobData {
  jobId: string;
  workspaceId: string;
  task: string;
  createdBy: string;
  channel?: string;
  threadTs?: string;
}
