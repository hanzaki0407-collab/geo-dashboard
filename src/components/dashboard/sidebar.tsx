import {
  Building2,
  FileText,
  Globe,
  Home,
  Link2,
  LogOut,
  Users,
} from "lucide-react";

const mainMenu = [
  { label: "ダッシュボード", icon: Home, href: "#top" },
  { label: "ブランドを選ぶ", icon: Building2, href: "#brand-filter" },
  { label: "競合ランキング", icon: Users, href: "#competitors" },
  { label: "引用元ドメイン", icon: Link2, href: "#citations" },
  { label: "紹介文", icon: FileText, href: "#snippets" },
];

export function Sidebar() {
  return (
    <aside className="flex w-[240px] shrink-0 flex-col bg-sidebar">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Globe className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-[15px] font-bold tracking-tight text-foreground">
          GEO Dashboard
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pt-4">
        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">
          ナビゲーション
        </div>
        <ul className="space-y-0.5">
          {mainMenu.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Icon className="h-[17px] w-[17px]" />
                  <span className="flex-1">{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3">
        <a
          href="#"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-[17px] w-[17px]" />
          Log Out
        </a>
      </div>
    </aside>
  );
}
