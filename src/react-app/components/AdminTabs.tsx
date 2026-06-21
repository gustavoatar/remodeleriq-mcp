// Unified admin navigation — a single sticky tab bar shared across every admin
// page (Overview / Content / Reddit / Inbox) so they feel like one dashboard.
import { useNavigate, useLocation } from "react-router";
import { BarChart3, FileText, MessageSquare, Inbox, Home } from "lucide-react";

const TABS = [
  { label: "Overview", path: "/admin", icon: BarChart3 },
  { label: "Content", path: "/admin/content", icon: FileText },
  { label: "Reddit", path: "/admin/reddit", icon: MessageSquare },
  { label: "Nextdoor", path: "/admin/nextdoor", icon: Home },
  { label: "Inbox", path: "/admin/inbox", icon: Inbox },
];

export default function AdminTabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="sticky top-0 z-30 -mx-4 md:-mx-6 mb-5 bg-white/95 backdrop-blur border-b border-slate-200 px-4 md:px-6">
      <div className="max-w-[1100px] mx-auto flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 pr-3 mr-1 text-emerald-600 font-extrabold text-sm whitespace-nowrap"
          title="RemodelerIQ home"
        >
          RemodelerIQ
        </button>
        {TABS.map((t) => {
          const active =
            pathname === t.path || (t.path !== "/admin" && pathname.startsWith(t.path));
          const Icon = t.icon;
          return (
            <button
              key={t.path}
              onClick={() => navigate(t.path)}
              className={`flex items-center gap-2 px-3 md:px-4 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors min-h-[44px] ${
                active
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
