"use client";

// Admin login page with role-based authentication
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getSession().then(({ data }) => {
      const userRole = data.session?.user.user_metadata?.role;
      if (userRole === "admin") router.replace("/admin");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const supabase = supabaseBrowser();

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      }
    );

    if (signInError) {
      setError("Email or Password is incorrect");
      return;
    }

    const userRole = data.user?.user_metadata?.role;

    // Redirect based on role
    if (userRole === "admin") {
      // Use window.location for full page reload to ensure cookies are synced
      window.location.href = "/admin";
    } else {
      // Non-admin users - show error or stay on login
      setError("Access denied. Admin role required.");
    }
  }

  return (
    <div className="p-8 max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-4">Admin Login</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          className="w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          type="password"
          placeholder="Password"
          className="w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          type="submit"
          variant="default"
          className="w-full"
        >
          Login
        </Button>
      </form>
    </div>
  );
}
