import { GarmentDetailPage } from "@/components/garment-detail-page";

export default async function GarmentDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <GarmentDetailPage id={Number(resolvedParams.id)} />;
}
