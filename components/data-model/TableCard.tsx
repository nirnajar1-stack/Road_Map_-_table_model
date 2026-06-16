"use client";

import { useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsLeftRight,
  Key,
  Link2,
  Pin,
  PinOff,
  Shield,
  Sparkles,
} from "lucide-react";
import type { DbField, DbTable, DbTableStatus, RlsPolicy } from "@/lib/db-model";
import {
  DB_TABLE_STATUS_LABELS,
  FIELD_ROW_HEIGHT,
  getTableBodyHeight,
  getTableHeight,
  getTableWidth,
  SQL_FIELD_TYPE_LABELS,
  TABLE_BODY_MAX_HEIGHT,
  TABLE_BODY_MIN_HEIGHT,
  TABLE_CARD_MAX_WIDTH,
  TABLE_CARD_MIN_WIDTH,
  TABLE_CARD_WIDTH,
  TABLE_HEADER_HEIGHT,
} from "@/lib/db-model";

export type TableLayoutUpdate = {
  cardWidth?: number;
  bodyMaxHeight?: number;
  fieldsCollapsed?: boolean;
  pinned?: boolean;
};

interface TableCardProps {
  table: DbTable;
  policies: RlsPolicy[];
  relationshipFieldIds: Set<string>;
  selected: boolean;
  connectHighlight?: boolean;
  onAddField: () => void;
  onAddRls: () => void;
  onDelete: () => void;
  onToggleStatus?: () => void;
  onUpdateLayout: (updates: TableLayoutUpdate) => void;
}

const STATUS_STYLES: Record<
  DbTableStatus,
  { border: string; glow: string; badge: string }
> = {
  new: {
    border: "border-emerald-400/60",
    glow: "0 0 24px rgba(52,211,153,0.25), 0 20px 40px rgba(0,0,0,0.55)",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
  },
  existing: {
    border: "border-lambo-gold/50",
    glow: "0 0 20px rgba(255,192,0,0.15), 0 20px 40px rgba(0,0,0,0.55)",
    badge: "bg-lambo-gold/15 text-lambo-gold border-lambo-gold/30",
  },
};

