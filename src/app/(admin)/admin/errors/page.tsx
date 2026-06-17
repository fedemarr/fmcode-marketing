import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import ResolveErrorButton from "@/components/admin/ResolveErrorButton"

export default async function AdminErrorsPage() {
  const supabase = createClient()

  const { data: errorsRaw } = await supabase
    .from("automation_errors")
    .select("id, error_message, n8n_workflow, n8n_execution_id, resolved, created_at, company_id, post_id")
    .order("created_at", { ascending: false })
    .limit(100)

  const errors = errorsRaw as Array<{
    id: string
    error_message: string
    n8n_workflow: string | null
    n8n_execution_id: string | null
    resolved: boolean
    created_at: string
    company_id: string | null
    post_id: string | null
  }> | null

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Errores de N8N</h1>

      {!errors || errors.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-muted-foreground text-sm">
          No hay errores registrados
        </div>
      ) : (
        <div className="space-y-3">
          {errors.map(err => (
            <div key={err.id} className={`bg-white border rounded-xl p-4 ${err.resolved ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={err.resolved ? "secondary" : "destructive"} className="text-xs">
                      {err.resolved ? "Resuelto" : "Sin resolver"}
                    </Badge>
                    {err.n8n_workflow && (
                      <span className="text-xs font-medium text-muted-foreground">{err.n8n_workflow}</span>
                    )}
                  </div>
                  <p className="text-sm text-red-700 break-words">{err.error_message}</p>
                  {err.n8n_execution_id && (
                    <p className="text-xs text-muted-foreground mt-1">Execution ID: {err.n8n_execution_id}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(err.created_at).toLocaleString("es-AR")}
                  </p>
                </div>
                {!err.resolved && <ResolveErrorButton errorId={err.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
