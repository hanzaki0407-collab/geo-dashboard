import { fetchBrands } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, brands] = await Promise.all([requireUser(), fetchBrands()]);
  return (
    <AppShell brands={brands} userEmail={user.email ?? null}>
      {children}
    </AppShell>
  );
}
