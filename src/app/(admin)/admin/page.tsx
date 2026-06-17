import { createClient } from "@/lib/supabase/server"

export default async function AdminDashboardPage() {
  const supabase = createClient()

  const [
    { count: totalClients },
    { count: pendingPosts },
    { count: publishedPosts },
    { count: totalErrors },
  ] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }).is("deleted_at" as never, null),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "pending_approval").is("deleted_at", null),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "published").is("deleted_at", null),
    supabase.from("automation_errors").select("id", { count: "exact", head: true }).eq("resolved", false),
  ])

  const stats = [
    { label: "Clientes activos", value: totalClients ?? 0, color: "text-blue-600" },
    { label: "Posts para aprobar", value: pendingPosts ?? 0, color: "text-yellow-600" },
    { label: "Posts publicados", value: publishedPosts ?? 0, color: "text-green-600" },
    { label: "Errores sin resolver", value: totalErrors ?? 0, color: (totalErrors ?? 0) > 0 ? "text-red-600" : "text-gray-600" },
  ]

  const { data: recentErrorsRaw } = await supabase
    .from("automation_errors")
    .select("id, error_message, n8n_workflow, created_at, resolved")
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(5)

  const recentErrors = recentErrorsRaw as Array<{
    id: string
    error_message: string
    n8n_workflow: string | null
    created_at: string
    resolved: boolean
  }> | null

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Panel Admin</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {recentErrors && recentErrors.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Errores recientes de N8N</h2>
          <div className="space-y-2">
            {recentErrors.map(err => (
              <div key={err.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-800">{err.n8n_workflow ?? "Workflow desconocido"}</p>
                <p className="text-xs text-red-600 mt-0.5 truncate">{err.error_message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(err.created_at).toLocaleString("es-AR")}
                </p>
              </div>
            ))}
            <a href="/admin/errors" className="text-sm text-primary underline">Ver todos →</a>
          </div>
        </div>
      )}
    </div>
  )
}
