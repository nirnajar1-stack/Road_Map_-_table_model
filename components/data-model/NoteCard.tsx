"use client";

import { MessageSquare, X } from "lucide-react";
import type { DbNote } from "@/lib/db-model";

interface NoteCardProps {
  note: DbNote;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (text: string) => void;
  onDelete: () => void;
}

export function NoteCard({
  note,
  selected,
  onSelect,
  onUpdate,
  onDelete,
}: NoteCardProps) {
  const accent = note.color ?? "#FFC000";

  return (
    <div
      className={`schema-note-card ${selected ? "schema-note-card--selected" : ""}`}
      style={{
        borderColor: accent,
        boxShadow: `0 12px 32px rgba(0,0,0,0.45), 0 0 0 1px ${accent}33, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/10"
        style={{ background: `linear-gradient(135deg, ${accent}22, transparent)` }}
      >
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/70">
          <MessageSquare size={11} style={{ color: accent }} />
          הודעה
        </span>
        {selected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("למחוק את ההודעה?")) onDelete();
            }}
            className="text-white/40 hover:text-red-400 transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {selected ? (
        <textarea
          className="w-full min-h-[72px] bg-transparent text-sm text-white/90 p-3 resize-none outline-none placeholder:text-white/30"
          value={note.text}
          onChange={(e) => onUpdate(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="כתוב הערה למפתח..."
          autoFocus
        />
      ) : (
        <p className="text-sm text-white/80 p-3 whitespace-pre-wrap min-h-[72px]">
          {note.text || <span className="text-white/30 italic">הודעה ריקה...</span>}
        </p>
      )}
    </div>
  );
}
