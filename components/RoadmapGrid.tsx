"use client";

import { useMemo } from "react";
import { Plus, Table2, Trash2 } from "lucide-react";
import type { Project, RoadmapFactor, RoadmapTask } from "@/lib/types";
import { normalizeProject } from "@/lib/types";
import {
  buildWeekColumns,
  formatDateRange,
  getProjectDateRange,
  getTaskBarPosition,
  groupWeeksByMonth,
  FACTOR_COL_WIDTH,
  MIN_TASK_BAR_LABEL_WIDTH,
  WEEK_COL_WIDTH,
} from "@/lib/roadmap-grid";

interface RoadmapGridProps {
  project: Project;
  onAddFactor?: () => void;
  onAddTask?: (factorId?: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onDeleteFactor?: (factorId: string) => void;
}

export function RoadmapGrid({
  project,
  onAddFactor,
  onAddTask,
  onDeleteTask,
  onDeleteFactor,
}: RoadmapGridProps) {
  const data = normalizeProject(project);
  const factors = [...data.factors].sort((a, b) => a.order - b.order);
  const tasks = data.tasks;

  const { weeks, monthGroups } = useMemo(() => {
    const { start, end } = getProjectDateRange(tasks);
    const weeks = buildWeekColumns(start, end);
    return { weeks, monthGroups: groupWeeksByMonth(weeks) };
  }, [tasks]);

  const gridTemplate = `${FACTOR_COL_WIDTH}px repeat(${weeks.length}, ${WEEK_COL_WIDTH}px)`;
  const headerRow = 1;
  const weekRow = 2;
  const firstFactorRow = 3;

  if (factors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-theme-muted bg-theme-surface">
        <Table2 size={36} className="mb-4 opacity-25" strokeWidth={1.5} />
        <p className="heading-display text-base">אין גורמים בטבלה</p>
        <p className="label-micro mt-2 mb-6">הוסף גורם מהרשימה כדי להתחיל לבנות את מפת הדרכים</p>
        {onAddFactor && (
          <button onClick={onAddFactor} className="btn-gold-sm">
            <Plus size={16} />
            הוסף גורם ראשון
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-theme-surface w-full">
      <div
        className="flex items-center justify-between px-6 lg:px-10 py-4 border-b border-theme-border gap-4 flex-wrap"
        style={{ background: "color-mix(in srgb, var(--surface) 92%, transparent)" }}
      >
        <p className="label-caption">
          {factors.length} גורמים · {tasks.length} משימות · {weeks.length} שבועות
        </p>
        <div className="flex items-center gap-2">
          {onAddFactor && (
            <button onClick={onAddFactor} className="btn-ghost-sm !opacity-100">
              <Plus size={14} />
              גורם
            </button>
          )}
          {onAddTask && (
            <button onClick={() => onAddTask()} className="btn-gold-sm">
              <Plus size={14} />
              משימה
            </button>
          )}
        </div>
      </div>

      <div className="roadmap-grid-scroll overflow-auto min-h-[520px] max-h-[calc(100vh-200px)] w-full">
        <div
          className="grid min-w-max"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div
            className="sticky top-0 right-0 z-30 bg-theme-raised border-b border-l border-theme-border px-4 py-4 label-caption"
            style={{ gridRow: headerRow, gridColumn: 1 }}
          >
            גורם
          </div>

          {monthGroups.map((group) => (
            <div
              key={group.monthKey}
              className="sticky top-0 z-20 bg-theme-raised border-b border-l border-theme-border px-2 py-3 text-center"
              style={{
                gridRow: headerRow,
                gridColumn: `${group.startIndex + 2} / span ${group.weekCount}`,
              }}
            >
              <p className="text-sm sm:text-base font-medium text-theme-text capitalize">
                {group.monthLabel}
              </p>
            </div>
          ))}

          <div
            className="sticky top-[49px] right-0 z-30 bg-theme-surface border-b border-l border-theme-border px-4 py-3 label-micro"
            style={{ gridRow: weekRow, gridColumn: 1 }}
          >
            שבוע
          </div>

          {weeks.map((week) => (
            <div
              key={`week-${week.index}`}
              className="sticky top-[49px] z-20 bg-theme-surface border-b border-l border-theme-border px-1 py-3 text-center min-h-[44px] flex items-center justify-center"
              style={{ gridRow: weekRow, gridColumn: week.index + 2 }}
            >
              <span className="text-xs font-medium text-theme-text">ש{week.weekOfMonth}</span>
            </div>
          ))}

          {factors.map((factor, factorIndex) => (
            <FactorRow
              key={factor.id}
              factor={factor}
              tasks={tasks.filter((t) => t.factorId === factor.id)}
              weeks={weeks}
              gridRow={firstFactorRow + factorIndex}
              onAddTask={onAddTask}
              onDeleteTask={onDeleteTask}
              onDeleteFactor={onDeleteFactor}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FactorRow({
  factor,
  tasks,
  weeks,
  gridRow,
  onAddTask,
  onDeleteTask,
  onDeleteFactor,
}: {
  factor: RoadmapFactor;
  tasks: RoadmapTask[];
  weeks: ReturnType<typeof buildWeekColumns>;
  gridRow: number;
  onAddTask?: (factorId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onDeleteFactor?: (factorId: string) => void;
}) {
  const rowHeight = Math.max(
    64,
    tasks.reduce((height, task, i) => {
      const pos = getTaskBarPosition(task, weeks);
      const compact = pos ? pos.width < MIN_TASK_BAR_LABEL_WIDTH : false;
      return height + (compact ? 48 : 36);
    }, 14)
  );
  const factorColor = factor.color;

  return (
    <>
      <div
        className="sticky right-0 z-10 bg-theme-page border-b border-l border-theme-border px-4 py-4 flex flex-col justify-between group"
        style={{
          gridRow,
          gridColumn: 1,
          minHeight: rowHeight,
          borderRightWidth: 3,
          borderRightColor: factorColor,
        }}
      >
        <div className="flex items-start gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
            style={{ background: factorColor }}
          />
          <div>
            <p className="text-sm font-medium text-theme-text">{factor.name}</p>
            <p className="label-micro mt-1">{tasks.length} משימות</p>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onAddTask && (
            <button
              onClick={() => onAddTask(factor.id)}
              className="p-1 text-theme-muted hover:text-lambo-gold"
              title="הוסף משימה"
            >
              <Plus size={14} />
            </button>
          )}
          {onDeleteFactor && (
            <button
              onClick={() => {
                if (confirm(`למחוק את הגורם "${factor.name}" ואת כל המשימות שלו?`)) {
                  onDeleteFactor(factor.id);
                }
              }}
              className="p-1 text-theme-muted hover:text-lambo-gold"
              title="מחק גורם"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div
        className="relative border-b border-theme-border bg-theme-page/50 overflow-visible"
        style={{
          gridRow,
          gridColumn: `2 / span ${weeks.length}`,
          minHeight: rowHeight,
        }}
      >
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${weeks.length}, ${WEEK_COL_WIDTH}px)`,
          }}
        >
          {weeks.map((week) => (
            <div
              key={week.index}
              className="border-l border-theme-border/60 h-full"
            />
          ))}
        </div>

        {tasks.map((task, taskIndex) => {
          const position = getTaskBarPosition(task, weeks);
          if (!position) return null;

          let top = 12;
          for (let i = 0; i < taskIndex; i++) {
            const prev = getTaskBarPosition(tasks[i], weeks);
            top += prev && prev.width < MIN_TASK_BAR_LABEL_WIDTH ? 48 : 36;
          }

          return (
            <TaskBar
              key={task.id}
              task={task}
              position={position}
              top={top}
              factorColor={factorColor}
              onDelete={onDeleteTask}
            />
          );
        })}
      </div>
    </>
  );
}

function TaskBar({
  task,
  position,
  top,
  factorColor,
  onDelete,
}: {
  task: RoadmapTask;
  position: { right: number; width: number };
  top: number;
  factorColor: string;
  onDelete?: (taskId: string) => void;
}) {
  const compact = position.width < MIN_TASK_BAR_LABEL_WIDTH;
  const dateLabel = formatDateRange(task.startDate, task.endDate);

  return (
    <div
      className="absolute group/task"
      style={{
        top,
        right: position.right,
        width: Math.max(position.width, 6),
        height: compact ? 40 : 28,
      }}
    >
      {compact && (
        <div
          className="absolute bottom-[30px] right-0 z-10 whitespace-nowrap max-w-[280px] truncate px-2.5 py-1 text-xs font-medium shadow-sm"
          style={{
            background: "var(--surface)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRightWidth: 3,
            borderRightColor: factorColor,
          }}
        >
          {task.title}
        </div>
      )}

      <div
        className="absolute bottom-0 w-full h-[26px] flex items-center gap-1 overflow-hidden"
        style={{
          background: factorColor,
          borderRadius: 2,
          opacity: 0.92,
        }}
      >
        {!compact && (
          <span className="flex-1 min-w-0 truncate px-2 text-xs font-medium text-black leading-none">
            {task.title}
          </span>
        )}
        {compact && (
          <span className="sr-only">{task.title}</span>
        )}
      </div>

      <div
        className="absolute bottom-full right-0 mb-1 z-30 hidden group-hover/task:block pointer-events-none"
        style={{ minWidth: 140 }}
      >
        <div
          className="px-2.5 py-1.5 text-[10px] shadow-md border border-theme-border"
          style={{
            background: "var(--surface)",
            color: "var(--text)",
            borderRightWidth: 3,
            borderRightColor: factorColor,
          }}
        >
          <p className="font-medium leading-snug">{task.title}</p>
          <p className="text-theme-muted mt-0.5">{dateLabel}</p>
        </div>
      </div>

      {onDelete && (
        <button
          onClick={() => onDelete(task.id)}
          className="absolute -top-1 -left-1 z-20 p-0.5 rounded-sm opacity-0 group-hover/task:opacity-100 transition-opacity"
          style={{ background: "var(--surface)", color: factorColor }}
          title="מחק משימה"
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}
