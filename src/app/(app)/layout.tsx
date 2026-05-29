import { fetchBrands, fetchLocales } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, brands, locales] = await Promise.all([
    requireUser(),
    fetchBrands(),
    fetchLocales(),
  ]);
  return (
    <AppShell brands={brands} locales={locales} userEmail={user.email ?? null}>
      {children}
    </AppShell>
  );
}
