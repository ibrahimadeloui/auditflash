import { AuditView } from "@/components/audit-view";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AuditView id={id} mode="report" />;
}
