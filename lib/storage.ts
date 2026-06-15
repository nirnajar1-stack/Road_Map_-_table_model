import type { Project } from "./types";
import { normalizeProject } from "./types";

const STORAGE_KEY = "roadmap-projects";

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as Project[]).map(normalizeProject);
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getProject(id: string): Project | undefined {
  return loadProjects().find((p) => p.id === id);
}

export function upsertProject(project: Project): void {
  const projects = loadProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.push(project);
  }
  saveProjects(projects);
}

export function deleteProject(id: string): void {
  saveProjects(loadProjects().filter((p) => p.id !== id));
}
