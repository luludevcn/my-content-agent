interface ActiveTask {
  controller: AbortController;
  model: string;
}

const activeTasks = new Map<string, ActiveTask>();

export function registerTask(taskId: string, controller: AbortController, model: string): void {
  activeTasks.set(taskId, { controller, model });
}

export function unregisterTask(taskId: string): void {
  activeTasks.delete(taskId);
}

export function getTaskController(taskId: string): AbortController | undefined {
  return activeTasks.get(taskId)?.controller;
}

export function abortTask(taskId: string): boolean {
  const task = activeTasks.get(taskId);
  if (task) {
    task.controller.abort();
    activeTasks.delete(taskId);
    return true;
  }
  return false;
}

export function getActiveTaskCount(): number {
  return activeTasks.size;
}

export function listActiveTasks(): string[] {
  return Array.from(activeTasks.keys());
}
