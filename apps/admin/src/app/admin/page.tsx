import { requireAdmin } from "@/lib/auth";

export default async function AdminDashboard() {
  const user = await requireAdmin();

  const metrics = [
    { label: "Total Users", value: 102 },
    { label: "Documents Uploaded", value: 54 },
    { label: "AI Chats", value: 1421 },
    { label: "Active Today", value: 27 },
  ];

  const recentActivity = [
    { type: "user", text: "New user registered: gavinfelix", date: "2 hours ago" },
    { type: "document", text: "Document uploaded: english_article.txt", date: "3 hours ago" },
    { type: "chat", text: "AI chat session started", date: "5 hours ago" },
  ];

  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Overview</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="p-4 rounded-lg border bg-white shadow-sm flex flex-col"
            >
              <span className="text-sm text-gray-500">{m.label}</span>
              <span className="text-2xl font-bold mt-2">{m.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>

        <div className="rounded-lg border bg-white shadow-sm divide-y">
          {recentActivity.map((item, idx) => (
            <div key={idx} className="p-4 flex justify-between">
              <span>{item.text}</span>
              <span className="text-gray-500 text-sm">{item.date}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

