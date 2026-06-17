import { Suspense } from "react";
import { EmbedPageClient } from "@/components/EmbedPageClient";

function EmbedFallback() {
  return (
    <div className="min-h-[480px] flex items-center justify-center bg-theme-page">
      <div className="w-8 h-8 border-2 border-lambo-gold border-t-transparent animate-spin" />
    </div>
  );
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<EmbedFallback />}>
      <EmbedPageClient projectId={id} />
    </Suspense>
  );
}
