"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Plus, Trash2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { ProjectForm, Modal } from "@/components/ProjectForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatDate } from "@/lib/utils";

export default function HomePage() {
  const { projects, loaded, createProject, deleteProject } = useProjects();
  const [showForm, setShowForm] = useState(false);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-page">
        <div className="w-8 h-8 border-2 border-lambo-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-page">
      <header className="nav-transparent">
        <div className="max-w-content mx-auto px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Database size={28} className="text-lambo-gold" strokeWidth={1.5} />
            <div>
              <h1 className="heading-display text-2xl sm:text-3xl">מודל נתונים</h1>
              <p className="label-micro mt-1">תרשים ER אינטראקטיבי</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={() => setShowForm(true)} className="btn-gold-sm">
              <Plus size={16} />
              מודל חדש
            </button>
          </div>
        </div>
        <div className="progress-line max-w-content mx-auto" />
      </header>

      <main className="max-w-content mx-auto px-10 py-14">
        {projects.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex p-6 bg-theme-surface mb-8 border border-theme-border">
              <Database size={48} className="text-theme-subtle" strokeWidth={1} />
            </div>
            <h2 className="heading-display text-3xl sm:text-5xl mb-4 leading-tight">
              אין עדיין מודלים
            </h2>
            <p className="text-theme-muted text-base max-w-md mx-auto mb-10 leading-relaxed">
              צור מודל נתונים ראשון — טבלאות, קשרים, קווי חיבור ומדיניות RLS
            </p>
            <button onClick={() => setShowForm(true)} className="btn-gold">
              <Plus size={18} />
              צור מודל ראשון
            </button>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <p className="label-caption mb-2">המודלים שלי</p>
              <h2 className="heading-display text-4xl sm:text-5xl leading-tight">
                {projects.length} מודלים
              </h2>
            </div>
            <div className="grid gap-px sm:grid-cols-2 bg-theme-border">
              {projects.map((project) => {
                const tableCount = project.dataModel.tables.length;
                const linkCount = project.dataModel.tableLinks.length;
                return (
                  <div
                    key={project.id}
                    className="group relative bg-theme-page hover:bg-theme-raised transition-colors"
                  >
                    <div
                      className="absolute top-0 right-0 w-1 h-full"
                      style={{ background: project.color }}
                    />
                    <Link href={`/project/${project.id}`} className="block p-8 pr-10">
                      <h2 className="heading-display text-xl sm:text-2xl group-hover:text-lambo-gold transition-colors">
                        {project.name}
                      </h2>
                      {project.description && (
                        <p className="text-sm text-theme-muted mt-3 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-6 mt-6 label-micro">
                        <span>{tableCount} טבלאות</span>
                        <span>{linkCount} קווים</span>
                        <span>עודכן {formatDate(project.updatedAt)}</span>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm(`למחוק את "${project.name}"?`)) {
                          deleteProject(project.id);
                        }
                      }}
                      className="absolute top-4 left-4 p-2 text-theme-subtle hover:text-lambo-gold opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {showForm && (
        <Modal title="מודל חדש" onClose={() => setShowForm(false)}>
          <ProjectForm
            onSubmit={(name, description) => {
              createProject(name, description || undefined);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