export function TableCard({
  table,
  policies,
  relationshipFieldIds,
  selected,
  connectHighlight,
  onAddField,
  onAddRls,
  onDelete,
  onToggleStatus,
  onUpdateLayout,
}: TableCardProps) {
  const width = getTableWidth(table);
  const bodyHeight = getTableBodyHeight(table);
  const cardHeight = getTableHeight(table, selected);
  const style = STATUS_STYLES[table.status ?? "existing"];
  const resizeRef = useRef<{
    kind: "width" | "height";
    startX: number;
    startY: number;
    startWidth: number;
    startBodyHeight: number;
  } | null>(null);

  const fullFieldsHeight = table.fields.length * FIELD_ROW_HEIGHT;
  const bodyScrollable =
    !table.fieldsCollapsed && table.bodyMaxHeight != null && fullFieldsHeight > bodyHeight;

  const startResize = (
    e: React.PointerEvent,
    kind: "width" | "height"
  ) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    resizeRef.current = {
      kind,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: width,
      startBodyHeight:
        table.bodyMaxHeight ??
        (fullFieldsHeight || TABLE_BODY_MIN_HEIGHT),
    };
  };

  const onResizeMove = (e: React.PointerEvent) => {
    const r = resizeRef.current;
    if (!r) return;
    if (r.kind === "width") {
      const delta = e.clientX - r.startX;
      const next = Math.min(
        TABLE_CARD_MAX_WIDTH,
        Math.max(TABLE_CARD_MIN_WIDTH, r.startWidth + delta)
      );
      onUpdateLayout({ cardWidth: next });
    } else {
      const delta = e.clientY - r.startY;
      const next = Math.min(
        TABLE_BODY_MAX_HEIGHT,
        Math.max(TABLE_BODY_MIN_HEIGHT, r.startBodyHeight + delta)
      );
      onUpdateLayout({ bodyMaxHeight: next, fieldsCollapsed: false });
    }
  };

  const endResize = () => {
    resizeRef.current = null;
  };

  const nudgeWidth = (delta: number) => {
    onUpdateLayout({
      cardWidth: Math.min(
        TABLE_CARD_MAX_WIDTH,
        Math.max(TABLE_CARD_MIN_WIDTH, width + delta)
      ),
    });
  };

  return (
    <div
      className={`relative w-full table-card-3d transition-shadow duration-200 ${
        selected ? "table-card-3d--selected" : ""
      } ${connectHighlight ? "table-card-3d--connect" : ""} ${table.pinned ? "ring-1 ring-lambo-gold/50" : ""} border ${style.border}`}
      style={{
        width,
        minHeight: cardHeight,
        boxShadow: table.pinned
          ? `${style.glow}, 0 0 0 1px rgba(255,192,0,0.35)`
          : style.glow,
      }}
      onPointerMove={onResizeMove}
      onPointerUp={endResize}
      onPointerCancel={endResize}
    >
      <div className="table-card-3d__face flex flex-col h-full">
        <div
          className="px-3 py-2 border-b border-white/10 flex items-start justify-between gap-2 bg-gradient-to-b from-white/[0.06] to-transparent flex-shrink-0"
          style={{ minHeight: TABLE_HEADER_HEIGHT }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {table.pinned && <Pin size={10} className="text-lambo-gold flex-shrink-0" />}
              <p className="font-mono text-sm font-semibold text-white truncate" dir="ltr">
                {table.name}
              </p>
              <span
                className={`text-[8px] uppercase px-1.5 py-0.5 border flex-shrink-0 ${style.badge}`}
              >
                {table.status === "new" && <Sparkles size={8} className="inline mr-0.5" />}
                {DB_TABLE_STATUS_LABELS[table.status ?? "existing"]}
              </span>
            </div>
            {table.description && (
              <p className="text-[10px] text-white/50 truncate mt-0.5">{table.description}</p>
            )}
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <HeaderBtn
              title={table.fieldsCollapsed ? "הרחב שדות" : "כווץ שדות"}
              onClick={() =>
                onUpdateLayout({ fieldsCollapsed: !table.fieldsCollapsed })
              }
            >
              {table.fieldsCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </HeaderBtn>
            <HeaderBtn
              title={table.pinned ? "בטל נעיצה" : "נעץ טבלה"}
              onClick={() => onUpdateLayout({ pinned: !table.pinned })}
              active={table.pinned}
            >
              {table.pinned ? <PinOff size={12} /> : <Pin size={12} />}
            </HeaderBtn>
            {table.rlsEnabled && (
              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-lambo-gold/20 text-lambo-gold border border-lambo-gold/30">
                RLS
              </span>
            )}
          </div>
        </div>

        {table.fieldsCollapsed ? (
          <button
            type="button"
            className="w-full px-3 py-2 text-[10px] text-white/50 hover:text-lambo-gold hover:bg-white/5 text-right transition-colors border-b border-white/5"
            style={{ height: bodyHeight }}
            onClick={(e) => {
              e.stopPropagation();
              onUpdateLayout({ fieldsCollapsed: false });
            }}
          >
            {table.fields.length} שדות — לחץ להרחבה
          </button>
        ) : (
          <div
            className={`flex-shrink-0 ${bodyScrollable ? "overflow-y-auto scrollbar-thin" : ""}`}
            style={{ height: bodyHeight, maxHeight: bodyHeight }}
          >
            {table.fields.map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                isFk={relationshipFieldIds.has(field.id)}
              />
            ))}
            {table.fields.length === 0 && (
              <p className="px-3 py-2 text-[10px] text-white/30">אין שדות</p>
            )}
          </div>
        )}

        {table.rlsEnabled && policies.length > 0 && !table.fieldsCollapsed && (
          <div className="border-t border-white/10 px-3 py-1.5 bg-black/20 flex-shrink-0">
            <p className="text-[9px] uppercase text-white/40 flex items-center gap-1">
              <Shield size={10} />
              {policies.length} מדיניות RLS
            </p>
          </div>
        )}

        {selected && (
          <div className="border-t border-white/10 px-2 py-1.5 flex gap-1 flex-wrap bg-black/30 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                nudgeWidth(-24);
              }}
              className="text-[10px] px-2 py-1 bg-white/10 hover:bg-lambo-gold/20 text-white/80"
              title="צמצם רוחב"
            >
              <ChevronsLeftRight size={10} className="rotate-90" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nudgeWidth(24);
              }}
              className="text-[10px] px-2 py-1 bg-white/10 hover:bg-lambo-gold/20 text-white/80"
              title="הרחב רוחב"
            >
              <ChevronsLeftRight size={10} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddField();
              }}
              className="text-[10px] px-2 py-1 bg-white/10 hover:bg-lambo-gold/20 text-white/80"
            >
              + שדה
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddRls();
              }}
              className="text-[10px] px-2 py-1 bg-white/10 hover:bg-lambo-gold/20 text-white/80"
            >
              + RLS
            </button>
            {onToggleStatus && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStatus();
                }}
                className="text-[10px] px-2 py-1 bg-white/10 hover:bg-emerald-500/20 text-white/80"
              >
                {table.status === "new" ? "סמן קיימת" : "סמן חדשה"}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`למחוק את הטבלה ${table.name}?`)) onDelete();
              }}
              className="text-[10px] px-2 py-1 text-red-400 hover:bg-red-400/10"
            >
              מחק
            </button>
          </div>
        )}
      </div>

      {selected && (
        <>
          <div
            className="absolute top-0 bottom-0 -left-1 w-2 cursor-ew-resize hover:bg-lambo-gold/30 z-10"
            onPointerDown={(e) => startResize(e, "width")}
            title="גרור לשינוי רוחב"
          />
          <div
            className="absolute top-0 bottom-0 -right-1 w-2 cursor-ew-resize hover:bg-lambo-gold/30 z-10"
            onPointerDown={(e) => startResize(e, "width")}
            title="גרור לשינוי רוחב"
          />
          {!table.fieldsCollapsed && (
            <div
              className="absolute left-0 right-0 -bottom-1 h-2 cursor-ns-resize hover:bg-lambo-gold/30 z-10"
              onPointerDown={(e) => startResize(e, "height")}
              title="גרור לשינוי גובה"
            />
          )}
        </>
      )}
    </div>
  );
}

function HeaderBtn({
  children,
  title,
  onClick,
  active,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`p-1 rounded-sm transition-colors ${
        active ? "text-lambo-gold bg-lambo-gold/15" : "text-white/50 hover:text-white hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function FieldRow({ field, isFk }: { field: DbField; isFk: boolean }) {
  return (
    <div
      data-field-id={field.id}
      className="flex items-center gap-2 px-3 border-b border-white/5 font-mono text-[11px]"
      style={{ height: FIELD_ROW_HEIGHT }}
      dir="ltr"
    >
      <span className="flex items-center gap-1 w-5 flex-shrink-0">
        {field.primaryKey && <Key size={10} className="text-lambo-gold" />}
        {isFk && <Link2 size={10} className="text-lambo-cyan" />}
      </span>
      <span className="flex-1 truncate text-white/85">{field.name}</span>
      <span className="text-white/40 flex-shrink-0">{SQL_FIELD_TYPE_LABELS[field.type]}</span>
      {!field.nullable && <span className="text-[9px] text-white/25">NN</span>}
    </div>
  );
}
