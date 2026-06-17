"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  deleteProject as removeProject,
  loadProjects,
  saveProjects,
  STORAGE_KEY,
} from "@/lib/storage";
import {
  createDefaultFields,
  defaultTablePosition,
  emptyDataModel,
  normalizeDataModel,
  type DataModel,
  type DbField,
  type DbNote,
  type DbRelationship,
  type DbTableStatus,
  type RlsPolicy,
  type TableLink,
} from "@/lib/db-model";
import type { Project } from "@/lib/types";
import { normalizeProject, PROJECT_COLORS } from "@/lib/types";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProjects(loadProjects());
    setLoaded(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setProjects(loadProjects());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: Project[]) => {
    setProjects(next);
    saveProjects(next);
  }, []);

  const touch = useCallback((project: Project): Project => {
    return { ...normalizeProject(project), updatedAt: new Date().toISOString() };
  }, []);

  const mutateProject = useCallback(
    (projectId: string, mutator: (project: Project) => Project | null) => {
      setProjects((prev) => {
        const raw = prev.find((p) => p.id === projectId);
        if (!raw) return prev;
        const result = mutator(normalizeProject(raw));
        if (!result) return prev;
        const normalized = touch(result);
        const next = prev.map((p) => (p.id === projectId ? normalized : p));
        saveProjects(next);
        return next;
      });
    },
    [touch]
  );

  const updateProject = useCallback(
    (project: Project) => {
      const normalized = touch(project);
      setProjects((prev) => {
        const next = prev.map((p) => (p.id === normalized.id ? normalized : p));
        saveProjects(next);
        return next;
      });
    },
    [touch]
  );

  const createProject = useCallback((name: string, description?: string) => {
    const now = new Date().toISOString();
    let created!: Project;
    setProjects((prev) => {
      const project: Project = {
        id: uuidv4(),
        name,
        description,
        color: PROJECT_COLORS[prev.length % PROJECT_COLORS.length],
        createdAt: now,
        updatedAt: now,
        dataModel: emptyDataModel(),
      };
      created = project;
      const next = [...prev, project];
      saveProjects(next);
      return next;
    });
    return created;
  }, []);

  const importModelSnapshot = useCallback(
    (projectId: string, model: DataModel, name = "מודל מיובא") => {
      setProjects((prev) => {
        const idx = prev.findIndex((p) => p.id === projectId);
        const now = new Date().toISOString();
        const base =
          idx >= 0
            ? normalizeProject(prev[idx])
            : normalizeProject({
                id: projectId,
                name,
                color: PROJECT_COLORS[prev.length % PROJECT_COLORS.length],
                createdAt: now,
                updatedAt: now,
                dataModel: emptyDataModel(),
              });
        const updated = touch({
          ...base,
          dataModel: normalizeDataModel(model),
        });
        const next =
          idx >= 0
            ? prev.map((p) => (p.id === projectId ? updated : p))
            : [...prev, updated];
        saveProjects(next);
        return next;
      });
    },
    [touch]
  );

  const deleteProject = useCallback((id: string) => {
    removeProject(id);
    setProjects(loadProjects());
  }, []);

  const addDbTable = useCallback(
    (
      projectId: string,
      name: string,
      description: string,
      rlsEnabled: boolean,
      status: DbTableStatus = "new"
    ) => {
      mutateProject(projectId, (project) => {
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
        return {
          ...project,
          dataModel: {
            ...project.dataModel,
            tables: [...project.dataModel.tables, table],
          },
        };
      });
    },
    [mutateProject]
  );

  const addDbField = useCallback(
    (projectId: string, tableId: string, field: Omit<DbField, "id" | "order">) => {
      mutateProject(projectId, (project) => {
        const table = project.dataModel.tables.find((t) => t.id === tableId);
        if (!table) return null;
        const newField: DbField = {
          ...field,
          id: uuidv4(),
          order: table.fields.length,
        };
        return {
          ...project,
          dataModel: {
            ...project.dataModel,
            tables: project.dataModel.tables.map((t) =>
              t.id === tableId ? { ...t, fields: [...t.fields, newField] } : t
            ),
          },
        };
      });
    },
    [mutateProject]
  );

  const addDbRelationship = useCallback(
    (projectId: string, rel: Omit<DbRelationship, "id">) => {
      mutateProject(projectId, (project) => ({
        ...project,
        dataModel: {
          ...project.dataModel,
          relationships: [...project.dataModel.relationships, { ...rel, id: uuidv4() }],
        },
      }));
    },
    [mutateProject]
  );

  const addRlsPolicy = useCallback(
    (projectId: string, policy: Omit<RlsPolicy, "id">) => {
      mutateProject(projectId, (project) => ({
        ...project,
        dataModel: {
          ...project.dataModel,
          rlsPolicies: [...project.dataModel.rlsPolicies, { ...policy, id: uuidv4() }],
        },
      }));
    },
    [mutateProject]
  );

  const deleteDbTable = useCallback(
    (projectId: string, tableId: string) => {
      mutateProject(projectId, (project) => ({
        ...project,
        dataModel: {
          ...project.dataModel,
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
      }));
    },
    [mutateProject]
  );

  const deleteRlsPolicy = useCallback(
    (projectId: string, policyId: string) => {
      mutateProject(projectId, (project) => ({
        ...project,
        dataModel: {
          ...project.dataModel,
          rlsPolicies: project.dataModel.rlsPolicies.filter((p) => p.id !== policyId),
        },
      }));
    },
    [mutateProject]
  );

  const moveDbTable = useCallback(
    (projectId: string, tableId: string, x: number, y: number) => {
      mutateProject(projectId, (project) => ({
        ...project,
        dataModel: {
          ...project.dataModel,
          tables: project.dataModel.tables.map((t) =>
            t.id === tableId ? { ...t, position: { x, y } } : t
          ),
        },
      }));
    },
    [mutateProject]
  );

  const updateDbTableStatus = useCallback(
    (projectId: string, tableId: string, status: DbTableStatus) => {
      mutateProject(projectId, (project) => ({
        ...project,
        dataModel: {
          ...project.dataModel,
          tables: project.dataModel.tables.map((t) =>
            t.id === tableId ? { ...t, status } : t
          ),
        },
      }));
    },
    [mutateProject]
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
        cardWidth?: number;
        bodyMaxHeight?: number;
        fieldsCollapsed?: boolean;
        pinned?: boolean;
      }
    ) => {
      mutateProject(projectId, (project) => ({
        ...project,
        dataModel: {
          ...project.dataModel,
          tables: project.dataModel.tables.map((t) =>
            t.id === tableId ? { ...t, ...updates } : t
          ),
        },
      }));
    },
    [mutateProject]
  );

  const addTableLink = useCallback(
    (projectId: string, link: Omit<TableLink, "id">) => {
      mutateProject(projectId, (project) => {
        const exists = project.dataModel.tableLinks.some(
          (l) =>
            (l.fromTableId === link.fromTableId && l.toTableId === link.toTableId) ||
            (l.fromTableId === link.toTableId && l.toTableId === link.fromTableId)
        );
        if (exists) return null;
        return {
          ...project,
          dataModel: {
            ...project.dataModel,
            tableLinks: [...project.dataModel.tableLinks, { ...link, id: uuidv4() }],
          },
        };
      });
    },
    [mutateProject]
  );

  const deleteTableLink = useCallback(
    (projectId: string, linkId: string) => {
      mutateProject(projectId, (project) => ({
        ...project,
        dataModel: {
          ...project.dataModel,
          tableLinks: project.dataModel.tableLinks.filter((l) => l.id !== linkId),
        },
      }));
    },
    [mutateProject]
  );

  const addDbNote = useCallback(
    (projectId: string, note: Omit<DbNote, "id">) => {
      mutateProject(projectId, (project) => ({
        ...project,
        dataModel: {
          ...project.dataModel,
          notes: [...project.dataModel.notes, { ...note, id: uuidv4() }],
        },
      }));
    },
    [mutateProject]
  );

  const updateDbNote = useCallback(
    (projectId: string, noteId: string, text: string) => {
      mutateProject(projectId, (project) => ({
        ...project,
        dataModel: {
          ...project.dataModel,
          notes: project.dataModel.notes.map((n) =>
            n.id === noteId ? { ...n, text } : n
          ),
        },
      }));
    },
    [mutateProject]
  );

  const deleteDbNote = useCallback(
    (projectId: string, noteId: string) => {
      mutateProject(projectId, (project) => ({
        ...project,
        dataModel: {
          ...project.dataModel,
          notes: project.dataModel.notes.filter((n) => n.id !== noteId),
        },
      }));
    },
    [mutateProject]
  );

  const moveDbNote = useCallback(
    (projectId: string, noteId: string, x: number, y: number) => {
      mutateProject(projectId, (project) => ({
        ...project,
        dataModel: {
          ...project.dataModel,
          notes: project.dataModel.notes.map((n) =>
            n.id === noteId ? { ...n, position: { x, y } } : n
          ),
        },
      }));
    },
    [mutateProject]
  );

  return {
    projects,
    loaded,
    createProject,
    updateProject,
    deleteProject,
    importModelSnapshot,
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
