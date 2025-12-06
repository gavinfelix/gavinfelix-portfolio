// Admin users management page displaying user list with pagination
import { requireAdmin } from "@/lib/auth";
import { getAIAppUsers } from "@/lib/db/queries";
import Link from "next/link";

async function getUsers() {
  const result = await getAIAppUsers({
    page: 1,
    limit: 50,
  });

  return result;
}

export default async function UsersPage() {
  const adminUser = await requireAdmin();
  const result = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Users</h1>
        <p className="text-gray-500 text-sm">
          {result.total} {result.total === 1 ? "user" : "users"} total
        </p>
      </div>

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
                  No users found
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

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Showing {result.users.length} of {result.total} users
        </span>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={result.page === 1}
          >
            Previous
          </button>
          <button
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={result.page >= result.totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
