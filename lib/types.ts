import { normalizeDataModel, type DataModel } from "./db-model";

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  dataModel: DataModel;
}

export const PROJECT_COLORS = [
  "#FFC000",
  "#FFFFFF",
  "#969696",
  "#7D7D7D",
  "#666666",
  "#555555",
  "#494949",
] as const;

export function normalizeProject(project: Partial<Project> & Pick<Project, "id" | "name">): Project {
  const now = new Date().toISOString();
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    color: project.color ?? PROJECT_COLORS[0],
    createdAt: project.createdAt ?? now,
    updatedAt: project.updatedAt ?? now,
    dataModel: normalizeDataModel(project.dataModel),
  };
}
