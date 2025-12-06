// Admin dashboard page displaying user list from the AI app
import { requireAdmin } from "@/lib/auth";
import { getAIAppUsers } from "@/lib/db/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserTable } from "./_components/UserTable";

export default async function AdminDashboard() {
  // Ensure user is authenticated and has admin role
  // Middleware already handles redirect, but this provides an additional check
  await requireAdmin();

  let usersResult;
  let error: string | null = null;

  try {
    // Fetch users from the AI app database
    usersResult = await getAIAppUsers({
      page: 1,
      limit: 50,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    error = err instanceof Error ? err.message : "Failed to fetch users";
    usersResult = {
      users: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          List of users in the AI app
        </p>
      </div>

      {error ? (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  {usersResult.total} {usersResult.total === 1 ? "user" : "users"} total
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <UserTable users={usersResult.users} />
            {usersResult.total > usersResult.users.length && (
              <div className="mt-4 text-sm text-muted-foreground text-center">
                Showing {usersResult.users.length} of {usersResult.total} users
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

