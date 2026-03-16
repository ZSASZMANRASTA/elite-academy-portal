import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle, XCircle, Users } from "lucide-react";

interface UserWithRole {
  id: string;
  full_name: string;
  approved: boolean;
  created_at: string;
  class: string | null;
  subject: string | null;
  role?: string;
}

const UsersPage = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const loadUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, approved, created_at, class, subject")
      .order("created_at", { ascending: false });

    const { data: roles } = await supabase.from("user_roles").select("user_id, role");

    const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) ?? []);
    const combined = (profiles ?? []).map((p) => ({ ...p, role: roleMap.get(p.id) ?? "student" }));
    setUsers(combined);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const toggleApproval = async (userId: string, currentlyApproved: boolean) => {
    const { error } = await supabase.from("profiles").update({ approved: !currentlyApproved }).eq("id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success(currentlyApproved ? "User unapproved" : "User approved");
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, approved: !currentlyApproved } : u));
  };

  const changeRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Role changed to ${newRole}`);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
  };

  const filtered = filter === "all" ? users : filter === "pending" ? users.filter((u) => !u.approved) : users.filter((u) => u.role === filter);

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Manage Users</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="pending">Pending Approval</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="teacher">Teachers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12"><Users className="h-12 w-12 text-muted-foreground/50" /><p className="mt-4 text-muted-foreground">No users found</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.full_name || "Unnamed"}</p>
                    <Badge variant={user.approved ? "default" : "secondary"} className="text-xs">
                      {user.approved ? "Approved" : "Pending"}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">{user.role}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                    {user.class && ` · Class: ${user.class}`}
                    {user.subject && ` · Subject: ${user.subject}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={user.role} onValueChange={(v) => changeRole(user.id, v)}>
                    <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant={user.approved ? "outline" : "default"} onClick={() => toggleApproval(user.id, user.approved)}>
                    {user.approved ? <><XCircle className="h-3 w-3 mr-1" />Revoke</> : <><CheckCircle className="h-3 w-3 mr-1" />Approve</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersPage;
