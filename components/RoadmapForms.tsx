"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toDateOnlyString } from "@/lib/roadmap-grid";
import { SUGGESTED_FACTORS } from "@/lib/types";

interface RoadmapTaskFormProps {
  factors: { id: string; name: string }[];
  defaultFactorId?: string;
  projectColor: string;
  onSubmit: (data: {
    factorId: string;
    title: string;
    startDate: string;
    endDate: string;
    color?: string;
  }) => void;
  onCancel?: () => void;
}

export function RoadmapTaskForm({
  factors,
  defaultFactorId,
  projectColor,
  onSubmit,
  onCancel,
}: RoadmapTaskFormProps) {
  const today = toDateOnlyString(new Date());
  const tomorrow = toDateOnlyString(new Date(Date.now() + 86400000));

  const [factorId, setFactorId] = useState(defaultFactorId ?? factors[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrow);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !factorId || !startDate || !endDate) return;
    onSubmit({
      factorId,
      title: title.trim(),
      startDate,
      endDate,
      color: projectColor,
    });
    setTitle("");
  };

  if (factors.length === 0) {
    return (
      <p className="text-sm text-theme-muted text-center py-4">
        הוסף גורם לפני יצירת משימה
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label-caption block mb-2">גורם</label>
        <select
          value={factorId}
          onChange={(e) => setFactorId(e.target.value)}
          className="input-lambo"
        >
          {factors.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label-caption block mb-2">שם המשימה</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='לדוגמה: בניית תוכנית ואפיון'
          className="input-lambo"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-caption block mb-2">תאריך התחלה</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-lambo"
          />
        </div>
        <div>
          <label className="label-caption block mb-2">תאריך סיום</label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-lambo"
          />
        </div>
      </div>

      <p className="label-micro">
        המשימה תופיע בטבלה לפי טווח התאריכים, מיושרת לעמודות החודש והשבוע
      </p>

      <div className="flex gap-3 justify-end pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost-sm">
            ביטול
          </button>
        )}
        <button type="submit" disabled={!title.trim()} className="btn-gold-sm">
          <Plus size={16} />
          הוסף משימה
        </button>
      </div>
    </form>
  );
}

interface FactorFormProps {
  existingNames: string[];
  onSubmit: (name: string) => void;
  onCancel?: () => void;
}

export function FactorForm({ existingNames, onSubmit, onCancel }: FactorFormProps) {
  const available = SUGGESTED_FACTORS.filter((name) => !existingNames.includes(name));
  const [selected, setSelected] = useState<string>(available[0] ?? "");
  const [custom, setCustom] = useState("");
  const [useCustom, setUseCustom] = useState(available.length === 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (useCustom ? custom : selected).trim();
    if (!name) return;
    onSubmit(name);
    setCustom("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!useCustom && available.length > 0 ? (
        <div>
          <label className="label-caption block mb-2">בחר גורם מהרשימה</label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="input-lambo"
          >
            {available.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="label-caption block mb-2">שם הגורם</label>
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="לדוגמה: פיתוח"
            className="input-lambo"
            autoFocus
          />
        </div>
      )}

      {available.length > 0 && (
        <button
          type="button"
          onClick={() => setUseCustom(!useCustom)}
          className="text-xs text-lambo-gold hover:text-lambo-gold-text"
        >
          {useCustom ? "בחר מהרשימה" : "הוסף גורם מותאם אישית"}
        </button>
      )}

      <div className="flex gap-3 justify-end pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost-sm">
            ביטול
          </button>
        )}
        <button
          type="submit"
          disabled={useCustom ? !custom.trim() : !selected}
          className="btn-gold-sm"
        >
          <Plus size={16} />
          הוסף גורם
        </button>
      </div>
    </form>
  );
}
