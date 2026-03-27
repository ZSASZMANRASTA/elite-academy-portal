import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Bell, DollarSign, BookOpen, Megaphone, Check } from "lucide-react";

const typeConfig = {
  fee: { label: "Fee Reminder", icon: DollarSign, color: "text-orange-600" },
  quiz: { label: "Quiz", icon: BookOpen, color: "text-blue-600" },
  general: { label: "General", icon: Megaphone, color: "text-primary" },
};

const NotificationsPage = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "general" as string, target_role: "student" });

  const canSend = role === "admin" || role === "teacher";

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").insert({
        title: form.title,
        message: form.message,
        type: form.type as any,
        target_role: form.target_role,
        sender_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setForm({ title: "", message: "", type: "general", target_role: "student" });
      setDialogOpen(false);
      toast.success("Notification sent");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const markReadMutation = useMutation({
    mutationFn: async (notifId: string) => {
      const notif = notifications.find((n: any) => n.id === notifId);
      if (!notif || !user) return;
      const readBy: string[] = Array.isArray(notif.read_by) ? notif.read_by : [];
      if (readBy.includes(user.id)) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read_by: [...readBy, user.id] })
        .eq("id", notifId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const isRead = (notif: any) => {
    const readBy: string[] = Array.isArray(notif.read_by) ? notif.read_by : [];
    return readBy.includes(user?.id || "");
  };

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
                  <Label>Target Audience</Label>
                  <Select value={form.target_role} onValueChange={(v) => setForm((p) => ({ ...p, target_role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="teacher">Teachers</SelectItem>
                      <SelectItem value="all">Everyone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" disabled={!form.title || !form.message || sendMutation.isPending} onClick={() => sendMutation.mutate()}>
                  {sendMutation.isPending ? "Sending..." : "Send"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : notifications.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No notifications yet</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n: any) => {
            const cfg = typeConfig[n.type as keyof typeof typeConfig] || typeConfig.general;
            const Icon = cfg.icon;
            const read = isRead(n);
            return (
              <Card key={n.id} className={cn(read ? "opacity-60" : "border-primary/20")}>
                <CardContent className="flex items-start gap-4 py-4">
                  <div className={`mt-0.5 ${cfg.color}`}><Icon className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{n.title}</h3>
                      <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
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

// Need cn import
import { cn } from "@/lib/utils";

export default NotificationsPage;
