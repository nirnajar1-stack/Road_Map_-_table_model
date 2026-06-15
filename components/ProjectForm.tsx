"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface ProjectFormProps {
  onSubmit: (name: string, description: string) => void;
  onCancel?: () => void;
}

export function ProjectForm({ onSubmit, onCancel }: ProjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), description.trim());
    setName("");
    setDescription("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="label-caption block mb-2">שם הפרויקט</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="לדוגמה: פיתוח אפליקציה"
          className="input-lambo"
          autoFocus
        />
      </div>
      <div>
        <label className="label-caption block mb-2">תיאור (אופציונלי)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="תיאור קצר של הפרויקט..."
          rows={2}
          className="input-lambo resize-none"
        />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost-sm">
            ביטול
          </button>
        )}
        <button type="submit" disabled={!name.trim()} className="btn-gold-sm">
          <Plus size={16} />
          צור פרויקט
        </button>
      </div>
    </form>
  );
}

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: "var(--overlay)" }}
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-theme-surface border border-theme-border p-8">
        <div className="flex items-center justify-between mb-6 section-divider pb-4">
          <h2 className="heading-display text-xl">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-theme-muted hover:text-theme-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
