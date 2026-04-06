import { ProtectedLayout } from "@/components/protected-layout";

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
