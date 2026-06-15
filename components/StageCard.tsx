"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import type { Stage } from "@/lib/types";
import { getStageStatus, isStageOpen } from "@/lib/types";
import { formatDateTime, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";
import { MilestoneForm } from "./StageForm";

interface StageCardProps {
  stage: Stage;
  stageOrder: number;
  projectColor: string;
  onUpdate: (stage: Stage) => void;
  onDelete: () => void;
  onAddMilestone: (title: string, description: string) => void;
  onDeleteMilestone: (milestoneId: string) => void;
  now?: Date;
}

export function StageCard({
  stage,
  stageOrder,
  projectColor,
  onUpdate,
  onDelete,
  onAddMilestone,
  onDeleteMilestone,
  now = new Date(),
}: StageCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);

  const status = getStageStatus(stage, now);
  const open = isStageOpen(stage, now);
  const accentColor = open ? projectColor : "var(--text-subtle)";

  const toggleComplete = () => {
    onUpdate({
      ...stage,
      status: stage.status === "completed" ? "active" : "completed",
    });
  };

  return (
    <div
      className={`transition-colors ${
        open ? "bg-theme-surface" : "bg-theme-raised opacity-90"
      }`}
      style={{ borderRight: `3px solid ${accentColor}` }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  background: open ? projectColor : "var(--border)",
                  color: open ? "#000" : "var(--text-muted)",
                }}
              >
                {stageOrder}
              </span>
              <h3 className="heading-display text-lg">{stage.title}</h3>
              <span className={`badge-status ${STATUS_COLORS[status]}`}>
                {STATUS_LABELS[status]}
              </span>
            </div>

            {stage.description && (
              <p className="text-sm text-theme-muted mt-2 leading-relaxed">
                {stage.description}
              </p>
            )}

            <div className="flex items-center gap-6 mt-3 label-micro">
              <span className="flex items-center gap-1.5">
                {open ? (
                  <Calendar size={12} style={{ color: accentColor }} />
                ) : (
                  <Lock size={12} />
                )}
                {open ? "נפתח" : "ייפתח"}: {formatDateTime(stage.openAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={12} />
                {stage.milestones.length} נקודות
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {open && (
              <button
                onClick={toggleComplete}
                className={`p-2 transition-colors ${
                  stage.status === "completed"
                    ? "text-lambo-gold"
                    : "text-theme-subtle hover:text-lambo-gold"
                }`}
                title={stage.status === "completed" ? "בטל השלמה" : "סמן כהושלם"}
              >
                <CheckCircle2 size={18} />
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 text-theme-muted hover:text-theme-text transition-colors"
            >
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-theme-subtle hover:text-lambo-gold transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-6 pt-6 border-t border-theme-border">
            {!open && (
              <div className="flex items-center gap-2 text-sm text-theme-muted mb-4 p-4 bg-theme-page">
                <Lock size={16} />
                שלב זה ייפתח אוטומטית ב-{formatDateTime(stage.openAt)}
              </div>
            )}

            {stage.milestones.length > 0 && (
              <div className="space-y-px mb-4">
                {stage.milestones
                  .sort((a, b) => a.order - b.order)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-2 p-3 bg-theme-page group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <MapPin
                          size={14}
                          style={{ color: open ? accentColor : "var(--text-subtle)" }}
                        />
                        <div className="min-w-0">
                          <p className={`text-sm ${open ? "text-theme-text" : "text-theme-subtle"}`}>
                            {m.title}
                          </p>
                          {m.description && (
                            <p className="text-xs text-theme-muted truncate mt-0.5">
                              {m.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {open && (
                        <button
                          onClick={() => onDeleteMilestone(m.id)}
                          className="p-1 text-theme-subtle hover:text-lambo-gold opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {open &&
              (showMilestoneForm ? (
                <MilestoneForm
                  onSubmit={(title, description) => {
                    onAddMilestone(title, description);
                    setShowMilestoneForm(false);
                  }}
                  onCancel={() => setShowMilestoneForm(false)}
                />
              ) : (
                <button
                  onClick={() => setShowMilestoneForm(true)}
                  className="flex items-center gap-2 text-sm text-lambo-gold hover:text-lambo-gold-text transition-colors"
                >
                  <Plus size={16} />
                  הוסף נקודת ציון
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
