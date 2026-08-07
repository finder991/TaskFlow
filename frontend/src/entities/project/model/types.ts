export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  tasksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPayload {
  name: string;
  description?: string;
}
