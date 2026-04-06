import { InstrumentDetailPage } from "@/components/instrument-detail-page";

export default async function InstrumentDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <InstrumentDetailPage id={Number(resolvedParams.id)} />;
}
