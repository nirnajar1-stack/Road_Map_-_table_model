"use client";

import { Plus, Shield, Trash2 } from "lucide-react";
import type { RlsPolicy } from "@/lib/db-model";

export function RlsPolicyList({
  policies,
  onAdd,
  onDelete,
}: {
  policies: RlsPolicy[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="label-caption flex items-center gap-1">
          <Shield size={12} />
          מדיניות RLS
        </p>
        <button onClick={onAdd} className="text-[10px] text-lambo-gold hover:underline flex items-center gap-0.5">
          <Plus size={12} /> הוסף
        </button>
      </div>

      {policies.length === 0 ? (
        <p className="text-xs text-theme-muted">אין מדיניות — הוסף SELECT/INSERT/UPDATE</p>
      ) : (
        <div className="space-y-2">
          {policies.map((p) => (
            <div key={p.id} className="border border-theme-border p-2 text-xs bg-theme-page group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 font-mono" dir="ltr">
                  <p className="font-medium text-theme-text">{p.name}</p>
                  <p className="text-theme-muted mt-0.5">
                    {p.action} · {p.role}
                  </p>
                </div>
                <button
                  onClick={() => onDelete(p.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-theme-subtle hover:text-lambo-gold"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              {p.using && (
                <pre className="mt-2 p-1.5 bg-theme-raised text-[10px] overflow-x-auto text-theme-muted" dir="ltr">
                  USING: {p.using}
                </pre>
              )}
              {p.withCheck && (
                <pre className="mt-1 p-1.5 bg-theme-raised text-[10px] overflow-x-auto text-theme-muted" dir="ltr">
                  CHECK: {p.withCheck}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
