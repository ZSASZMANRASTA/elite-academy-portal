import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, DollarSign, BookOpen, Megaphone, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const typeConfig = {
  fee: { label: "Fee Reminder", icon: DollarSign, color: "text-orange-600" },
  quiz: { label: "Quiz", icon: BookOpen, color: "text-blue-600" },
  general: { label: "General", icon: Megaphone, color: "text-primary" },
};

type TargetMode = "role" | "class" | "individual";

const NotificationsPage = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", message: "", type: "general",
    target_role: "student", target_mode: "role" as TargetMode,
    target_class_id: "", target_user_id: "",
  });

  const canSend = role === "admin" || role === "teacher";

  // Fetch classes for the class dropdown
  const { data: classes = [] } = useQuery({
    queryKey: ["classes-for-notif"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, name").order("name");
      return data || [];
    },
    enabled: canSend,
  });

  // Fetch students for individual targeting
  const { data: students = [] } = useQuery({
    queryKey: ["students-for-notif"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "student");
      if (!roles?.length) return [];
      const ids = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, class").in("id", ids);
      return profiles || [];
    },
    enabled: canSend,
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch user's class enrollments for filtering
  const { data: myClassIds = [] } = useQuery({
    queryKey: ["my-class-ids", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("class_enrollments").select("class_id").eq("student_id", user!.id);
      return (data || []).map((e) => e.class_id);
    },
    enabled: !!user && role === "student",
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const insert: any = {
        title: form.title,
        message: form.message,
        type: form.type as "fee" | "quiz" | "general",
        sender_id: user!.id,
        target_role: form.target_mode === "role" ? form.target_role : "student",
      };
      if (form.target_mode === "class" && form.target_class_id) {
        insert.target_class_id = form.target_class_id;
      }
      if (form.target_mode === "individual" && form.target_user_id) {
        insert.target_user_id = form.target_user_id;
      }
      const { error } = await supabase.from("notifications").insert(insert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
      setForm({ title: "", message: "", type: "general", target_role: "student", target_mode: "role", target_class_id: "", target_user_id: "" });
      setDialogOpen(false);
      toast.success("Notification sent");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const markReadMutation = useMutation({
    mutationFn: async (notifId: string) => {
      const notif = notifications.find((n) => n.id === notifId);
      if (!notif || !user) return;
      const readBy = Array.isArray(notif.read_by) ? notif.read_by : [];
      if (readBy.includes(user.id)) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read_by: [...readBy, user.id] })
        .eq("id", notifId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });

  const isRead = (notif: any) => {
    return Array.isArray(notif.read_by) && notif.read_by.includes(user?.id);
  };

  // Filter notifications relevant to the current user
  const filteredNotifications = notifications.filter((n: any) => {
    if (canSend) return true; // admins/teachers see all
    // Individual target
    if (n.target_user_id) return n.target_user_id === user?.id;
    // Class target
    if (n.target_class_id) return myClassIds.includes(n.target_class_id);
    // Role-based
    return n.target_role === role || n.target_role === "all";
  });

  const canSubmit = form.title && form.message && !sendMutation.isPending &&
    (form.target_mode === "role" ||
     (form.target_mode === "class" && form.target_class_id) ||
     (form.target_mode === "individual" && form.target_user_id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {canSend && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Send Notification</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="fee">Fee Reminder</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Send To</Label>
                  <Select value={form.target_mode} onValueChange={(v) => setForm((p) => ({ ...p, target_mode: v as TargetMode, target_class_id: "", target_user_id: "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="role">By Role (All Students / Teachers / Everyone)</SelectItem>
                      <SelectItem value="class">Specific Class</SelectItem>
                      <SelectItem value="individual">Individual Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.target_mode === "role" && (
                  <div>
                    <Label>Target Role</Label>
                    <Select value={form.target_role} onValueChange={(v) => setForm((p) => ({ ...p, target_role: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">All Students</SelectItem>
                        <SelectItem value="teacher">All Teachers</SelectItem>
                        <SelectItem value="all">Everyone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {form.target_mode === "class" && (
                  <div>
                    <Label>Select Class</Label>
                    <Select value={form.target_class_id} onValueChange={(v) => setForm((p) => ({ ...p, target_class_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Choose a class..." /></SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {form.target_mode === "individual" && (
                  <div>
                    <Label>Select Student</Label>
                    <Select value={form.target_user_id} onValueChange={(v) => setForm((p) => ({ ...p, target_user_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Choose a student..." /></SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.full_name}{s.class ? ` (${s.class})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button className="w-full" disabled={!canSubmit} onClick={() => sendMutation.mutate()}>
                  {sendMutation.isPending ? "Sending..." : "Send"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filteredNotifications.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No notifications yet</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n: any) => {
            const cfg = typeConfig[n.type as keyof typeof typeConfig] || typeConfig.general;
            const Icon = cfg.icon;
            const read = isRead(n);
            return (
              <Card key={n.id} className={cn(read ? "opacity-60" : "border-primary/20")}>
                <CardContent className="flex items-start gap-4 py-4">
                  <div className={`mt-0.5 ${cfg.color}`}><Icon className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{n.title}</h3>
                      <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
                      {n.target_user_id && <Badge variant="secondary" className="text-xs">Direct</Badge>}
                      {n.target_class_id && <Badge variant="secondary" className="text-xs">Class</Badge>}
                      {!read && <Badge className="text-xs">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {!read && (
                    <Button variant="ghost" size="sm" onClick={() => markReadMutation.mutate(n.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
