"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { CheckCircle2, Lock, Map } from "lucide-react";
import type { Project, Stage } from "@/lib/types";
import { getStageStatus } from "@/lib/types";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";

interface TimelineMapProps {
  project: Project;
  now?: Date;
}

const AXIS_OFFSET = 112;

export function TimelineMap({ project, now = new Date() }: TimelineMapProps) {
  const stages = useMemo(
    () => [...project.stages].sort((a, b) => a.order - b.order),
    [project.stages]
  );

  const progressPercent = useMemo(() => {
    if (stages.length <= 1) return stages.length === 1 ? 100 : 0;
    const lastActive = stages.reduce((max, s, i) => {
      const st = getStageStatus(s, now);
      return st === "active" || st === "completed" ? i : max;
    }, -1);
    if (lastActive < 0) return 0;
    return (lastActive / (stages.length - 1)) * 100;
  }, [stages, now]);

  if (stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-theme-muted bg-theme-surface">
        <Map size={36} className="mb-4 opacity-25" strokeWidth={1.5} />
        <p className="heading-display text-base">אין שלבים בציר הזמן</p>
        <p className="label-micro mt-2">הוסף שלבים כדי לראות את המסלול</p>
      </div>
    );
  }

  return (
    <div className="bg-theme-surface">
      <div
        className="flex items-center justify-between px-6 py-3 border-b border-theme-border"
        style={{ background: "color-mix(in srgb, var(--surface) 92%, transparent)" }}
      >
        <p className="label-caption">
          {stages.length} שלבים ·{" "}
          {stages.reduce((n, s) => n + s.milestones.length, 0)} אבני דרך
        </p>
        <div className="flex items-center gap-5 label-micro">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lambo-gold" />
            הושלם / פעיל
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-theme-subtle bg-theme-raised" />
            עתידי
          </span>
        </div>
      </div>

      <div className="timeline-scroll overflow-x-auto px-10 py-12">
        <div className="relative inline-flex min-w-full">
          <div
            className="absolute right-10 left-10 h-[2px] bg-theme-border pointer-events-none"
            style={{ top: AXIS_OFFSET }}
          />
          <div
            className="absolute right-10 h-[2px] bg-lambo-gold pointer-events-none transition-all duration-500"
            style={{
              top: AXIS_OFFSET,
              width: `calc((100% - 5rem) * ${progressPercent / 100})`,
            }}
          />

          <div className="relative flex">
            {stages.map((stage, index) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                order={index + 1}
                accentColor={project.color}
                now={now}
                isLast={index === stages.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StageColumn({
  stage,
  order,
  accentColor,
  now,
  isLast,
}: {
  stage: Stage;
  order: number;
  accentColor: string;
  now: Date;
  isLast: boolean;
}) {
  const status = getStageStatus(stage, now);
  const open = status === "active" || status === "completed";
  const milestones = [...stage.milestones].sort((a, b) => a.order - b.order);

  const nodeColor = open ? accentColor : "var(--border)";
  const activeNode = status === "active";
  const completedNode = status === "completed";

  return (
    <div
      className={`flex flex-col items-center flex-shrink-0 ${isLast ? "w-52" : "w-56"}`}
    >
      <div className="w-48 text-center mb-5 min-h-[72px] flex flex-col justify-end">
        <p className="label-micro mb-1.5">שלב {order}</p>
        <h3 className="text-sm font-medium text-theme-text leading-snug">{stage.title}</h3>
        <p className="label-micro mt-1.5 flex items-center justify-center gap-1">
          {!open && <Lock size={8} />}
          {format(new Date(stage.openAt), "d בMMM yyyy", { locale: he })}
        </p>
        <span className={`badge-status mt-2 ${STATUS_COLORS[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div
          className={`timeline-node ${open ? "timeline-node-open" : ""} ${
            activeNode ? "timeline-node-active" : ""
          } ${completedNode ? "timeline-node-done" : ""}`}
          style={
            open
              ? ({
                  "--node-color": accentColor,
                  borderColor: accentColor,
                  background: completedNode || activeNode ? accentColor : "var(--surface)",
                } as React.CSSProperties)
              : undefined
          }
        >
          {completedNode ? (
            <CheckCircle2 size={11} className="text-black" strokeWidth={2.5} />
          ) : (
            <span
              className="text-[10px] font-bold leading-none"
              style={{ color: open ? (activeNode ? "#000" : accentColor) : "var(--text-subtle)" }}
            >
              {order}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center w-full mt-0">
        {milestones.length > 0 && (
          <div
            className="w-px flex-shrink-0"
            style={{
              height: 20,
              background: open ? accentColor : "var(--border)",
            }}
          />
        )}

        {milestones.map((m, i) => (
          <div key={m.id} className="flex flex-col items-center w-full">
            {i > 0 && (
              <div
                className="w-px h-3"
                style={{ background: open ? accentColor : "var(--border)", opacity: 0.5 }}
              />
            )}
            <MilestoneCard title={m.title} description={m.description} open={open} accentColor={accentColor} />
          </div>
        ))}

        {milestones.length === 0 && <div className="h-4" />}
      </div>
    </div>
  );
}

function MilestoneCard({
  title,
  description,
  open,
  accentColor,
}: {
  title: string;
  description?: string;
  open: boolean;
  accentColor: string;
}) {
  return (
    <div className="relative flex flex-col items-center w-full px-1">
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mb-1"
        style={{ background: open ? accentColor : "var(--text-subtle)" }}
      />
      <div
        className={`w-full max-w-[168px] px-3 py-2.5 border text-center transition-colors ${
          open ? "bg-theme-page border-theme-border" : "bg-theme-raised border-theme-border opacity-75"
        }`}
        style={open ? { borderRightWidth: 2, borderRightColor: accentColor } : undefined}
      >
        <p className="text-xs font-medium text-theme-text leading-snug">{title}</p>
        {description && (
          <p className="text-[10px] text-theme-muted mt-1 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
