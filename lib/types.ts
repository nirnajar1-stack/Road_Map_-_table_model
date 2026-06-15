import { normalizeDataModel, type DataModel } from "./db-model";

export type StageStatus = "locked" | "upcoming" | "active" | "completed";

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  order: number;
}

export interface Stage {
  id: string;
  title: string;
  description?: string;
  openAt: string;
  order: number;
  status: StageStatus;
  milestones: Milestone[];
}

export interface RoadmapFactor {
  id: string;
  name: string;
  order: number;
  color: string;
}

export interface RoadmapTask {
  id: string;
  factorId: string;
  title: string;
  startDate: string;
  endDate: string;
  color?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  stages: Stage[];
  factors: RoadmapFactor[];
  tasks: RoadmapTask[];
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

export const FACTOR_COLORS = [
  "#FFC000",
  "#29ABE2",
  "#8B5CF6",
  "#22C55E",
  "#EC4899",
  "#F59E0B",
  "#06B6D4",
  "#EF4444",
  "#3860BE",
  "#10B981",
] as const;

export function getFactorColor(index: number): string {
  return FACTOR_COLORS[index % FACTOR_COLORS.length];
}

export const SUGGESTED_FACTORS = [
  "פיתוח",
  "עיצוב UI/UX",
  "מוצר",
  "ניהול פרויקט",
  "QA / בדיקות",
  "תשתיות",
  "שיווק",
  "תוכן",
  "אפיון",
  "DevOps",
] as const;

export function getStageStatus(stage: Stage, now = new Date()): StageStatus {
  if (stage.status === "completed") return "completed";

  const openDate = new Date(stage.openAt);
  if (openDate > now) return "upcoming";

  return stage.status === "locked" ? "active" : stage.status;
}

export function isStageOpen(stage: Stage, now = new Date()): boolean {
  const status = getStageStatus(stage, now);
  return status === "active" || status === "completed";
}

export function normalizeProject(project: Project): Project {
  return {
    ...project,
    factors: (project.factors ?? []).map((f, i) => ({
      ...f,
      color: f.color ?? getFactorColor(i),
    })),
    tasks: project.tasks ?? [],
    dataModel: normalizeDataModel(project.dataModel),
  };
}
