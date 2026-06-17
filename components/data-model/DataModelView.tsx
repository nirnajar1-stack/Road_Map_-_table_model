"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { DbField, DbRelationship, RlsPolicy } from "@/lib/db-model";
import type { Project } from "@/lib/types";
import { normalizeProject } from "@/lib/types";
import {
  buildModelShareUrl,
  canEmbedModelInUrl,
  MODEL_SNAPSHOT_PARAM,
  readModelFromSearchParams,
} from "@/lib/model-snapshot";
import { hasDataModelContent } from "@/lib/db-model";
import { embedProjectPath, isEmbeddedFrame } from "@/lib/embed";
import { DataModelCanvas } from "./DataModelCanvas";
import { Modal } from "@/components/ProjectForm";
import {
  FieldForm,
  RelationshipForm,
  RlsPolicyForm,
  TableForm,
} from "./DataModelForms";

interface DataModelViewProps {
  project: Project;
  importModelSnapshot: (
    projectId: string,
    model: import("@/lib/db-model").DataModel,
    name?: string
  ) => void;
  addDbTable: (
    projectId: string,
    name: string,
    description: string,
    rlsEnabled: boolean,
    status?: import("@/lib/db-model").DbTableStatus
  ) => void;
  addDbField: (projectId: string, tableId: string, field: Omit<DbField, "id" | "order">) => void;
  addDbRelationship: (projectId: string, rel: Omit<DbRelationship, "id">) => void;
  addRlsPolicy: (projectId: string, policy: Omit<RlsPolicy, "id">) => void;
  deleteDbTable: (projectId: string, tableId: string) => void;
  deleteRlsPolicy: (projectId: string, policyId: string) => void;
  moveDbTable: (projectId: string, tableId: string, x: number, y: number) => void;
  updateDbTableStatus: (
    projectId: string,
    tableId: string,
    status: import("@/lib/db-model").DbTableStatus
  ) => void;
  updateDbTable: (
    projectId: string,
    tableId: string,
    updates: {
      name?: string;
      description?: string;
      rlsEnabled?: boolean;
      status?: import("@/lib/db-model").DbTableStatus;
      cardWidth?: number;
      bodyMaxHeight?: number;
      fieldsCollapsed?: boolean;
      pinned?: boolean;
    }
  ) => void;
  addTableLink: (
    projectId: string,
    link: { fromTableId: string; toTableId: string; label?: string }
  ) => void;
  deleteTableLink: (projectId: string, linkId: string) => void;
  addDbNote: (
    projectId: string,
    note: { text: string; position: { x: number; y: number }; tableId?: string }
  ) => void;
  updateDbNote: (projectId: string, noteId: string, text: string) => void;
  deleteDbNote: (projectId: string, noteId: string) => void;
  moveDbNote: (projectId: string, noteId: string, x: number, y: number) => void;
  /** מצב הטמעה (Notion / iframe) — הנתונים נטענים מה-URL */
  embedded?: boolean;
}

type ModalType = "table" | "field" | "relationship" | "rls" | null;

