"use client";

import type { Project } from "@/lib/types";
import { RoadmapGrid } from "./RoadmapGrid";

interface RoadmapTimelineProps {
  project: Project;
  onAddFactor?: () => void;
  onAddTask?: (factorId?: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onDeleteFactor?: (factorId: string) => void;
}

export function RoadmapTimeline({
  project,
  onAddFactor,
  onAddTask,
  onDeleteTask,
  onDeleteFactor,
}: RoadmapTimelineProps) {
  return (
    <RoadmapGrid
      project={project}
      onAddFactor={onAddFactor}
      onAddTask={onAddTask}
      onDeleteTask={onDeleteTask}
      onDeleteFactor={onDeleteFactor}
    />
  );
}
