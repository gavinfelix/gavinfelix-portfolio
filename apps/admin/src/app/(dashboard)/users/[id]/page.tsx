"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "user";
  status: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [status, setStatus] = useState<"active" | "disabled">("active");

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/users/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("User not found");
          } else {
            setError("Failed to load user");
          }
          return;
        }

        const data: User = await response.json();
        setUser(data);
        setName(data.name || "");
        setRole(data.role);
        setStatus(data.status);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to load user");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id]);

  // Handle save
  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name || null,
          role,
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update user");
        return;
      }

      const updatedUser: User = await response.json();
      setUser(updatedUser);
      
      // Optionally redirect or show success message
      router.refresh();
    } catch (err) {
      console.error("Error updating user:", err);
      setError("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/users")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <div className="text-center py-8">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/users")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">User Details</h1>
          <p className="text-foreground/70">View and edit user information</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-6 rounded-lg border p-6">
        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={user.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-foreground/50">
            Email cannot be changed
          </p>
        </div>

        {/* Name (editable) */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter user name"
          />
        </div>

        {/* Role (editable) */}
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={(value) => setRole(value as "admin" | "user")}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status (editable) */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as "active" | "disabled")}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Created At (read-only) */}
        <div className="space-y-2">
          <Label>Created At</Label>
          <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm">
            {format(new Date(user.createdAt), "PPpp")}
          </div>
        </div>

        {/* Current Status Display */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <div>
            <Label className="text-xs text-foreground/50">Current Role</Label>
            <div className="mt-1">
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                {user.role}
              </Badge>
            </div>
          </div>
          <div>
            <Label className="text-xs text-foreground/50">Current Status</Label>
            <div className="mt-1">
              <Badge
                variant={user.status === "active" ? "default" : "destructive"}
              >
                {user.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

