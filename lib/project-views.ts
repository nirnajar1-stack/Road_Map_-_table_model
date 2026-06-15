export const PROJECT_VIEWS = ["timeline", "schema", "vertical", "stages"] as const;

export type ProjectView = (typeof PROJECT_VIEWS)[number];

export const DEFAULT_PROJECT_VIEW: ProjectView = "timeline";

export const PROJECT_VIEW_LABELS: Record<ProjectView, string> = {
  timeline: "טבלה",
  schema: "מודל",
  vertical: "אנכי",
  stages: "שלבים",
};

export function isProjectView(value: string): value is ProjectView {
  return (PROJECT_VIEWS as readonly string[]).includes(value);
}

export function projectViewPath(projectId: string, view: ProjectView): string {
  return `/project/${projectId}/${view}`;
}
