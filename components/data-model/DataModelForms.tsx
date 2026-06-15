"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  DB_TABLE_STATUS_LABELS,
  FK_ON_DELETE_OPTIONS,
  RLS_ACTIONS,
  RLS_ROLES,
  SQL_FIELD_TYPES,
  SQL_FIELD_TYPE_LABELS,
  type DbField,
  type DbRelationship,
  type DbTable,
  type DbTableStatus,
  type FkOnDelete,
  type RlsAction,
  type RlsPolicy,
  type SqlFieldType,
} from "@/lib/db-model";

export function TableForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (
    name: string,
    description: string,
    rlsEnabled: boolean,
    status: DbTableStatus
  ) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rlsEnabled, setRlsEnabled] = useState(true);
  const [status, setStatus] = useState<DbTableStatus>("new");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit(name.trim(), description.trim(), rlsEnabled, status);
      }}
      className="space-y-5"
    >
      <div>
        <label className="label-caption block mb-2">שם הטבלה</label>
        <input
          className="input-lambo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="users"
          autoFocus
        />
      </div>
      <div>
        <label className="label-caption block mb-2">תיאור</label>
        <input
          className="input-lambo"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="משתמשי המערכת"
        />
      </div>
      <div>
        <label className="label-caption block mb-2">סטטוס טבלה</label>
        <div className="flex gap-2">
          {(["new", "existing"] as DbTableStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`flex-1 py-2 text-sm border transition-colors ${
                status === s
                  ? s === "new"
                    ? "border-emerald-400 bg-emerald-400/10 text-emerald-400"
                    : "border-lambo-gold bg-lambo-gold/10 text-lambo-gold"
                  : "border-theme-border text-theme-muted"
              }`}
            >
              {DB_TABLE_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-theme-muted mt-1.5">
          חדשה = טבלה שצריך ליצור · קיימת = כבר קיימת ב-DB
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm text-theme-muted cursor-pointer">
        <input
          type="checkbox"
          checked={rlsEnabled}
          onChange={(e) => setRlsEnabled(e.target.checked)}
          className="accent-lambo-gold"
        />
        הפעל RLS על הטבלה
      </label>
      <FormActions onCancel={onCancel} disabled={!name.trim()} label="הוסף טבלה" />
    </form>
  );
}

export function FieldForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (field: Omit<DbField, "id" | "order">) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<SqlFieldType>("text");
  const [nullable, setNullable] = useState(true);
  const [primaryKey, setPrimaryKey] = useState(false);
  const [unique, setUnique] = useState(false);
  const [defaultValue, setDefaultValue] = useState("");
  const [description, setDescription] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({
          name: name.trim(),
          type,
          nullable,
          primaryKey,
          unique,
          defaultValue: defaultValue.trim() || undefined,
          description: description.trim() || undefined,
        });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-caption block mb-2">שם השדה</label>
          <input className="input-lambo" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label-caption block mb-2">סוג</label>
          <select className="input-lambo" value={type} onChange={(e) => setType(e.target.value as SqlFieldType)}>
            {SQL_FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {SQL_FIELD_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label-caption block mb-2">ברירת מחדל</label>
        <input
          className="input-lambo"
          value={defaultValue}
          onChange={(e) => setDefaultValue(e.target.value)}
          placeholder="now() / gen_random_uuid()"
        />
      </div>
      <div>
        <label className="label-caption block mb-2">תיאור</label>
        <input className="input-lambo" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-theme-muted">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={nullable} onChange={(e) => setNullable(e.target.checked)} />
          Nullable
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={primaryKey} onChange={(e) => setPrimaryKey(e.target.checked)} />
          Primary Key
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} />
          Unique
        </label>
      </div>
      <FormActions onCancel={onCancel} disabled={!name.trim()} label="הוסף שדה" />
    </form>
  );
}

