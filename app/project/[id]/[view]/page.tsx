import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isProjectView } from "@/lib/project-views";
import { ProjectPageClient } from "@/components/ProjectPageClient";

function ProjectViewFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-page">
      <div className="w-8 h-8 border-2 border-lambo-gold border-t-transparent animate-spin" />
    </div>
  );
}

export default async function ProjectViewPage({
  params,
}: {
  params: Promise<{ id: string; view: string }>;
}) {
  const { id, view } = await params;
  if (!isProjectView(view)) notFound();
  return (
    <Suspense fallback={<ProjectViewFallback />}>
      <ProjectPageClient projectId={id} view={view} />
    </Suspense>
  );
}
