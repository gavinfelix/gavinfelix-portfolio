// Admin dashboard page displaying user list from the AI app
import { requireAdmin } from "@/lib/auth";
import { getAIAppUsers } from "@/lib/db/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserTableWithFilters } from "./_components/UserTableWithFilters";

export default async function AdminDashboard() {
  // Ensure user is authenticated and has admin role
  // Middleware already handles redirect, but this provides an additional check
  await requireAdmin();

  let usersResult;
  let error: string | null = null;

  try {
    // Fetch all users from the AI app database for client-side filtering/pagination
    // Using a large limit to get all users (adjust if needed)
    usersResult = await getAIAppUsers({
      page: 1,
      limit: 1000, // Fetch a large batch for client-side operations
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    error = err instanceof Error ? err.message : "Failed to fetch users";
    usersResult = {
      users: [],
      total: 0,
      page: 1,
      limit: 1000,
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
            <UserTableWithFilters users={usersResult.users} pageSize={20} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