export function RelationshipForm({
  tables,
  onSubmit,
  onCancel,
}: {
  tables: DbTable[];
  onSubmit: (data: Omit<DbRelationship, "id">) => void;
  onCancel?: () => void;
}) {
  const [fromTableId, setFromTableId] = useState(tables[0]?.id ?? "");
  const [fromFieldId, setFromFieldId] = useState("");
  const [toTableId, setToTableId] = useState(tables[1]?.id ?? tables[0]?.id ?? "");
  const [toFieldId, setToFieldId] = useState("");
  const [onDelete, setOnDelete] = useState<FkOnDelete>("CASCADE");
  const [name, setName] = useState("");

  const fromTable = tables.find((t) => t.id === fromTableId);
  const toTable = tables.find((t) => t.id === toTableId);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!fromTableId || !fromFieldId || !toTableId || !toFieldId) return;
        onSubmit({ fromTableId, fromFieldId, toTableId, toFieldId, onDelete, name: name.trim() || undefined });
      }}
      className="space-y-4"
    >
      <FieldSelect
        label="טבלת מקור (FK)"
        tableId={fromTableId}
        fieldId={fromFieldId}
        tables={tables}
        onTableChange={(id) => {
          setFromTableId(id);
          setFromFieldId("");
        }}
        onFieldChange={setFromFieldId}
      />
      <FieldSelect
        label="טבלת יעד (מפתח ראשי)"
        tableId={toTableId}
        fieldId={toFieldId}
        tables={tables}
        onTableChange={(id) => {
          setToTableId(id);
          setToFieldId("");
        }}
        onFieldChange={setToFieldId}
      />
      <div>
        <label className="label-caption block mb-2">ON DELETE</label>
        <select className="input-lambo" value={onDelete} onChange={(e) => setOnDelete(e.target.value as FkOnDelete)}>
          {FK_ON_DELETE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-caption block mb-2">שם הקשר (אופציונלי)</label>
        <input className="input-lambo" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <FormActions
        onCancel={onCancel}
        disabled={!fromFieldId || !toFieldId || fromTableId === toTableId}
        label="הוסף קשר"
      />
      {fromTable && toTable && (
        <p className="label-micro">
          {fromTable.name}.{fromTable.fields.find((f) => f.id === fromFieldId)?.name} →{" "}
          {toTable.name}.{toTable.fields.find((f) => f.id === toFieldId)?.name}
        </p>
      )}
    </form>
  );
}

export function RlsPolicyForm({
  tables,
  defaultTableId,
  onSubmit,
  onCancel,
}: {
  tables: DbTable[];
  defaultTableId?: string;
  onSubmit: (data: Omit<RlsPolicy, "id">) => void;
  onCancel?: () => void;
}) {
  const [tableId, setTableId] = useState(defaultTableId ?? tables[0]?.id ?? "");
  const [name, setName] = useState("");
  const [action, setAction] = useState<RlsAction>("SELECT");
  const [role, setRole] = useState<string>(RLS_ROLES[0]);
  const [using, setUsing] = useState("auth.uid() = user_id");
  const [withCheck, setWithCheck] = useState("");
  const [description, setDescription] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!tableId || !name.trim()) return;
        onSubmit({
          tableId,
          name: name.trim(),
          action,
          role,
          using: using.trim() || undefined,
          withCheck: withCheck.trim() || undefined,
          description: description.trim() || undefined,
        });
      }}
      className="space-y-4"
    >
      <div>
        <label className="label-caption block mb-2">טבלה</label>
        <select className="input-lambo" value={tableId} onChange={(e) => setTableId(e.target.value)}>
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-caption block mb-2">שם מדיניות</label>
          <input className="input-lambo" value={name} onChange={(e) => setName(e.target.value)} placeholder="users_select_own" />
        </div>
        <div>
          <label className="label-caption block mb-2">פעולה</label>
          <select className="input-lambo" value={action} onChange={(e) => setAction(e.target.value as RlsAction)}>
            {RLS_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label-caption block mb-2">תפקיד (Role)</label>
        <select className="input-lambo" value={role} onChange={(e) => setRole(e.target.value)}>
          {RLS_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-caption block mb-2">USING (תנאי קריאה/עדכון)</label>
        <textarea
          className="input-lambo font-mono text-xs resize-none"
          rows={2}
          value={using}
          onChange={(e) => setUsing(e.target.value)}
          dir="ltr"
        />
      </div>
      <div>
        <label className="label-caption block mb-2">WITH CHECK (תנאי כתיבה)</label>
        <textarea
          className="input-lambo font-mono text-xs resize-none"
          rows={2}
          value={withCheck}
          onChange={(e) => setWithCheck(e.target.value)}
          dir="ltr"
          placeholder="אופציונלי"
        />
      </div>
      <FormActions onCancel={onCancel} disabled={!name.trim()} label="הוסף מדיניות RLS" />
    </form>
  );
}

function FieldSelect({
  label,
  tableId,
  fieldId,
  tables,
  onTableChange,
  onFieldChange,
}: {
  label: string;
  tableId: string;
  fieldId: string;
  tables: DbTable[];
  onTableChange: (id: string) => void;
  onFieldChange: (id: string) => void;
}) {
  const table = tables.find((t) => t.id === tableId);
  return (
    <div className="space-y-2">
      <label className="label-caption block">{label}</label>
      <select className="input-lambo" value={tableId} onChange={(e) => onTableChange(e.target.value)}>
        {tables.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <select className="input-lambo" value={fieldId} onChange={(e) => onFieldChange(e.target.value)}>
        <option value="">בחר שדה</option>
        {table?.fields.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name} ({SQL_FIELD_TYPE_LABELS[f.type]})
          </option>
        ))}
      </select>
    </div>
  );
}

function FormActions({
  onCancel,
  disabled,
  label,
}: {
  onCancel?: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex gap-3 justify-end pt-2">
      {onCancel && (
        <button type="button" onClick={onCancel} className="btn-ghost-sm">
          ביטול
        </button>
      )}
      <button type="submit" disabled={disabled} className="btn-gold-sm">
        <Plus size={16} />
        {label}
      </button>
    </div>
  );
}
