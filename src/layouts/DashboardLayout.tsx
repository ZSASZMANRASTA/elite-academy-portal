import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, LayoutDashboard, BookOpen, Users, LogOut,
  Menu, X, BarChart3, Settings, PenTool, ClipboardList, Eye
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DashboardLayout = () => {
  const { profile, role, actualRole, isImpersonating, signOut, setImpersonatedRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["student", "teacher", "admin"] },
    { label: "Courses", href: "/dashboard/courses", icon: BookOpen, roles: ["student", "teacher", "admin"] },
    { label: "Materials", href: "/dashboard/materials", icon: BookOpen, roles: ["student", "teacher", "admin"] },
    { label: "Take Quiz", href: "/dashboard/take-quiz", icon: PenTool, roles: ["student"] },
    { label: "Manage Quizzes", href: "/dashboard/quizzes", icon: ClipboardList, roles: ["teacher", "admin"] },
    { label: "Assignments", href: "/dashboard/assignments", icon: Settings, roles: ["student", "teacher", "admin"] },
    { label: "Users", href: "/dashboard/users", icon: Users, roles: ["admin"] },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, roles: ["admin", "teacher"] },
  ];

  const filteredNav = navItems.filter((item) => role && item.roles.includes(role));

  const isActive = (href: string) =>
    href === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-bold">Adam's Junior</span>
        </div>

        <nav className="mt-4 flex flex-col gap-1 px-3">
          {filteredNav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4 space-y-3">
          {actualRole === "admin" && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" /> Viewing as
              </div>
              <Select value={role ?? "admin"} onValueChange={(v) => setImpersonatedRole(v as any)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="px-1">
            <p className="text-sm font-medium truncate">{profile?.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {actualRole}{isImpersonating && ` → ${role}`}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-6 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-display font-bold">Adam's Junior</span>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
