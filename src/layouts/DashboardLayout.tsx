import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, LayoutDashboard, BookOpen, Users, LogOut,
  Menu, BarChart3, Settings, PenTool, ClipboardList, Eye, Megaphone, Mail,
  School, CalendarCheck, DollarSign, Bell, TrendingUp
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DashboardLayout = () => {
  const { user, profile, role, actualRole, isImpersonating, signOut, setImpersonatedRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Unread notifications count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, read_by")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) return 0;
      return (data || []).filter((n: any) => {
        const readBy: string[] = Array.isArray(n.read_by) ? n.read_by : [];
        return !readBy.includes(user?.id || "");
      }).length;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

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
    { label: "Classes", href: "/dashboard/classes", icon: School, roles: ["teacher", "admin"] },
    { label: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck, roles: ["student", "teacher", "admin"] },
    { label: "Announcements", href: "/dashboard/announcements", icon: Megaphone, roles: ["student", "teacher", "admin"] },
    { label: "Notifications", href: "/dashboard/notifications", icon: Bell, roles: ["student", "teacher", "admin"], badge: unreadCount },
    { label: "Finance", href: "/dashboard/finance", icon: DollarSign, roles: ["admin"] },
    { label: "Progress", href: "/dashboard/progress", icon: TrendingUp, roles: ["admin"] },
    { label: "Users", href: "/dashboard/users", icon: Users, roles: ["admin"] },
    { label: "Email List", href: "/dashboard/email-list", icon: Mail, roles: ["admin"] },
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

        <nav className="mt-4 flex flex-col gap-1 px-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 14rem)" }}>
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
              {item.badge ? (
                <Badge className="ml-auto h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]">
                  {item.badge > 9 ? "9+" : item.badge}
                </Badge>
              ) : null}
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
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <span className="font-display font-bold lg:hidden">Adam's Junior</span>
          </div>
          {/* Bell icon in header */}
          <Link to="/dashboard/notifications" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
