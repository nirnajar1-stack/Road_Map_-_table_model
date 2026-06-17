"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import {
  Database,
  Link2,
  MessageSquarePlus,
  MousePointer2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Share2,
  Shield,
  Table2,
  Unlink,
} from "lucide-react";
import type { DataModel, DbTable } from "@/lib/db-model";
import {
  getTableWidth,
  canvasSize,
  getFieldAnchor,
  getFieldAnchorTarget,
  tableLinkPath,
} from "@/lib/db-model";
import { TableCard } from "./TableCard";
import { NoteCard } from "./NoteCard";
import { RlsPolicyList } from "./RlsPolicyList";

interface DataModelCanvasProps {
  model: DataModel;
  selectedTableId: string | null;
  selectedNoteId: string | null;
  onSelectTable: (id: string | null) => void;
  onSelectNote: (id: string | null) => void;
  onAddTable: () => void;
  onAddField: (tableId: string) => void;
  onAddRelationship: () => void;
  onAddRls: (tableId?: string) => void;
  onAddNote: () => void;
  onCopyShareLink: () => void;
  onDeleteTable: (tableId: string) => void;
  onDeleteRls: (policyId: string) => void;
  onDeleteTableLink: (linkId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onMoveTable: (tableId: string, x: number, y: number) => void;
  onMoveNote: (noteId: string, x: number, y: number) => void;
  onAddTableLink: (fromTableId: string, toTableId: string) => void;
  onToggleTableStatus: (tableId: string) => void;
  onUpdateNote: (noteId: string, text: string) => void;
  onUpdateTable: (
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
}

type DragTarget =
  | { kind: "table"; tableId: string; offsetX: number; offsetY: number }
  | { kind: "note"; noteId: string; offsetX: number; offsetY: number };

export function DataModelCanvas({
  model,
  selectedTableId,
  selectedNoteId,
  onSelectTable,
  onSelectNote,
  onAddTable,
  onAddField,
  onAddRelationship,
  onAddRls,
  onAddNote,
  onCopyShareLink,
  onDeleteTable,
  onDeleteRls,
  onDeleteTableLink,
  onDeleteNote,
  onMoveTable,
  onMoveNote,
  onAddTableLink,
  onToggleTableStatus,
  onUpdateNote,
  onUpdateTable,
}: DataModelCanvasProps) {
  const [dragging, setDragging] = useState<DragTarget | null>(null);
  const [livePosition, setLivePosition] = useState<{ x: number; y: number } | null>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{
    kind: "table" | "note";
    id: string;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const DRAG_THRESHOLD = 5;

  const tables = useMemo(() => {
    return [...model.tables]
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return 1;
        if (!a.pinned && b.pinned) return -1;
        return a.order - b.order;
      })
      .map((table) => {
        if (dragging?.kind === "table" && dragging.tableId === table.id && livePosition) {
          return { ...table, position: livePosition };
        }
        return table;
      });
  }, [model.tables, dragging, livePosition]);

  const getTableZIndex = (table: DbTable) => {
    if (dragging?.kind === "table" && dragging.tableId === table.id) return 50;
    if (table.pinned) return 60;
    if (selectedTableId === table.id) return 40;
    return 10;
  };

  const notes = useMemo(() => {
    return model.notes.map((note) => {
      if (dragging?.kind === "note" && dragging.noteId === note.id && livePosition) {
        return { ...note, position: livePosition };
      }
      return note;
    });
  }, [model.notes, dragging, livePosition]);

  const draggingRef = useRef(dragging);
  const livePositionRef = useRef(livePosition);
  draggingRef.current = dragging;
  livePositionRef.current = livePosition;

  const getCanvasPoint = (clientX: number, clientY: number) => {
    const scrollEl = scrollRef.current;
    const innerEl = innerRef.current;
    if (!scrollEl || !innerEl) return { x: 0, y: 0 };
    const rect = innerEl.getBoundingClientRect();
    return {
      x: clientX - rect.left + scrollEl.scrollLeft,
      y: clientY - rect.top + scrollEl.scrollTop,
    };
  };

  const finishDrag = () => {
    const activeDrag = draggingRef.current;
    const activePos = livePositionRef.current;
    if (activeDrag && activePos) {
      if (activeDrag.kind === "table") {
        onMoveTable(activeDrag.tableId, activePos.x, activePos.y);
      } else {
        onMoveNote(activeDrag.noteId, activePos.x, activePos.y);
      }
    }
    pointerRef.current = null;
    setDragging(null);
    setLivePosition(null);
  };

  useEffect(() => {
    const onWindowPointerMove = (e: PointerEvent) => {
      const p = pointerRef.current;
      if (!p) return;
      const pt = getCanvasPoint(e.clientX, e.clientY);
      const dx = pt.x - p.startX;
      const dy = pt.y - p.startY;
      const isDrag = Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD;

      if (!draggingRef.current && isDrag) {
        const next: DragTarget =
          p.kind === "table"
            ? {
                kind: "table",
                tableId: p.id,
                offsetX: p.offsetX,
                offsetY: p.offsetY,
              }
            : {
                kind: "note",
                noteId: p.id,
                offsetX: p.offsetX,
                offsetY: p.offsetY,
              };
        draggingRef.current = next;
        setDragging(next);
      }

      if (draggingRef.current || isDrag) {
        const pos = {
          x: Math.max(0, pt.x - p.offsetX),
          y: Math.max(0, pt.y - p.offsetY),
        };
        livePositionRef.current = pos;
        setLivePosition(pos);
      }
    };

    const onWindowPointerEnd = () => {
      if (pointerRef.current) finishDrag();
    };

    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerEnd);
    window.addEventListener("pointercancel", onWindowPointerEnd);
    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerEnd);
      window.removeEventListener("pointercancel", onWindowPointerEnd);
    };
  }, [onMoveTable, onMoveNote]);

  const [viewportSize, setViewportSize] = useState({ width: 1400, height: 800 });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setViewportSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [detailsPanelOpen]);

  const canvasDimensions = useMemo(() => {
    const base = canvasSize(tables, notes);
    return {
      width: Math.max(base.width, viewportSize.width),
      height: Math.max(base.height, viewportSize.height),
    };
  }, [tables, notes, viewportSize]);

  const handleCanvasBackgroundClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-canvas-item]")) return;
    onSelectTable(null);
    onSelectNote(null);
    if (connectMode) setConnectFromId(null);
  };

  const fkFieldIds = useMemo(() => {
    const ids = new Set<string>();
    model.relationships.forEach((r) => ids.add(r.fromFieldId));
    return ids;
  }, [model.relationships]);

  const fkPaths = useMemo(() => {
    return model.relationships
      .map((rel) => {
        const fromTable = tables.find((t) => t.id === rel.fromTableId);
        const toTable = tables.find((t) => t.id === rel.toTableId);
        if (!fromTable || !toTable) return null;
        const from = getFieldAnchor(fromTable, rel.fromFieldId);
        const to = getFieldAnchorTarget(toTable, rel.toFieldId);
        if (!from || !to) return null;
        const midX = (from.x + to.x) / 2;
        return {
          id: rel.id,
          d: `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`,
          kind: "fk" as const,
        };
      })
      .filter(Boolean) as { id: string; d: string; kind: "fk" }[];
  }, [model.relationships, tables]);

  const linkPaths = useMemo(() => {
    return model.tableLinks
      .map((link) => {
        const from = tables.find((t) => t.id === link.fromTableId);
        const to = tables.find((t) => t.id === link.toTableId);
        if (!from || !to) return null;
        return {
          id: link.id,
          d: tableLinkPath(from, to),
          label: link.label,
          kind: "table" as const,
        };
      })
      .filter(Boolean) as { id: string; d: string; label?: string; kind: "table" }[];
  }, [model.tableLinks, tables]);

  const handleTablePointerDown = (e: React.PointerEvent, table: DbTable) => {
    if ((e.target as HTMLElement).closest("button, textarea")) return;

    if (connectMode) {
      e.stopPropagation();
      if (!connectFromId) {
        setConnectFromId(table.id);
        onSelectTable(table.id);
      } else if (connectFromId !== table.id) {
        onAddTableLink(connectFromId, table.id);
        setConnectFromId(null);
      }
      return;
    }

    e.stopPropagation();
    onSelectTable(table.id);
    onSelectNote(null);
    const pt = getCanvasPoint(e.clientX, e.clientY);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointerRef.current = {
      kind: "table",
      id: table.id,
      offsetX: pt.x - table.position.x,
      offsetY: pt.y - table.position.y,
      startX: pt.x,
      startY: pt.y,
    };
  };

  const handleNotePointerDown = (e: React.PointerEvent, noteId: string) => {
    if ((e.target as HTMLElement).closest("button, textarea")) return;
    e.stopPropagation();
    const note = model.notes.find((n) => n.id === noteId);
    if (!note) return;
    const pt = getCanvasPoint(e.clientX, e.clientY);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onSelectNote(noteId);
    onSelectTable(null);
    pointerRef.current = {
      kind: "note",
      id: noteId,
      offsetX: pt.x - note.position.x,
      offsetY: pt.y - note.position.y,
      startX: pt.x,
      startY: pt.y,
    };
  };

  const exitConnectMode = () => {
    setConnectMode(false);
    setConnectFromId(null);
  };

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 schema-canvas-empty">
        <Database size={40} className="mb-4 opacity-25 text-lambo-gold" />
        <p className="heading-display text-base text-white/80">אין טבלאות במודל</p>
        <p className="label-micro mt-2 mb-6 text-white/40">
          הוסף טבלאות, קשרים, הודעות ומדיניות RLS
        </p>
        <button onClick={onAddTable} className="btn-gold-sm">
          <Plus size={16} />
          הוסף טבלה ראשונה
        </button>
      </div>
    );
  }

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  return (
    <div className="flex flex-col lg:flex-row w-full h-full min-h-[calc(100vh-220px)]">
      <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-l border-theme-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border gap-2 flex-wrap bg-theme-surface">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="label-caption">
              {tables.length} טבלאות · {model.tableLinks.length} קווים ·{" "}
              {model.relationships.length} FK · {model.notes.length} הודעות
            </p>
            <div className="flex items-center gap-3 text-[10px] text-theme-muted">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> חדשה
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-lambo-gold" /> קיימת
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={onCopyShareLink} className="btn-ghost-sm !opacity-100" title="העתק קישור עם כל הנתונים">
              <Share2 size={14} /> שתף קישור
            </button>
            <button
              onClick={() => (connectMode ? exitConnectMode() : setConnectMode(true))}
              className={`btn-ghost-sm !opacity-100 ${connectMode ? "!bg-lambo-gold/20 !text-lambo-gold" : ""}`}
              title="לחץ על שתי טבלאות כדי לחבר קו"
            >
              {connectMode ? <Unlink size={14} /> : <Link2 size={14} />}
              {connectMode ? "בטל חיבור" : "חבר קו"}
            </button>
            <button onClick={onAddNote} className="btn-ghost-sm !opacity-100">
              <MessageSquarePlus size={14} /> הודעה
            </button>
            <button onClick={onAddTable} className="btn-ghost-sm !opacity-100">
              <Table2 size={14} /> טבלה
            </button>
            <button onClick={onAddRelationship} className="btn-ghost-sm !opacity-100">
              <Link2 size={14} /> FK
            </button>
            <button onClick={() => onAddRls()} className="btn-gold-sm">
              <Shield size={14} /> RLS
            </button>
          </div>
        </div>

        {connectMode && (
          <div className="px-4 py-2 bg-lambo-gold/10 border-b border-lambo-gold/30 text-xs text-lambo-gold flex items-center gap-2">
            <MousePointer2 size={14} />
            {connectFromId
              ? "לחץ על טבלת יעד לחיבור קו"
              : "לחץ על טבלת מקור, ואז על טבלת יעד"}
          </div>
        )}

        <div
          ref={scrollRef}
          className="relative overflow-auto flex-1 min-h-[560px] schema-canvas"
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onClick={handleCanvasBackgroundClick}
        >
          <div
            ref={innerRef}
            className="relative schema-canvas-inner"
            style={{ width: canvasDimensions.width, height: canvasDimensions.height }}
          >
            <svg
              className="absolute inset-0 pointer-events-none z-0"
              width={canvasDimensions.width}
              height={canvasDimensions.height}
            >
              <defs>
                <marker
                  id="arrow-fk"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L6,3 L0,6 Z" fill="rgba(41,171,226,0.7)" />
                </marker>
                <marker
                  id="arrow-link"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,192,0,0.8)" />
                </marker>
              </defs>

              {linkPaths.map((p) => (
                <g key={p.id}>
                  <path d={p.d} className="schema-link-glow" />
                  <path d={p.d} className="schema-link-base" markerEnd="url(#arrow-link)" />
                  <path d={p.d} className="schema-link-flow" />
                </g>
              ))}

              {fkPaths.map((p) => (
                <g key={p.id}>
                  <path d={p.d} className="schema-fk-glow" />
                  <path d={p.d} className="schema-fk-flow" markerEnd="url(#arrow-fk)" />
                </g>
              ))}
            </svg>

            {tables.map((table) => (
              <div
                key={table.id}
                data-canvas-item
                className={`absolute touch-none select-none ${
                  dragging?.kind === "table" && dragging.tableId === table.id
                    ? "cursor-grabbing"
                    : connectMode
                      ? "cursor-crosshair"
                      : "cursor-grab"
                }`}
                style={{
                  left: table.position.x,
                  top: table.position.y,
                  width: getTableWidth(table),
                  zIndex: getTableZIndex(table),
                }}
                onPointerDown={(e) => handleTablePointerDown(e, table)}
                onClick={(e) => e.stopPropagation()}
              >
                <TableCard
                  table={table}
                  policies={model.rlsPolicies.filter((p) => p.tableId === table.id)}
                  relationshipFieldIds={fkFieldIds}
                  selected={selectedTableId === table.id}
                  connectHighlight={connectFromId === table.id}
                  onAddField={() => onAddField(table.id)}
                  onAddRls={() => onAddRls(table.id)}
                  onDelete={() => onDeleteTable(table.id)}
                  onToggleStatus={() => onToggleTableStatus(table.id)}
                  onUpdateLayout={(updates) => onUpdateTable(table.id, updates)}
                />
              </div>
            ))}

            {notes.map((note) => (
              <div
                key={note.id}
                data-canvas-item
                className={`absolute touch-none select-none ${
                  dragging?.kind === "note" && dragging.noteId === note.id
                    ? "cursor-grabbing z-50"
                    : "cursor-grab z-30"
                }`}
                style={{
                  left: note.position.x,
                  top: note.position.y,
                }}
                onPointerDown={(e) => handleNotePointerDown(e, note.id)}
                onClick={(e) => e.stopPropagation()}
              >
                <NoteCard
                  note={note}
                  selected={selectedNoteId === note.id}
                  onUpdate={(text) => onUpdateNote(note.id, text)}
                  onDelete={() => onDeleteNote(note.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {detailsPanelOpen ? (
        <aside className="schema-details-panel w-full lg:w-80 flex-shrink-0 bg-theme-surface border-t lg:border-t-0 lg:border-r border-theme-border flex flex-col max-h-[70vh] lg:max-h-none lg:min-h-[560px]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-theme-border flex-shrink-0">
            <p className="label-caption">פרטים</p>
            <button
              type="button"
              onClick={() => setDetailsPanelOpen(false)}
              className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-raised transition-colors"
              title="מזער פאנל"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
          <div className="p-4 overflow-y-auto flex-1">
            {selectedTable ? (
              <TableDetails
                table={selectedTable}
                policies={model.rlsPolicies.filter((p) => p.tableId === selectedTable.id)}
                tableLinks={model.tableLinks.filter(
                  (l) => l.fromTableId === selectedTable.id || l.toTableId === selectedTable.id
                )}
                allTables={tables}
                onAddRls={() => onAddRls(selectedTable.id)}
                onDeleteRls={onDeleteRls}
                onDeleteTableLink={onDeleteTableLink}
                onUpdate={(updates) => onUpdateTable(selectedTable.id, updates)}
              />
            ) : selectedNote ? (
              <div className="space-y-3">
                <p className="label-caption">הודעה נבחרת</p>
                <p className="text-sm text-theme-muted whitespace-pre-wrap">{selectedNote.text}</p>
                <button
                  onClick={() => onDeleteNote(selectedNote.id)}
                  className="text-xs text-red-400 hover:underline"
                >
                  מחק הודעה
                </button>
              </div>
            ) : (
              <div className="text-sm text-theme-muted space-y-3">
                <p className="label-caption mb-2">פאנל פרטים</p>
                <p>לחץ על טבלה או הודעה לפרטים</p>
                <p className="text-xs">
                  השתמש ב<strong className="text-lambo-gold font-normal">חבר קו</strong> כדי לקשר
                  טבלאות ויזואלית
                </p>
              </div>
            )}
          </div>
        </aside>
      ) : (
        <div className="schema-details-panel flex flex-shrink-0 bg-theme-surface border-t lg:border-t-0 lg:border-r border-theme-border w-full lg:w-11">
          <button
            type="button"
            onClick={() => setDetailsPanelOpen(true)}
            className="flex lg:flex-col items-center justify-center gap-2 py-3 lg:py-4 px-4 lg:px-2 text-theme-muted hover:text-lambo-gold hover:bg-theme-raised transition-colors w-full lg:min-h-[120px]"
            title="הצג פאנל פרטים"
          >
            <PanelLeftOpen size={18} />
            <span className="lg:schema-details-rail text-xs lg:text-[10px] uppercase tracking-wider">
              הצג פרטים
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function TableDetails({
  table,
  policies,
  tableLinks,
  allTables,
  onAddRls,
  onDeleteRls,
  onDeleteTableLink,
  onUpdate,
}: {
  table: DbTable;
  policies: import("@/lib/db-model").RlsPolicy[];
  tableLinks: import("@/lib/db-model").TableLink[];
  allTables: DbTable[];
  onAddRls: () => void;
  onDeleteRls: (id: string) => void;
  onDeleteTableLink: (id: string) => void;
  onUpdate: (updates: {
    name?: string;
    description?: string;
    rlsEnabled?: boolean;
    status?: import("@/lib/db-model").DbTableStatus;
    cardWidth?: number;
    bodyMaxHeight?: number;
    fieldsCollapsed?: boolean;
    pinned?: boolean;
  }) => void;
}) {
  const [name, setName] = useState(table.name);
  const [description, setDescription] = useState(table.description ?? "");

  useEffect(() => {
    setName(table.name);
    setDescription(table.description ?? "");
  }, [table.id, table.name, table.description]);

  const commitText = () => {
    onUpdate({
      name: name.trim() || table.name,
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      <div>
        <p className="label-caption mb-2">עריכת טבלה</p>
        <label className="label-caption block mb-1">שם</label>
        <input
          className="input-lambo font-mono text-sm mb-3"
          dir="ltr"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => e.key === "Enter" && commitText()}
        />
        <label className="label-caption block mb-1">תיאור</label>
        <textarea
          className="input-lambo text-sm resize-none mb-3"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={commitText}
          placeholder="תיאור הטבלה..."
        />
        <label className="label-caption block mb-1">סטטוס</label>
        <div className="flex gap-2 mb-3">
          {(["new", "existing"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onUpdate({ status: s })}
              className={`flex-1 py-1.5 text-xs border transition-colors ${
                table.status === s
                  ? s === "new"
                    ? "border-emerald-400 bg-emerald-400/10 text-emerald-400"
                    : "border-lambo-gold bg-lambo-gold/10 text-lambo-gold"
                  : "border-theme-border text-theme-muted"
              }`}
            >
              {s === "new" ? "חדשה" : "קיימת"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-theme-muted cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={table.rlsEnabled}
            onChange={(e) => onUpdate({ rlsEnabled: e.target.checked })}
            className="accent-lambo-gold"
          />
          הפעל RLS
        </label>
        <label className="flex items-center gap-2 text-sm text-theme-muted cursor-pointer">
          <input
            type="checkbox"
            checked={table.pinned ?? false}
            onChange={(e) => onUpdate({ pinned: e.target.checked })}
            className="accent-lambo-gold"
          />
          נעץ טבלה (תמיד מעל)
        </label>
        <label className="flex items-center gap-2 text-sm text-theme-muted cursor-pointer mt-2">
          <input
            type="checkbox"
            checked={table.fieldsCollapsed ?? false}
            onChange={(e) => onUpdate({ fieldsCollapsed: e.target.checked })}
            className="accent-lambo-gold"
          />
          כווץ שדות
        </label>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <label className="label-caption block mb-1">רוחב ({table.cardWidth ?? 300}px)</label>
            <input
              type="range"
              min={200}
              max={560}
              value={table.cardWidth ?? 300}
              onChange={(e) => onUpdate({ cardWidth: Number(e.target.value) })}
              className="w-full accent-lambo-gold"
            />
          </div>
          <div>
            <label className="label-caption block mb-1">גובה שדות</label>
            <input
              type="range"
              min={60}
              max={480}
              value={table.bodyMaxHeight ?? Math.max(60, table.fields.length * 30)}
              onChange={(e) =>
                onUpdate({ bodyMaxHeight: Number(e.target.value), fieldsCollapsed: false })
              }
              className="w-full accent-lambo-gold"
            />
          </div>
        </div>
      </div>

      <div>
        <p className="label-caption mb-2">שדות ({table.fields.length})</p>
        <div className="space-y-1 font-mono text-xs" dir="ltr">
          {table.fields.map((f) => (
            <div key={f.id} className="flex justify-between gap-2 py-1 border-b border-theme-border/40">
              <span>
                {f.primaryKey && "🔑 "}
                {f.name}
              </span>
              <span className="text-theme-muted">{f.type}</span>
            </div>
          ))}
        </div>
      </div>

      {tableLinks.length > 0 && (
        <div>
          <p className="label-caption mb-2">קווי חיבור ({tableLinks.length})</p>
          <div className="space-y-1 text-xs">
            {tableLinks.map((link) => {
              const otherId =
                link.fromTableId === table.id ? link.toTableId : link.fromTableId;
              const other = allTables.find((t) => t.id === otherId);
              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-2 py-1 border-b border-theme-border/40"
                >
                  <span className="font-mono" dir="ltr">
                    → {other?.name ?? "?"}
                  </span>
                  <button
                    onClick={() => onDeleteTableLink(link.id)}
                    className="text-red-400 hover:underline"
                  >
                    הסר
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {table.rlsEnabled && (
        <RlsPolicyList policies={policies} onAdd={onAddRls} onDelete={onDeleteRls} />
      )}
    </div>
  );
}
