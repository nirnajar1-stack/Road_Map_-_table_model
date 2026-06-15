export const SQL_FIELD_TYPES = [
  "uuid",
  "text",
  "varchar",
  "integer",
  "bigint",
  "boolean",
  "timestamptz",
  "timestamp",
  "jsonb",
  "numeric",
  "date",
  "enum",
] as const;

export type SqlFieldType = (typeof SQL_FIELD_TYPES)[number];

export const SQL_FIELD_TYPE_LABELS: Record<SqlFieldType, string> = {
  uuid: "UUID",
  text: "TEXT",
  varchar: "VARCHAR",
  integer: "INTEGER",
  bigint: "BIGINT",
  boolean: "BOOLEAN",
  timestamptz: "TIMESTAMPTZ",
  timestamp: "TIMESTAMP",
  jsonb: "JSONB",
  numeric: "NUMERIC",
  date: "DATE",
  enum: "ENUM",
};

export type RlsAction = "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "ALL";

export const RLS_ACTIONS: RlsAction[] = [
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "ALL",
];

export const RLS_ROLES = [
  "authenticated",
  "anon",
  "service_role",
  "public",
] as const;

export type FkOnDelete = "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";

export const FK_ON_DELETE_OPTIONS: FkOnDelete[] = [
  "CASCADE",
  "SET NULL",
  "RESTRICT",
  "NO ACTION",
];

export interface DbField {
  id: string;
  name: string;
  type: SqlFieldType;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  defaultValue?: string;
  description?: string;
  order: number;
}

export type DbTableStatus = "new" | "existing";

export const DB_TABLE_STATUS_LABELS: Record<DbTableStatus, string> = {
  new: "חדשה",
  existing: "קיימת",
};

export interface DbTable {
  id: string;
  name: string;
  description?: string;
  fields: DbField[];
  position: { x: number; y: number };
  order: number;
  rlsEnabled: boolean;
  status: DbTableStatus;
}

export interface DbRelationship {
  id: string;
  name?: string;
  fromTableId: string;
  fromFieldId: string;
  toTableId: string;
  toFieldId: string;
  onDelete: FkOnDelete;
}

export interface RlsPolicy {
  id: string;
  tableId: string;
  name: string;
  action: RlsAction;
  role: string;
  using?: string;
  withCheck?: string;
  description?: string;
}

/** קו ויזואלי בין שתי טבלאות (לא בהכרח FK) */
export interface TableLink {
  id: string;
  fromTableId: string;
  toTableId: string;
  label?: string;
}

/** הודעה / הערה על הקנבס */
export interface DbNote {
  id: string;
  text: string;
  position: { x: number; y: number };
  tableId?: string;
  color?: string;
}

export interface DataModel {
  tables: DbTable[];
  relationships: DbRelationship[];
  rlsPolicies: RlsPolicy[];
  tableLinks: TableLink[];
  notes: DbNote[];
}

export const TABLE_CARD_WIDTH = 300;
export const TABLE_HEADER_HEIGHT = 52;
export const FIELD_ROW_HEIGHT = 30;

export function emptyDataModel(): DataModel {
  return { tables: [], relationships: [], rlsPolicies: [], tableLinks: [], notes: [] };
}

export function normalizeDataModel(model?: DataModel): DataModel {
  return {
    tables: (model?.tables ?? []).map((t) => ({
      ...t,
      rlsEnabled: t.rlsEnabled ?? false,
      status: t.status ?? "existing",
      fields: t.fields ?? [],
    })),
    relationships: model?.relationships ?? [],
    rlsPolicies: model?.rlsPolicies ?? [],
    tableLinks: model?.tableLinks ?? [],
    notes: model?.notes ?? [],
  };
}

export function defaultTablePosition(index: number): { x: number; y: number } {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: 48 + col * (TABLE_CARD_WIDTH + 64),
    y: 48 + row * 280,
  };
}

export function createDefaultFields(): Omit<DbField, "id" | "order">[] {
  return [
    {
      name: "id",
      type: "uuid",
      nullable: false,
      primaryKey: true,
      unique: true,
      defaultValue: "gen_random_uuid()",
      description: "מזהה ראשי",
    },
    {
      name: "created_at",
      type: "timestamptz",
      nullable: false,
      primaryKey: false,
      unique: false,
      defaultValue: "now()",
    },
  ];
}

export function getTableHeight(table: DbTable): number {
  return TABLE_HEADER_HEIGHT + table.fields.length * FIELD_ROW_HEIGHT + (table.rlsEnabled ? 28 : 0);
}

export function getTableCenter(table: DbTable): { x: number; y: number } {
  const h = getTableHeight(table);
  return {
    x: table.position.x + TABLE_CARD_WIDTH / 2,
    y: table.position.y + h / 2,
  };
}

/** נקודת חיבור בקצה הקרוב בין שתי טבלאות */
export function getTableEdgeAnchor(
  table: DbTable,
  target: { x: number; y: number }
): { x: number; y: number } {
  const h = getTableHeight(table);
  const cx = table.position.x + TABLE_CARD_WIDTH / 2;
  const cy = table.position.y + h / 2;
  const dx = target.x - cx;
  const dy = target.y - cy;
  if (Math.abs(dx) * h > Math.abs(dy) * TABLE_CARD_WIDTH) {
    return {
      x: dx > 0 ? table.position.x + TABLE_CARD_WIDTH : table.position.x,
      y: cy,
    };
  }
  return {
    x: cx,
    y: dy > 0 ? table.position.y + h : table.position.y,
  };
}

export function tableLinkPath(
  from: DbTable,
  to: DbTable
): string {
  const toCenter = getTableCenter(to);
  const fromCenter = getTableCenter(from);
  const start = getTableEdgeAnchor(from, toCenter);
  const end = getTableEdgeAnchor(to, fromCenter);
  const midX = (start.x + end.x) / 2;
  return `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;
}

export function getFieldAnchor(
  table: DbTable,
  fieldId: string
): { x: number; y: number } | null {
  const fieldIndex = table.fields.findIndex((f) => f.id === fieldId);
  if (fieldIndex < 0) return null;
  return {
    x: table.position.x + TABLE_CARD_WIDTH,
    y: table.position.y + TABLE_HEADER_HEIGHT + fieldIndex * FIELD_ROW_HEIGHT + FIELD_ROW_HEIGHT / 2,
  };
}

export function getFieldAnchorTarget(table: DbTable, fieldId: string): { x: number; y: number } | null {
  const fieldIndex = table.fields.findIndex((f) => f.id === fieldId);
  if (fieldIndex < 0) return null;
  return {
    x: table.position.x,
    y: table.position.y + TABLE_HEADER_HEIGHT + fieldIndex * FIELD_ROW_HEIGHT + FIELD_ROW_HEIGHT / 2,
  };
}

export function canvasSize(tables: DbTable[], notes: DbNote[] = []): { width: number; height: number } {
  const points: { x: number; y: number }[] = [];
  tables.forEach((t) => {
    points.push({ x: t.position.x + TABLE_CARD_WIDTH + 80, y: t.position.y });
    points.push({
      x: t.position.x,
      y: t.position.y + getTableHeight(t) + 80,
    });
  });
  notes.forEach((n) => points.push({ x: n.position.x + 220, y: n.position.y + 120 }));
  if (points.length === 0) return { width: 1400, height: 800 };
  const maxX = Math.max(...points.map((p) => p.x));
  const maxY = Math.max(...points.map((p) => p.y));
  return { width: Math.max(maxX, 1400), height: Math.max(maxY, 800) };
}
