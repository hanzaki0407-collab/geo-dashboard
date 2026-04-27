import { Sidebar } from "@/components/dashboard/sidebar";
import { fetchBrands } from "@/lib/data";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, brands] = await Promise.all([requireUser(), fetchBrands()]);
  return (
    <div className="flex h-full">
      <Sidebar brands={brands} userEmail={user.email ?? null} />
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        {children}
      </div>
    </div>
  );
}
