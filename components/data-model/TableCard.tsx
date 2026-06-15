"use client";

import { Key, Link2, Shield, Sparkles } from "lucide-react";
import type { DbField, DbTable, DbTableStatus, RlsPolicy } from "@/lib/db-model";
import {
  DB_TABLE_STATUS_LABELS,
  FIELD_ROW_HEIGHT,
  getTableHeight,
  SQL_FIELD_TYPE_LABELS,
  TABLE_CARD_WIDTH,
  TABLE_HEADER_HEIGHT,
} from "@/lib/db-model";

interface TableCardProps {
  table: DbTable;
  policies: RlsPolicy[];
  relationshipFieldIds: Set<string>;
  selected: boolean;
  connectHighlight?: boolean;
  onSelect: () => void;
  onAddField: () => void;
  onAddRls: () => void;
  onDelete: () => void;
  onToggleStatus?: () => void;
}

const STATUS_STYLES: Record<
  DbTableStatus,
  { border: string; glow: string; badge: string; badgeText: string }
> = {
  new: {
    border: "border-emerald-400/60",
    glow: "0 0 24px rgba(52,211,153,0.25), 0 20px 40px rgba(0,0,0,0.55)",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
    badgeText: "חדשה",
  },
  existing: {
    border: "border-lambo-gold/50",
    glow: "0 0 20px rgba(255,192,0,0.15), 0 20px 40px rgba(0,0,0,0.55)",
    badge: "bg-lambo-gold/15 text-lambo-gold border-lambo-gold/30",
    badgeText: "קיימת",
  },
};

export function TableCard({
  table,
  policies,
  relationshipFieldIds,
  selected,
  connectHighlight,
  onSelect,
  onAddField,
  onAddRls,
  onDelete,
  onToggleStatus,
}: TableCardProps) {
  const height = getTableHeight(table);
  const style = STATUS_STYLES[table.status ?? "existing"];

  return (
    <div
      className={`relative w-full table-card-3d transition-transform duration-200 ${
        selected ? "table-card-3d--selected" : ""
      } ${connectHighlight ? "table-card-3d--connect" : ""} border ${style.border}`}
      style={{
        width: TABLE_CARD_WIDTH,
        minHeight: height,
        boxShadow: style.glow,
      }}
      onClick={onSelect}
    >
      <div className="table-card-3d__face">
        <div
          className="px-3 py-2 border-b border-white/10 flex items-start justify-between gap-2 bg-gradient-to-b from-white/[0.06] to-transparent"
          style={{ minHeight: TABLE_HEADER_HEIGHT }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-1 flex-shrink-0">
            {table.rlsEnabled && (
              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-lambo-gold/20 text-lambo-gold border border-lambo-gold/30">
                RLS
              </span>
            )}
          </div>
        </div>

        <div>
          {table.fields.map((field) => (
            <FieldRow
              key={field.id}
              field={field}
              isFk={relationshipFieldIds.has(field.id)}
            />
          ))}
        </div>

        {table.rlsEnabled && policies.length > 0 && (
          <div className="border-t border-white/10 px-3 py-1.5 bg-black/20">
            <p className="text-[9px] uppercase text-white/40 flex items-center gap-1">
              <Shield size={10} />
              {policies.length} מדיניות RLS
            </p>
          </div>
        )}

        {selected && (
          <div className="border-t border-white/10 px-2 py-1.5 flex gap-1 flex-wrap bg-black/30">
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
    </div>
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
