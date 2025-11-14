import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast as sonnerToast } from "@/components/ui/sonner";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await login(username, password);
      sonnerToast.success(`Welcome, ${username}!`, {
        description: "You're now logged in.",
        position: "top-center",
        duration: 3000,
      });
      navigate("/");
    } catch (e: any) {
      sonnerToast.error("Authentication error", {
        description: e?.message || "Unknown error",
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--gradient-flow)] p-4">
      <Card className="w-full max-w-md border-border/40 backdrop-blur-sm">
      <CardHeader>
          <CardTitle className="text-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="yourname" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
            </div>
            <div className="flex items-center justify-end">
              <Button onClick={submit} disabled={loading}>
                {loading ? "Please wait..." : "Login"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Use seeded accounts: admin/admin123 or user/user123.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
