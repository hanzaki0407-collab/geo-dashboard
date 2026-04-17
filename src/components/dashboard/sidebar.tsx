import {
  BarChart3,
  Building2,
  FileText,
  Globe,
  History,
  Home,
  Link2,
  LogOut,
  Settings,
} from "lucide-react";

const mainMenu = [
  { label: "ダッシュボード", icon: Home, href: "#", active: true },
  { label: "ブランド管理", icon: Building2, href: "#brands", badge: 20 },
  { label: "分析レポート", icon: BarChart3, href: "#analytics" },
  { label: "引用元分析", icon: Link2, href: "#citations" },
  { label: "スニペット", icon: FileText, href: "#snippets" },
];

const dataMenu = [
  { label: "収集設定", icon: Settings, href: "#settings" },
  { label: "実行履歴", icon: History, href: "#history" },
];

export function Sidebar() {
  return (
    <aside className="flex w-[240px] shrink-0 flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Globe className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-[15px] font-bold tracking-tight text-foreground">
          GEO Dashboard
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pt-4">
        {/* Main Menu */}
        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">
          Main Menu
        </div>
        <ul className="space-y-0.5">
          {mainMenu.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                    item.active
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Icon className="h-[17px] w-[17px]" />
                  <span className="flex-1">{item.label}</span>
                  {"badge" in item && item.badge && (
                    <span
                      className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                        item.active
                          ? "bg-white/25 text-white"
                          : "bg-primary/15 text-primary"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Data Collection */}
        <div className="mb-2 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">
          Data Collection
        </div>
        <ul className="space-y-0.5">
          {dataMenu.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Icon className="h-[17px] w-[17px]" />
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom */}
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
