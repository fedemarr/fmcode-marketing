import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"

export default async function AdminClientsPage() {
  const supabase = createClient()

  type CompanyRow = {
    id: string; name: string; industry: string; plan: string
    posts_per_week: number; is_active: boolean; created_at: string
  }
  const { data: companiesRaw } = await supabase
    .from("companies")
    .select("id, name, industry, plan, posts_per_week, is_active, created_at")
    .is("deleted_at" as never, null)
    .order("created_at", { ascending: false })

  const companies = companiesRaw as CompanyRow[] | null

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clientes</h1>

      {!companies || companies.length === 0 ? (
        <p className="text-muted-foreground">No hay clientes todavía.</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empresa</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rubro</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Posts/sem</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Alta</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{company.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{company.industry}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs capitalize">{company.plan}</Badge>
                  </td>
                  <td className="px-4 py-3">{company.posts_per_week}</td>
                  <td className="px-4 py-3">
                    <Badge variant={company.is_active ? "default" : "secondary"} className="text-xs">
                      {company.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(company.created_at).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
