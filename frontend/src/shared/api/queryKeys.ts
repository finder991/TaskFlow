
export const queryKeys = {
  workspaces: ['workspaces'] as const,
  workspace: (id: string) => ['workspace', id] as const,
  projects: (workspaceId: string) => ['projects', workspaceId] as const,
  project: (id: string) => ['project', id] as const,
  board: (projectId: string) => ['board', projectId] as const,
  task: (id: string) => ['task', id] as const,
  comments: (taskId: string) => ['comments', taskId] as const,
  activity: (taskId: string) => ['activity', taskId] as const,
  invitationPreview: (token: string) => ['invitation', token] as const,
};
