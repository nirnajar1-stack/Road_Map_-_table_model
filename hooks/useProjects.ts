"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  deleteProject as removeProject,
  loadProjects,
  saveProjects,
  upsertProject,
} from "@/lib/storage";
import {
  createDefaultFields,
  defaultTablePosition,
  emptyDataModel,
  type DbField,
  type DbNote,
  type DbRelationship,
  type DbTableStatus,
  type RlsPolicy,
  type TableLink,
} from "@/lib/db-model";
import type {
  Milestone,
  Project,
  RoadmapFactor,
  RoadmapTask,
  Stage,
} from "@/lib/types";
import { normalizeProject, PROJECT_COLORS, getFactorColor } from "@/lib/types";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProjects(loadProjects());
    setLoaded(true);
  }, []);

  const persist = useCallback((next: Project[]) => {
    setProjects(next);
    saveProjects(next);
  }, []);

  const touch = useCallback((project: Project): Project => {
    return { ...normalizeProject(project), updatedAt: new Date().toISOString() };
  }, []);

  const createProject = useCallback(
    (name: string, description?: string) => {
      const now = new Date().toISOString();
      const project: Project = {
        id: uuidv4(),
        name,
        description,
        color: PROJECT_COLORS[projects.length % PROJECT_COLORS.length],
        createdAt: now,
        updatedAt: now,
        stages: [],
        factors: [],
        tasks: [],
        dataModel: emptyDataModel(),
      };
      const next = [...projects, project];
      persist(next);
      return project;
    },
    [projects, persist]
  );

  const updateProject = useCallback(
    (project: Project) => {
      const next = projects.map((p) =>
        p.id === project.id ? touch(project) : p
      );
      persist(next);
    },
    [projects, persist, touch]
  );

  const deleteProject = useCallback(
    (id: string) => {
      removeProject(id);
      setProjects(loadProjects());
    },
    []
  );

  const addStage = useCallback(
    (projectId: string, stage: Omit<Stage, "id" | "order" | "milestones">) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const newStage: Stage = {
        ...stage,
        id: uuidv4(),
        order: project.stages.length,
        milestones: [],
      };
      updateProject({
        ...project,
        stages: [...project.stages, newStage],
      });
    },
    [projects, updateProject]
  );

  const updateStage = useCallback(
    (projectId: string, stage: Stage) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      updateProject({
        ...project,
        stages: project.stages.map((s) => (s.id === stage.id ? stage : s)),
      });
    },
    [projects, updateProject]
  );

  const deleteStage = useCallback(
    (projectId: string, stageId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      updateProject({
        ...project,
        stages: project.stages
          .filter((s) => s.id !== stageId)
          .map((s, i) => ({ ...s, order: i })),
      });
    },
    [projects, updateProject]
  );

  const addMilestone = useCallback(
    (
      projectId: string,
      stageId: string,
      milestone: Omit<Milestone, "id" | "order">
    ) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const stage = project.stages.find((s) => s.id === stageId);
      if (!stage) return;

      const newMilestone: Milestone = {
        ...milestone,
        id: uuidv4(),
        order: stage.milestones.length,
      };
      updateStage(projectId, {
        ...stage,
        milestones: [...stage.milestones, newMilestone],
      });
    },
    [projects, updateStage]
  );

  const deleteMilestone = useCallback(
    (projectId: string, stageId: string, milestoneId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const stage = project.stages.find((s) => s.id === stageId);
      if (!stage) return;

      updateStage(projectId, {
        ...stage,
        milestones: stage.milestones
          .filter((m) => m.id !== milestoneId)
          .map((m, i) => ({ ...m, order: i })),
      });
    },
    [projects, updateStage]
  );

  const addFactor = useCallback(
    (projectId: string, name: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const normalized = normalizeProject(project);
      if (normalized.factors.some((f) => f.name === name)) return;

      const factor: RoadmapFactor = {
        id: uuidv4(),
        name,
        order: normalized.factors.length,
        color: getFactorColor(normalized.factors.length),
      };
      updateProject({
        ...normalized,
        factors: [...normalized.factors, factor],
      });
    },
    [projects, updateProject]
  );

  const deleteFactor = useCallback(
    (projectId: string, factorId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      updateProject({
        ...project,
        factors: project.factors
          .filter((f) => f.id !== factorId)
          .map((f, i) => ({ ...f, order: i })),
        tasks: project.tasks.filter((t) => t.factorId !== factorId),
      });
    },
    [projects, updateProject]
  );

  const addTask = useCallback(
    (projectId: string, task: Omit<RoadmapTask, "id">) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const normalized = normalizeProject(project);

      const newTask: RoadmapTask = {
        ...task,
        id: uuidv4(),
      };
      updateProject({
        ...normalized,
        tasks: [...normalized.tasks, newTask],
      });
    },
    [projects, updateProject]
  );

  const deleteTask = useCallback(
    (projectId: string, taskId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      updateProject({
        ...project,
        tasks: project.tasks.filter((t) => t.id !== taskId),
      });
    },
    [projects, updateProject]
  );

  const addDbTable = useCallback(
    (
      projectId: string,
      name: string,
      description: string,
      rlsEnabled: boolean,
      status: DbTableStatus = "new"
    ) => {
      const raw = projects.find((p) => p.id === projectId);
      if (!raw) return;
      const project = normalizeProject(raw);
      const fields = createDefaultFields().map((f, i) => ({
        ...f,
        id: uuidv4(),
        order: i,
      }));
      const table = {
        id: uuidv4(),
        name,
        description: description || undefined,
        fields,
        position: defaultTablePosition(project.dataModel.tables.length),
        order: project.dataModel.tables.length,
        rlsEnabled,
        status,
      };
      updateProject({
        ...project,
        dataModel: {
          ...project.dataModel,
          tables: [...project.dataModel.tables, table],
        },
      });
    },
    [projects, updateProject]
  );

  const addDbField = useCallback(
    (projectId: string, tableId: string, field: Omit<DbField, "id" | "order">) => {
      const raw = projects.find((p) => p.id === projectId);
      if (!raw) return;
      const project = normalizeProject(raw);
      const table = project.dataModel.tables.find((t) => t.id === tableId);
      if (!table) return;
      const newField: DbField = {
        ...field,
        id: uuidv4(),
        order: table.fields.length,
      };
      updateProject({
        ...project,
        dataModel: {
          ...project.dataModel,
          tables: project.dataModel.tables.map((t) =>
            t.id === tableId ? { ...t, fields: [...t.fields, newField] } : t
          ),
        },
      });
    },
    [projects, updateProject]
  );

  const addDbRelationship = useCallback(
    (projectId: string, rel: Omit<DbRelationship, "id">) => {
      const raw = projects.find((p) => p.id === projectId);
      if (!raw) return;
      const project = normalizeProject(raw);
      updateProject({
        ...project,
        dataModel: {
          ...project.dataModel,
          relationships: [
            ...project.dataModel.relationships,
            { ...rel, id: uuidv4() },
          ],
        },
      });
    },
    [projects, updateProject]
  );

  const addRlsPolicy = useCallback(
    (projectId: string, policy: Omit<RlsPolicy, "id">) => {
      const raw = projects.find((p) => p.id === projectId);
      if (!raw) return;
      const project = normalizeProject(raw);
      updateProject({
        ...project,
        dataModel: {
          ...project.dataModel,
          rlsPolicies: [
            ...project.dataModel.rlsPolicies,
            { ...policy, id: uuidv4() },
          ],
        },
      });
    },
    [projects, updateProject]
  );

  const deleteDbTable = useCallback(
    (projectId: string, tableId: string) => {
      const raw = projects.find((p) => p.id === projectId);
      if (!raw) return;
      const project = normalizeProject(raw);
      updateProject({
        ...project,
        dataModel: {
          tables: project.dataModel.tables.filter((t) => t.id !== tableId),
          relationships: project.dataModel.relationships.filter(
            (r) => r.fromTableId !== tableId && r.toTableId !== tableId
          ),
          rlsPolicies: project.dataModel.rlsPolicies.filter((p) => p.tableId !== tableId),
          tableLinks: project.dataModel.tableLinks.filter(
            (l) => l.fromTableId !== tableId && l.toTableId !== tableId
          ),
          notes: project.dataModel.notes.filter((n) => n.tableId !== tableId),
        },
      });
    },
    [projects, updateProject]
  );

  const deleteRlsPolicy = useCallback(
    (projectId: string, policyId: string) => {
      const raw = projects.find((p) => p.id === projectId);
      if (!raw) return;
      const project = normalizeProject(raw);
      updateProject({
        ...project,
        dataModel: {
          ...project.dataModel,
          rlsPolicies: project.dataModel.rlsPolicies.filter((p) => p.id !== policyId),
        },
      });
    },
    [projects, updateProject]
  );

  const moveDbTable = useCallback(
    (projectId: string, tableId: string, x: number, y: number) => {
      const raw = projects.find((p) => p.id === projectId);
      if (!raw) return;
      const project = normalizeProject(raw);
      updateProject({
        ...project,
        dataModel: {
          ...project.dataModel,
          tables: project.dataModel.tables.map((t) =>
            t.id === tableId ? { ...t, position: { x, y } } : t
          ),
        },
      });
    },
    [projects, updateProject]
  );

  const updateDbTableStatus = useCallback(
    (projectId: string, tableId: string, status: DbTableStatus) => {
      const raw = projects.find((p) => p.id === projectId);
      if (!raw) return;
      const project = normalizeProject(raw);
      updateProject({
        ...project,
        dataModel: {
          ...project.dataModel,
          tables: project.dataModel.tables.map((t) =>
            t.id === tableId ? { ...t, status } : t
          ),
        },
      });
    },
    [projects, updateProject]
  );

  const updateDbTable = useCallback(
    (
      projectId: string,
      tableId: string,
      updates: {
        name?: string;
        description?: string;
        rlsEnabled?: boolean;
        status?: DbTableStatus;
      }
    ) => {
      const raw = projects.find((p) => p.id === projectId);
      if (!raw) return;
      const project = normalizeProject(raw);
      updateProject({
        ...project,
        dataModel: {
          ...project.dataModel,
          tables: project.dataModel.tables.map((t) =>
            t.id === tableId ? { ...t, ...updates } : t
          ),
        },
      });
    },
    [projects, updateProject]
  );

  const addTableLink = useCallback(
    (projectId: string, link: Omit<TableLink, "id">) => {
      const raw = projects.find((p) => p.id === projectId);
      if (!raw) return;
      const project = normalizeProject(raw);
      const exists = project.dataModel.tableLinks.some(
        (l) =>
          (l.fromTableId === link.fromTableId && l.toTableId === link.toTableId) ||
          (l.fromTableId === link.toTableId && l.toTableId === link.fromTableId)
      );
      if (exists) return;
      updateProject({
        ...project,
        dataModel: {
          ...project.dataModel,
          tableLinks: [...project.dataModel.tableLinks, { ...link, id: uuidv4() }],
        },
      });
    },
    [projects, updateProject]
  );

  const deleteTableLink = useCallback(
    (projectId: string, linkId: string) => {
      const raw = projects.find((p) => p.id === projectId);
      if (!raw) return;
      const project = normalizeProject(raw);
      updateProject({
        ...project,
        dataModel: {
          ...project.dataModel,
          tableLinks: project.dataModel.tableLinks.filter((l) => l.id !== linkId),
        },
      });
    },
    [projects, updateProject]
  );

  const addDbNote = useCallback(
    (projectId: string, note: Omit<DbNote, "id">) => {
      const raw = projects.find((p) => p.id === projectId);
      if (!raw) return;
      const project = normalizeProject(raw);
      updateProject({
        ...project,
        dataModel: {
          ...project.dataModel,
          notes: [...project.dataModel.notes, { ...note, id: uuidv4() }],
        },
      });
    },
    [projects, updateProject]
  );

  const updateDbNote = useCallback(
    (projectId: string, noteId: string, text: string) => {
      const raw = projects.find((p) => p.id === projectId);
      if (!raw) return;
      const project = normalizeProject(raw);
      updateProject({
        ...project,
        dataModel: {
          ...project.dataModel,
          notes: project.dataModel.notes.map((n) =>
            n.id === noteId ? { ...n, text } : n
          ),
        },
      });
    },
    [projects, updateProject]
  );

  const deleteDbNote = useCallback(
    (projectId: string, noteId: string) => {
      const raw = projects.find((p) => p.id === projectId);
      if (!raw) return;
      const project = normalizeProject(raw);
      updateProject({
        ...project,
        dataModel: {
          ...project.dataModel,
          notes: project.dataModel.notes.filter((n) => n.id !== noteId),
        },
      });
    },
    [projects, updateProject]
  );

  const moveDbNote = useCallback(
    (projectId: string, noteId: string, x: number, y: number) => {
      const raw = projects.find((p) => p.id === projectId);
      if (!raw) return;
      const project = normalizeProject(raw);
      updateProject({
        ...project,
        dataModel: {
          ...project.dataModel,
          notes: project.dataModel.notes.map((n) =>
            n.id === noteId ? { ...n, position: { x, y } } : n
          ),
        },
      });
    },
    [projects, updateProject]
  );

  return {
    projects,
    loaded,
    createProject,
    updateProject,
    deleteProject,
    addStage,
    updateStage,
    deleteStage,
    addMilestone,
    deleteMilestone,
    addFactor,
    deleteFactor,
    addTask,
    deleteTask,
    addDbTable,
    addDbField,
    addDbRelationship,
    addRlsPolicy,
    deleteDbTable,
    deleteRlsPolicy,
    moveDbTable,
    updateDbTableStatus,
    updateDbTable,
    addTableLink,
    deleteTableLink,
    addDbNote,
    updateDbNote,
    deleteDbNote,
    moveDbNote,
  };
}
