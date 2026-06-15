import { redirect } from "next/navigation";
import { DEFAULT_PROJECT_VIEW, projectViewPath } from "@/lib/project-views";

export default async function ProjectIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(projectViewPath(id, DEFAULT_PROJECT_VIEW));
}
