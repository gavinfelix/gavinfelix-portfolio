// Test session page for debugging admin authentication and session data
import { requireAdmin } from "@/lib/auth";

export default async function TestSessionPage() {
  const user = await requireAdmin();

  const output = {
    session: user
      ? {
          user: {
            id: user.id,
            email: user.email,
          },
          expires: null,
        }
      : null,
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Session Debug</h1>
      <pre className="bg-muted p-4 rounded-md overflow-auto">
        {JSON.stringify(output, null, 2)}
      </pre>
    </div>
  );
}
