"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Database } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { readModelFromSearchParams } from "@/lib/model-snapshot";
import { DataModelView } from "@/components/data-model/DataModelView";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ModelPageClientProps {
  projectId: string;
}

export function ModelPageClient({ projectId }: ModelPageClientProps) {
  const {
    projects,
    loaded,
    addDbTable,
    addDbField,
    addDbRelationship,
    addRlsPolicy,
    deleteDbTable,
    deleteRlsPolicy,
    moveDbTable,
    updateDbTableStatus,
    updateDbTable,
    importModelSnapshot,
    addTableLink,
    deleteTableLink,
    addDbNote,
    updateDbNote,
    deleteDbNote,
    moveDbNote,
  } = useProjects();

  const searchParams = useSearchParams();
  const importedFromUrl = useRef(false);
  const project = projects.find((p) => p.id === projectId);

  useEffect(() => {
    if (!loaded || importedFromUrl.current || project) return;
    const model = readModelFromSearchParams(searchParams);
    if (!model) return;
    importedFromUrl.current = true;
    importModelSnapshot(projectId, model);
  }, [loaded, project, projectId, searchParams, importModelSnapshot]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-page">
        <div className="w-8 h-8 border-2 border-lambo-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!project) {
    const modelInUrl = readModelFromSearchParams(searchParams);
    if (modelInUrl) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-theme-page">
          <div className="w-8 h-8 border-2 border-lambo-gold border-t-transparent animate-spin" />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-theme-page">
        <p className="text-theme-muted">המודל לא נמצא</p>
        <Link href="/" className="text-lambo-gold hover:text-lambo-gold-text transition-colors">
          חזרה לדף הבית
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-page flex flex-col">
      <header className="nav-transparent flex-shrink-0">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-10 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Link
                href="/"
                className="p-2 text-theme-muted hover:text-theme-text transition-colors flex-shrink-0"
              >
                <ArrowRight size={20} />
              </Link>
              <Database size={22} className="text-lambo-gold flex-shrink-0" />
              <div
                className="w-1 h-10 flex-shrink-0"
                style={{ background: project.color }}
              />
              <div className="min-w-0">
                <h1 className="heading-display text-xl sm:text-2xl truncate">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="label-micro mt-1 truncate">{project.description}</p>
                )}
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
        <div className="progress-line w-full" />
      </header>

      <main className="flex-1 flex flex-col min-h-0">
        <div className="px-6 lg:px-10 xl:px-14 py-5 flex-shrink-0">
          <p className="label-caption mb-1">מודל נתונים</p>
          <p className="text-sm text-theme-muted max-w-2xl">
            תרשים ER — גרור טבלאות, חבר קווים, והגדר קשרים ו-RLS
          </p>
        </div>
        <div className="flex-1 border-y border-theme-border overflow-hidden min-h-0 flex flex-col">
          <DataModelView
            project={project}
            addDbTable={addDbTable}
            addDbField={addDbField}
            addDbRelationship={addDbRelationship}
            addRlsPolicy={addRlsPolicy}
            deleteDbTable={deleteDbTable}
            deleteRlsPolicy={deleteRlsPolicy}
            moveDbTable={moveDbTable}
            updateDbTableStatus={updateDbTableStatus}
            updateDbTable={updateDbTable}
            importModelSnapshot={importModelSnapshot}
            addTableLink={addTableLink}
            deleteTableLink={deleteTableLink}
            addDbNote={addDbNote}
            updateDbNote={updateDbNote}
            deleteDbNote={deleteDbNote}
            moveDbNote={moveDbNote}
          />
        </div>
      </main>
    </div>
  );
}
