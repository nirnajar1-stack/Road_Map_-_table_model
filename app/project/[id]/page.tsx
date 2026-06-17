import { Suspense } from "react";
import { ModelPageClient } from "@/components/ModelPageClient";

function ModelPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-page">
      <div className="w-8 h-8 border-2 border-lambo-gold border-t-transparent animate-spin" />
    </div>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<ModelPageFallback />}>
      <ModelPageClient projectId={id} />
    </Suspense>
  );
}
