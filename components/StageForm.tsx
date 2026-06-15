"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { StageStatus } from "@/lib/types";

interface StageFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    openAt: string;
    status: StageStatus;
  }) => void;
  onCancel?: () => void;
}

export function StageForm({ onSubmit, onCancel }: StageFormProps) {
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);
  const defaultOpenAt = defaultDate.toISOString().slice(0, 16);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [openAt, setOpenAt] = useState(defaultOpenAt);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !openAt) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      openAt: new Date(openAt).toISOString(),
      status: "locked",
    });
    setTitle("");
    setDescription("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="label-caption block mb-2">שם השלב</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="לדוגמה: תכנון ראשוני"
          className="input-lambo"
          autoFocus
        />
      </div>
      <div>
        <label className="label-caption block mb-2">תיאור</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="מה כולל השלב הזה?"
          rows={2}
          className="input-lambo resize-none"
        />
      </div>
      <div>
        <label className="label-caption block mb-2">תאריך ושעת פתיחה</label>
        <input
          type="datetime-local"
          value={openAt}
          onChange={(e) => setOpenAt(e.target.value)}
          className="input-lambo"
        />
        <p className="label-micro mt-2">
          השלב ייפתח אוטומטית בתאריך ובשעה שנבחרו
        </p>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost-sm">
            ביטול
          </button>
        )}
        <button type="submit" disabled={!title.trim()} className="btn-gold-sm">
          <Plus size={16} />
          הוסף שלב
        </button>
      </div>
    </form>
  );
}

interface MilestoneFormProps {
  onSubmit: (title: string, description: string) => void;
  onCancel?: () => void;
}

export function MilestoneForm({ onSubmit, onCancel }: MilestoneFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim(), description.trim());
    setTitle("");
    setDescription("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="שם נקודת ציון"
        className="input-lambo text-sm py-2"
        autoFocus
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="תיאור קצר (אופציונלי)"
        className="input-lambo text-sm py-2"
      />
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost-sm">
            ביטול
          </button>
        )}
        <button
          type="submit"
          disabled={!title.trim()}
          className="btn-gold-sm text-xs py-1.5"
        >
          הוסף נקודה
        </button>
      </div>
    </form>
  );
}
