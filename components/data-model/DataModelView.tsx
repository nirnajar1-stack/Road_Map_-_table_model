"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { DbField, DbRelationship, RlsPolicy } from "@/lib/db-model";
import type { Project } from "@/lib/types";
import { normalizeProject } from "@/lib/types";
import {
  buildModelShareUrl,
  canEmbedModelInUrl,
  readModelFromSearchParams,
} from "@/lib/model-snapshot";
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
}

type ModalType = "table" | "field" | "relationship" | "rls" | null;

export function DataModelView(props: DataModelViewProps) {
  const { project, importModelSnapshot } = props;
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

  // טעינת מודל מקישור (?model=...) בכניסה ראשונה בלבד
  useEffect(() => {
    if (snapshotLoaded.current) return;
    const encoded = initialModelEncoded.current;
    if (!encoded) return;
    const fromUrl = readModelFromSearchParams(
      new URLSearchParams({ model: encoded })
    );
    if (!fromUrl) return;
    snapshotLoaded.current = true;
    importModelSnapshot(project.id, fromUrl, project.name);
  }, [project.id, project.name, importModelSnapshot]);

  // סנכרון המודל ל-URL כדי שהקישור יכלול את הנתונים
  useEffect(() => {
    if (!canEmbedModelInUrl(model)) return;
    const nextUrl = buildModelShareUrl(pathname, model);
    if (window.location.href !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [model, pathname]);

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
    const url = buildModelShareUrl(pathname, model);
    try {
      await navigator.clipboard.writeText(url);
      setShareMessage("הקישור עם הנתונים הועתק!");
    } catch {
      setShareMessage(url);
    }
    setTimeout(() => setShareMessage(null), 4000);
  };

  return (
    <>
      <div className="px-4 py-2 bg-lambo-gold/5 border-b border-theme-border text-xs text-theme-muted flex flex-wrap items-center justify-between gap-2">
        <span>
          הנתונים נשמרים בדפדפן + בקישור. לאותו מחשב/דפדפן — פשוט חזור לקישור. לשיתוף — העתק קישור עם נתונים.
        </span>
        {shareMessage && <span className="text-lambo-gold">{shareMessage}</span>}
      </div>

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
    </>
  );
}
