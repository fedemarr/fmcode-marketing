import { db } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NewClientButton } from "@/components/clients/new-client-button"
import { Instagram, FileText } from "lucide-react"

async function getClients() {
  return db.client.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      industry: true,
      isActive: true,
      instagramHandle: true,
      postFrequency: true,
      _count: {
        select: {
          posts: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} cliente{clients.length !== 1 ? "s" : ""} registrado{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <NewClientButton />
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 text-sm">No hay clientes todavía.</p>
            <p className="text-gray-400 text-xs mt-1">Creá el primer cliente para empezar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="font-semibold text-gray-900">{client.name}</h2>
                      <p className="text-xs text-gray-500 mt-0.5">{client.industry}</p>
                    </div>
                    <Badge variant={client.isActive ? "success" : "secondary"}>
                      {client.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-4">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {client._count.posts} posts
                    </span>
                    <span>{client.postFrequency}x / semana</span>
                    {client.instagramHandle && (
                      <span className="flex items-center gap-1">
                        <Instagram className="h-3 w-3" />
                        {client.instagramHandle}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
