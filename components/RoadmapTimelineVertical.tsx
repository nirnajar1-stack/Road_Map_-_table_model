"use client";

import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar, MapPin } from "lucide-react";
import type { Project, Stage } from "@/lib/types";
import { getStageStatus } from "@/lib/types";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";

interface VerticalRoadmapProps {
  project: Project;
  now?: Date;
}

export function VerticalRoadmap({ project, now = new Date() }: VerticalRoadmapProps) {
  const sortedStages = [...project.stages].sort((a, b) => a.order - b.order);

  if (sortedStages.length === 0) {
    return (
      <div className="text-center py-12 text-theme-muted">
        <p>הוסף שלבים כדי לראות את מפת הדרכים</p>
      </div>
    );
  }

  return (
    <div className="relative pr-8">
      <div
        className="absolute right-[11px] top-2 bottom-2 w-px"
        style={{ background: "var(--border)" }}
      />

      <div className="space-y-8">
        {sortedStages.map((stage, index) => (
          <VerticalStageNode
            key={stage.id}
            stage={stage}
            order={index + 1}
            accentColor={project.color}
            now={now}
          />
        ))}
      </div>
    </div>
  );
}

function VerticalStageNode({
  stage,
  order,
  accentColor,
  now,
}: {
  stage: Stage;
  order: number;
  accentColor: string;
  now: Date;
}) {
  const status = getStageStatus(stage, now);
  const isOpen = status === "active" || status === "completed";
  const color = isOpen ? accentColor : "var(--text-subtle)";

  return (
    <div className="relative">
      <div className="flex items-start gap-5">
        <div
          className="relative z-10 flex-shrink-0 w-8 h-8 flex items-center justify-center text-sm font-bold mt-1 border-2"
          style={{
            borderColor: color,
            background: isOpen ? color : "var(--surface-raised)",
            color: isOpen ? "#000" : "var(--text-muted)",
          }}
        >
          {order}
        </div>

        <div
          className={`flex-1 p-5 transition-colors border ${
            isOpen
              ? "bg-theme-surface border-theme-border"
              : "bg-theme-raised opacity-80 border-theme-border"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="heading-display text-base">{stage.title}</h3>
            <span className={`badge-status ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]}
            </span>
          </div>

          {stage.description && (
            <p className="text-sm text-theme-muted mt-2">{stage.description}</p>
          )}

          <p className="label-micro mt-3 flex items-center gap-1.5">
            <Calendar size={10} />
            נפתח: {format(new Date(stage.openAt), "d בMMMM yyyy, HH:mm", { locale: he })}
          </p>

          {stage.milestones.length > 0 && (
            <div className="mt-4 pt-4 border-t border-theme-border space-y-2">
              {stage.milestones
                .sort((a, b) => a.order - b.order)
                .map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-sm">
                    <MapPin size={12} style={{ color: isOpen ? color : "var(--text-subtle)" }} />
                    <span className={isOpen ? "text-theme-text" : "text-theme-subtle"}>
                      {m.title}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
