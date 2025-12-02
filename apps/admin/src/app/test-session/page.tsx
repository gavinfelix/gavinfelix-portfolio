import { getAdminSession } from "@/lib/auth";

export default async function TestSessionPage() {
  const session = await getAdminSession();

  const output = {
    session: session
      ? {
          user: {
            id: session.id,
            email: session.email,
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

