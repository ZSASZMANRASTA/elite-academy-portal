import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CircleAlert as AlertCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface AdminSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdminSetup = ({ open, onOpenChange }: AdminSetupProps) => {
  const [step, setStep] = useState<"instructions" | "create">("instructions");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const handleCreateAdmin = async () => {
    if (!email || !fullName) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("sb_token") || ""}`,
          },
          body: JSON.stringify({ email, full_name: fullName }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to create admin");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setGeneratedPassword(data.password || "Check Supabase Dashboard for password reset");
      setStep("create");
      toast.success("Admin account created successfully!");
      setEmail("");
      setFullName("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Super Admin Setup</DialogTitle>
          <DialogDescription>Create additional admin accounts for your school</DialogDescription>
        </DialogHeader>

        {step === "instructions" ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only existing admins can create new admin accounts. This ensures system security.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">How to Create Your First Super Admin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium">Option 1: Via Supabase Dashboard (Recommended)</h4>
                  <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
                    <li>Go to your Supabase Dashboard</li>
                    <li>Navigate to Authentication → Users</li>
                    <li>Click "Add user" and create with email: <code className="bg-muted px-2 py-1 rounded text-xs">admin@adamsjunior.ac.ke</code></li>
                    <li>Copy the user ID (UUID)</li>
                    <li>In this app, go to Users page and change the role to "Admin"</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Option 2: Using This App</h4>
                  <p className="text-muted-foreground">Click "Create New Admin" to add additional admin accounts.</p>
                </div>

                <div className="bg-muted p-3 rounded text-xs space-y-1">
                  <p className="font-medium">Default Admin Account:</p>
                  <p>Email: <code>admin@adamsjunior.ac.ke</code></p>
                  <p>Password: Set via Supabase Dashboard password reset</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => setStep("create")}>
                Create New Admin
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!generatedPassword ? (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    The new admin will receive a password reset email. Make sure they use that to set their password.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setStep("instructions")} disabled={loading}>
                    Back
                  </Button>
                  <Button onClick={handleCreateAdmin} disabled={loading}>
                    {loading ? "Creating..." : "Create Admin Account"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Admin account created successfully!
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Account Created</CardTitle>
                    <CardDescription>Share these details with the new admin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <code className="bg-muted px-3 py-2 rounded text-sm flex-1">{email}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(email)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Initial Password</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        A password reset email has been sent. The admin will set their own password from that email.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => {
                      setStep("create");
                      setGeneratedPassword("");
                      setEmail("");
                      setFullName("");
                    }}
                  >
                    Create Another Admin
                  </Button>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
