/** האם העמוד רץ בתוך iframe (למשל הטמעה ב-Notion) */
export function isEmbeddedFrame(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function embedProjectPath(projectId: string): string {
  return `/embed/${projectId}`;
}
