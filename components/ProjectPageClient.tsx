"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Database, LayoutList, Map, Plus } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { readModelFromSearchParams } from "@/lib/model-snapshot";
import { StageCard } from "@/components/StageCard";
import { RoadmapTimeline } from "@/components/RoadmapTimeline";
import { VerticalRoadmap } from "@/components/RoadmapTimelineVertical";
import { DataModelView } from "@/components/data-model/DataModelView";
import { FactorForm, RoadmapTaskForm } from "@/components/RoadmapForms";
import { StageForm } from "@/components/StageForm";
import { Modal } from "@/components/ProjectForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  PROJECT_VIEWS,
  type ProjectView,
  projectViewPath,
} from "@/lib/project-views";

const VIEW_ICONS: Record<ProjectView, React.ReactNode> = {
  schema: <Database size={14} />,
  timeline: <Map size={14} />,
  vertical: <LayoutList size={14} />,
  stages: <LayoutList size={14} />,
};

const VIEW_LABELS: Record<ProjectView, string> = {
  schema: "מודל",
  timeline: "טבלה",
  vertical: "אנכי",
  stages: "שלבים",
};

interface ProjectPageClientProps {
  projectId: string;
  view: ProjectView;
}

export function ProjectPageClient({ projectId, view }: ProjectPageClientProps) {
  const {
    projects,
    loaded,
    addStage,
    updateStage,
    deleteStage,
    addMilestone,
    deleteMilestone,
    addFactor,
    deleteFactor,
    addTask,
    deleteTask,
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

  const [showStageForm, setShowStageForm] = useState(false);
  const [showFactorForm, setShowFactorForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFactorId, setTaskFactorId] = useState<string | undefined>();
  const searchParams = useSearchParams();
  const importedFromUrl = useRef(false);

  const project = projects.find((p) => p.id === projectId);
  const now = new Date();

  // אם הפרויקט לא קיים אבל יש מודל ב-URL — ייבוא אוטומטי (להטמעה/שיתוף)
  useEffect(() => {
    if (!loaded || importedFromUrl.current || view !== "schema") return;
    const model = readModelFromSearchParams(searchParams);
    if (!model || project) return;
    importedFromUrl.current = true;
    importModelSnapshot(projectId, model);
  }, [loaded, project, projectId, view, searchParams, importModelSnapshot]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-page">
        <div className="w-8 h-8 border-2 border-lambo-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!project) {
    const modelInUrl = readModelFromSearchParams(searchParams);
    if (view === "schema" && modelInUrl) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-theme-page">
          <div className="w-8 h-8 border-2 border-lambo-gold border-t-transparent animate-spin" />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-theme-page">
        <p className="text-theme-muted">הפרויקט לא נמצא</p>
        <Link href="/" className="text-lambo-gold hover:text-lambo-gold-text transition-colors">
          חזרה לדף הבית
        </Link>
      </div>
    );
  }

  const sortedStages = [...project.stages].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-theme-page">
      <header className="nav-transparent">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-10 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Link
                href="/"
                className="p-2 text-theme-muted hover:text-theme-text transition-colors flex-shrink-0"
              >
                <ArrowRight size={20} />
              </Link>
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

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-px bg-theme-border">
                {PROJECT_VIEWS.map((v) => (
                  <ViewTab
                    key={v}
                    href={projectViewPath(projectId, v)}
                    active={view === v}
                    icon={VIEW_ICONS[v]}
                    label={VIEW_LABELS[v]}
                  />
                ))}
              </div>
              <ThemeToggle />
              <button onClick={() => setShowStageForm(true)} className="btn-gold-sm">
                <Plus size={16} />
                <span className="hidden sm:inline">שלב חדש</span>
              </button>
            </div>
          </div>
        </div>
        <div className="progress-line w-full" />
      </header>

      <main
        className={
          view === "timeline" || view === "schema"
            ? "w-full py-8"
            : "max-w-content mx-auto px-10 py-10"
        }
      >
        {view === "schema" && (
          <section className="mb-12 w-full">
            <div className="px-6 lg:px-10 xl:px-14 mb-6">
              <p className="label-caption mb-2">תצוגה</p>
              <h2 className="heading-display text-2xl sm:text-3xl">מודל נתונים</h2>
              <p className="text-sm text-theme-muted mt-2 max-w-2xl">
                תרשים ER — גרור טבלאות על הקנבס. ניתן להטמיע ב-iframe דרך URL ייחודי.
              </p>
            </div>
            <div className="w-full border-y border-theme-border overflow-hidden">
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
          </section>
        )}

        {view === "timeline" && (
          <section className="mb-12 w-full">
            <div className="px-6 lg:px-10 xl:px-14 mb-6">
              <p className="label-caption mb-2">תצוגה</p>
              <h2 className="heading-display text-2xl sm:text-3xl">מפת דרכים</h2>
            </div>
            <div className="w-full border-y border-theme-border overflow-hidden">
              <RoadmapTimeline
                project={project}
                onAddFactor={() => setShowFactorForm(true)}
                onAddTask={(factorId) => {
                  setTaskFactorId(factorId);
                  setShowTaskForm(true);
                }}
                onDeleteTask={(taskId) => deleteTask(project.id, taskId)}
                onDeleteFactor={(factorId) => deleteFactor(project.id, factorId)}
              />
            </div>
            <div className="px-6 lg:px-10 xl:px-14 mt-12">
              <p className="label-caption mb-2">ניהול שלבים</p>
              <h2 className="heading-display text-2xl sm:text-3xl mb-6">שלבים (אופציונלי)</h2>
              {sortedStages.length === 0 ? (
                <div className="text-center py-16 border border-theme-border">
                  <p className="text-theme-muted mb-6">אין עדיין שלבים בפרויקט</p>
                  <button onClick={() => setShowStageForm(true)} className="btn-gold-sm">
                    <Plus size={16} />
                    הוסף שלב ראשון
                  </button>
                </div>
              ) : (
                <div className="space-y-px border border-theme-border">
                  {sortedStages.map((stage, index) => (
                    <StageCard
                      key={stage.id}
                      stage={stage}
                      stageOrder={index + 1}
                      projectColor={project.color}
                      now={now}
                      onUpdate={(s) => updateStage(project.id, s)}
                      onDelete={() => {
                        if (confirm(`למחוק את השלב "${stage.title}"?`)) {
                          deleteStage(project.id, stage.id);
                        }
                      }}
                      onAddMilestone={(title, description) =>
                        addMilestone(project.id, stage.id, {
                          title,
                          description: description || undefined,
                        })
                      }
                      onDeleteMilestone={(milestoneId) =>
                        deleteMilestone(project.id, stage.id, milestoneId)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {view === "vertical" && (
          <section className="mb-12 max-w-content mx-auto px-10">
            <p className="label-caption mb-2">תצוגה</p>
            <h2 className="heading-display text-2xl sm:text-3xl mb-6">ציר זמן</h2>
            <div className="bg-theme-surface border border-theme-border p-8">
              <VerticalRoadmap project={project} now={now} />
            </div>
          </section>
        )}

        {view === "stages" && (
          <section className="max-w-content mx-auto px-10">
            {sortedStages.length === 0 ? (
              <div className="text-center py-16 border border-theme-border">
                <p className="text-theme-muted mb-6">אין עדיין שלבים בפרויקט</p>
                <button onClick={() => setShowStageForm(true)} className="btn-gold-sm">
                  <Plus size={16} />
                  הוסף שלב ראשון
                </button>
              </div>
            ) : (
              <div className="space-y-px border border-theme-border">
                {sortedStages.map((stage, index) => (
                  <StageCard
                    key={stage.id}
                    stage={stage}
                    stageOrder={index + 1}
                    projectColor={project.color}
                    now={now}
                    onUpdate={(s) => updateStage(project.id, s)}
                    onDelete={() => {
                      if (confirm(`למחוק את השלב "${stage.title}"?`)) {
                        deleteStage(project.id, stage.id);
                      }
                    }}
                    onAddMilestone={(title, description) =>
                      addMilestone(project.id, stage.id, {
                        title,
                        description: description || undefined,
                      })
                    }
                    onDeleteMilestone={(milestoneId) =>
                      deleteMilestone(project.id, stage.id, milestoneId)
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {showStageForm && (
        <Modal title="שלב חדש" onClose={() => setShowStageForm(false)}>
          <StageForm
            onSubmit={(data) => {
              addStage(project.id, data);
              setShowStageForm(false);
            }}
            onCancel={() => setShowStageForm(false)}
          />
        </Modal>
      )}

      {showFactorForm && (
        <Modal title="הוסף גורם" onClose={() => setShowFactorForm(false)}>
          <FactorForm
            existingNames={project.factors?.map((f) => f.name) ?? []}
            onSubmit={(name) => {
              addFactor(project.id, name);
              setShowFactorForm(false);
            }}
            onCancel={() => setShowFactorForm(false)}
          />
        </Modal>
      )}

      {showTaskForm && (
        <Modal title="הוסף משימה" onClose={() => setShowTaskForm(false)}>
          <RoadmapTaskForm
            factors={project.factors ?? []}
            defaultFactorId={taskFactorId}
            projectColor={project.color}
            onSubmit={(data) => {
              addTask(project.id, {
                ...data,
                color: project.factors.find((f) => f.id === data.factorId)?.color,
              });
              setShowTaskForm(false);
              setTaskFactorId(undefined);
            }}
            onCancel={() => {
              setShowTaskForm(false);
              setTaskFactorId(undefined);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function ViewTab({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-4 py-2 text-xs uppercase tracking-button transition-colors ${
        active
          ? "bg-lambo-gold text-black"
          : "bg-theme-raised text-theme-muted hover:text-theme-text"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
