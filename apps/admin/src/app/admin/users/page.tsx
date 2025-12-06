// Admin users management page displaying user list with pagination and search
import { requireAdmin } from "@/lib/auth";
import { getAIAppUsers } from "@/lib/db/queries";
import Link from "next/link";
import { SearchForm } from "./_components/SearchForm";
import { PaginationControls } from "./_components/PaginationControls";
import { Suspense } from "react";

interface UsersPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

async function getUsers(search?: string, page?: number) {
  const result = await getAIAppUsers({
    page: page ?? 1,
    limit: 20, // Page size of 20
    search: search?.trim() || undefined,
  });

  return result;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  await requireAdmin();

  // Parse search params
  const params = await searchParams;
  const search = params.search;
  const page = params.page ? parseInt(params.page, 10) : 1;

  // Validate page number
  const validPage = isNaN(page) || page < 1 ? 1 : page;

  let result;
  let error: string | null = null;

  try {
    result = await getUsers(search, validPage);
  } catch (err) {
    console.error("Error fetching users:", err);
    error = err instanceof Error ? err.message : "Failed to fetch users";
    result = {
      users: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    };
  }

  // Check if there are more results (hasMore)
  const hasMore = result.users.length === result.limit;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Users</h1>
        <p className="text-gray-500 text-sm">
          {result.total} {result.total === 1 ? "user" : "users"}
          {search ? " found" : " total"}
        </p>
      </div>

      {/* Search Form */}
      <Suspense fallback={<div>Loading search...</div>}>
        <SearchForm />
      </Suspense>

      {/* Users Table */}
      {error ? (
        <div className="rounded-lg border border-destructive bg-white p-6">
          <p className="text-destructive font-medium">Error loading users</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y">
              {result.users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    {search ? "No users found matching your search" : "No users found"}
                  </td>
                </tr>
              ) : (
                result.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="hover:underline block"
                      >
                        {user.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="hover:underline font-medium block"
                      >
                        {user.email}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.type === "regular"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.type === "regular" ? "Registered" : "Guest"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {(result.totalPages > 1 || hasMore || result.page > 1) && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {result.users.length > 0 ? (result.page - 1) * result.limit + 1 : 0} to{" "}
            {Math.min(result.page * result.limit, result.total)} of {result.total} users
          </span>
          <Suspense fallback={<div>Loading pagination...</div>}>
            <PaginationControls
              currentPage={result.page}
              totalPages={result.totalPages}
              hasMore={hasMore}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
