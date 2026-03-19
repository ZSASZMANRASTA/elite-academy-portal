import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Users } from "lucide-react";

const EmailListPage = () => {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [subRes, conRes] = await Promise.all([
        supabase.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false }),
        supabase.from("parent_contacts").select("*").order("created_at", { ascending: false }),
      ]);
      if (subRes.data) setSubscribers(subRes.data);
      if (conRes.data) setContacts(conRes.data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6" /> Email & Contact List
        </h1>
        <p className="text-muted-foreground">Newsletter subscribers and parent enquiries</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Newsletter Subscribers</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscribers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Parent Enquiries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscribers">
        <TabsList>
          <TabsTrigger value="subscribers">Newsletter ({subscribers.length})</TabsTrigger>
          <TabsTrigger value="contacts">Parent Contacts ({contacts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="subscribers">
          <Card>
            <CardContent className="pt-6">
              {subscribers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No subscribers yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.email}</TableCell>
                        <TableCell>{new Date(s.subscribed_at).toLocaleDateString("en-KE")}</TableCell>
                        <TableCell>
                          <Badge variant={s.active ? "default" : "secondary"}>
                            {s.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardContent className="pt-6">
              {contacts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No parent enquiries yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parent Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Child</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.parent_name}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.phone || "—"}</TableCell>
                        <TableCell>{c.child_name || "—"}</TableCell>
                        <TableCell>{c.child_grade || "—"}</TableCell>
                        <TableCell>{new Date(c.created_at).toLocaleDateString("en-KE")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailListPage;
