import { notFound } from "next/navigation";
import { isProjectView } from "@/lib/project-views";
import { ProjectPageClient } from "@/components/ProjectPageClient";

export default async function ProjectViewPage({
  params,
}: {
  params: Promise<{ id: string; view: string }>;
}) {
  const { id, view } = await params;
  if (!isProjectView(view)) notFound();
  return <ProjectPageClient projectId={id} view={view} />;
}
