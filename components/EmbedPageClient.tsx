"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
import { readModelFromSearchParams } from "@/lib/model-snapshot";
import { DataModelView } from "@/components/data-model/DataModelView";

interface EmbedPageClientProps {
  projectId: string;
}

export function EmbedPageClient({ projectId }: EmbedPageClientProps) {
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
  const modelInUrl = readModelFromSearchParams(searchParams);

  useEffect(() => {
    if (!loaded || importedFromUrl.current || !modelInUrl) return;
    importedFromUrl.current = true;
    importModelSnapshot(projectId, modelInUrl);
  }, [loaded, modelInUrl, projectId, importModelSnapshot]);

  if (!loaded || (modelInUrl && !project)) {
    return (
      <div className="min-h-[480px] flex items-center justify-center bg-theme-page">
        <div className="w-8 h-8 border-2 border-lambo-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!modelInUrl) {
    return (
      <div className="min-h-[320px] flex flex-col items-center justify-center gap-3 p-8 text-center bg-theme-page">
        <p className="text-sm text-theme-muted max-w-md">
          להטמעה ב-Notion נדרש קישור עם הנתונים. באפליקציה לחץ על &quot;שתף קישור&quot; והדבק את
          הקישור המלא (כולל ?model=) ב-Notion.
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-[320px] flex items-center justify-center bg-theme-page">
        <div className="w-8 h-8 border-2 border-lambo-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[560px] h-screen max-h-screen flex flex-col bg-theme-page">
      <DataModelView
        embedded
        project={project}
        importModelSnapshot={importModelSnapshot}
        addDbTable={addDbTable}
        addDbField={addDbField}
        addDbRelationship={addDbRelationship}
        addRlsPolicy={addRlsPolicy}
        deleteDbTable={deleteDbTable}
        deleteRlsPolicy={deleteRlsPolicy}
        moveDbTable={moveDbTable}
        updateDbTableStatus={updateDbTableStatus}
        updateDbTable={updateDbTable}
        addTableLink={addTableLink}
        deleteTableLink={deleteTableLink}
        addDbNote={addDbNote}
        updateDbNote={updateDbNote}
        deleteDbNote={deleteDbNote}
        moveDbNote={moveDbNote}
      />
    </div>
  );
}