export function DataModelView(props: DataModelViewProps) {
  const { project, importModelSnapshot, embedded = false } = props;
  const model = normalizeProject(project).dataModel;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialModelEncoded = useRef(searchParams.get("model"));
  const snapshotLoaded = useRef(false);

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [fieldTableId, setFieldTableId] = useState<string | null>(null);
  const [rlsTableId, setRlsTableId] = useState<string | undefined>();
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  // טעינה מ-URL: ב-iframe/הטמעה תמיד; בדפדפן רגיל רק למודל ריק
  useEffect(() => {
    if (snapshotLoaded.current) return;
    snapshotLoaded.current = true;

    const inEmbed = embedded || isEmbeddedFrame();
    const encoded = searchParams.get(MODEL_SNAPSHOT_PARAM) ?? initialModelEncoded.current;
    const fromUrl = encoded
      ? readModelFromSearchParams(new URLSearchParams({ model: encoded }))
      : null;

    if (inEmbed) {
      if (fromUrl) {
        importModelSnapshot(project.id, fromUrl, project.name);
      }
      return;
    }

    if (hasDataModelContent(model)) return;
    if (fromUrl) {
      importModelSnapshot(project.id, fromUrl, project.name);
    }
  }, [project.id, project.name, importModelSnapshot, model, embedded, searchParams]);

  // עדכון ?model= ב-URL לשיתוף והטמעה (לא דורס localStorage ברענון רגיל)
  useEffect(() => {
    const inEmbed = embedded || isEmbeddedFrame();
    const sharePath = inEmbed ? embedProjectPath(project.id) : pathname;

    if (!canEmbedModelInUrl(model)) {
      if (!inEmbed) {
        const url = new URL(window.location.href);
        if (url.searchParams.has(MODEL_SNAPSHOT_PARAM)) {
          url.searchParams.delete(MODEL_SNAPSHOT_PARAM);
          window.history.replaceState(null, "", `${url.pathname}${url.search}`);
        }
      }
      return;
    }

    const nextUrl = buildModelShareUrl(sharePath, model);
    if (window.location.href !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [model, pathname, embedded, project.id]);

  const closeModal = () => {
    setModal(null);
    setFieldTableId(null);
    setRlsTableId(undefined);
  };

  const toggleTableStatus = (tableId: string) => {
    const table = model.tables.find((t) => t.id === tableId);
    if (!table) return;
    props.updateDbTableStatus(
      project.id,
      tableId,
      table.status === "new" ? "existing" : "new"
    );
  };

  const handleCopyShareLink = async () => {
    if (!canEmbedModelInUrl(model)) {
      setShareMessage("המודל גדול מדי לקישור — השתמש באותו דפדפן ודומיין");
      return;
    }
    const url = buildModelShareUrl(embedProjectPath(project.id), model);
    try {
      await navigator.clipboard.writeText(url);
      setShareMessage("קישור להטמעה ב-Notion הועתק! הדבק את הקישור המלא.");
    } catch {
      setShareMessage(url);
    }
    setTimeout(() => setShareMessage(null), 5000);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <div className="px-4 py-2 bg-lambo-gold/5 border-b border-theme-border text-xs text-theme-muted flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <span>
          {embedded
            ? "מצב הטמעה — הנתונים מגיעים מהקישור (?model=). לאחר עריכה לחץ שוב על \"שתף קישור\" ועדכן ב-Notion."
            : "השינויים נשמרים בדפדפן. להטמעה ב-Notion לחץ \"שתף קישור\" והדבק את הקישור המלא ב-Notion."}
        </span>
        {shareMessage && <span className="text-lambo-gold">{shareMessage}</span>}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
      <DataModelCanvas
        model={model}
        selectedTableId={selectedTableId}
        selectedNoteId={selectedNoteId}
        onSelectTable={setSelectedTableId}
        onSelectNote={setSelectedNoteId}
        onAddTable={() => setModal("table")}
        onAddField={(tableId) => {
          setFieldTableId(tableId);
          setModal("field");
        }}
        onAddRelationship={() => setModal("relationship")}
        onAddRls={(tableId) => {
          setRlsTableId(tableId);
          setModal("rls");
        }}
        onAddNote={() => {
          const x = 80 + model.notes.length * 24;
          const y = 80 + model.notes.length * 24;
          props.addDbNote(project.id, {
            text: "",
            position: { x, y },
            tableId: selectedTableId ?? undefined,
          });
        }}
        onCopyShareLink={handleCopyShareLink}
        onDeleteTable={(tableId) => {
          props.deleteDbTable(project.id, tableId);
          if (selectedTableId === tableId) setSelectedTableId(null);
        }}
        onDeleteRls={(policyId) => props.deleteRlsPolicy(project.id, policyId)}
        onDeleteTableLink={(linkId) => props.deleteTableLink(project.id, linkId)}
        onDeleteNote={(noteId) => {
          props.deleteDbNote(project.id, noteId);
          if (selectedNoteId === noteId) setSelectedNoteId(null);
        }}
        onMoveTable={(tableId, x, y) => props.moveDbTable(project.id, tableId, x, y)}
        onMoveNote={(noteId, x, y) => props.moveDbNote(project.id, noteId, x, y)}
        onAddTableLink={(from, to) =>
          props.addTableLink(project.id, { fromTableId: from, toTableId: to })
        }
        onToggleTableStatus={toggleTableStatus}
        onUpdateNote={(noteId, text) => props.updateDbNote(project.id, noteId, text)}
        onUpdateTable={(tableId, updates) =>
          props.updateDbTable(project.id, tableId, updates)
        }
      />
      </div>

      {modal === "table" && (
        <Modal title="טבלה חדשה" onClose={closeModal}>
          <TableForm
            onSubmit={(name, description, rlsEnabled, status) => {
              props.addDbTable(project.id, name, description, rlsEnabled, status);
              closeModal();
            }}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal === "field" && fieldTableId && (
        <Modal title="שדה חדש" onClose={closeModal}>
          <FieldForm
            onSubmit={(field) => {
              props.addDbField(project.id, fieldTableId, field);
              closeModal();
            }}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal === "relationship" && (
        <Modal title="קשר בין טבלאות" onClose={closeModal}>
          <RelationshipForm
            tables={model.tables}
            onSubmit={(rel) => {
              props.addDbRelationship(project.id, rel);
              closeModal();
            }}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal === "rls" && (
        <Modal title="מדיניות RLS" onClose={closeModal}>
          <RlsPolicyForm
            tables={model.tables}
            defaultTableId={rlsTableId}
            onSubmit={(policy) => {
              props.addRlsPolicy(project.id, policy);
              closeModal();
            }}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </div>
  );
}
