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
  { label: "ブランド管理", icon: Building2, href: "#brands" },
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
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Globe className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-base font-bold text-foreground">GEO Dashboard</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground">
          Main Menu
        </div>
        <ul className="space-y-1">
          {mainMenu.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    item.active
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground">
          データ収集
        </div>
        <ul className="space-y-1">
          {dataMenu.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <a
          href="#"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </a>
      </div>
    </aside>
  );
}
