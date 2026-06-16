import { normalizeDataModel, type DataModel } from "./db-model";

export const MODEL_SNAPSHOT_PARAM = "model";

export function encodeModelSnapshot(model: DataModel): string {
  const json = JSON.stringify(model);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeModelSnapshot(encoded: string): DataModel | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return normalizeDataModel(JSON.parse(json) as DataModel);
  } catch {
    return null;
  }
}

export function readModelFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">
): DataModel | null {
  const encoded = searchParams.get(MODEL_SNAPSHOT_PARAM);
  if (!encoded) return null;
  return decodeModelSnapshot(encoded);
}

export function buildModelShareUrl(pathname: string, model: DataModel): string {
  const url = new URL(
    pathname,
    typeof window !== "undefined" ? window.location.origin : "http://localhost"
  );
  url.searchParams.set(MODEL_SNAPSHOT_PARAM, encodeModelSnapshot(model));
  return url.toString();
}

/** מקסימום אורך סביר לשמירה ב-URL */
export const MAX_URL_SNAPSHOT_LENGTH = 14_000;

export function canEmbedModelInUrl(model: DataModel): boolean {
  return encodeModelSnapshot(model).length <= MAX_URL_SNAPSHOT_LENGTH;
}
