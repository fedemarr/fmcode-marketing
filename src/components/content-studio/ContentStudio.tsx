"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import PostGrid from "./PostGrid"
import PostApprovalModal from "./PostApprovalModal"
import WeeklyCalendar from "./WeeklyCalendar"
import GeneratePanel from "./GeneratePanel"
import type { StudioPost } from "./PostCard"

type Tab = "generar" | "aprobacion" | "calendario" | "runner" | "marca" | "conexion"

interface Company {
  id: string
  name: string
  instagram_username?: string | null
  instagram_connected?: boolean
}

interface Props {
  company: Company
  initialPosts: StudioPost[]
}

const TABS: { id: Tab; label: string }[] = [
  { id: "generar",    label: "✨ Generar" },
  { id: "aprobacion", label: "Para aprobar" },
  { id: "calendario", label: "Calendario" },
  { id: "runner",     label: "Runner" },
  { id: "marca",      label: "Marca" },
  { id: "conexion",   label: "Conexión IG" },
]

export default function ContentStudio({ company, initialPosts }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("aprobacion")
  const [posts, setPosts] = useState<StudioPost[]>(initialPosts)
  const [selectedPost, setSelectedPost] = useState<StudioPost | null>(null)

  const refresh = useCallback(() => router.refresh(), [router])

  const byStatus = (statuses: string[]) => posts.filter(p => statuses.includes(p.status))

  const pending   = byStatus(["pending_approval"])
  const approved  = byStatus(["approved"])
  const scheduled = byStatus(["scheduled"])
  const published = byStatus(["published"])
  const weekPosts = byStatus(["approved", "scheduled", "published"])

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 px-1 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? "border-green-600 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}

        <div className="ml-auto flex-shrink-0 pb-1">
          <button className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300 hover:bg-gray-50">
            + Subir posteo propio
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "generar" && (
          <GeneratePanel
            companyId={company.id}
            companyName={company.name}
            onGenerated={refresh}
          />
        )}

        {tab === "aprobacion" && (
          <div className="space-y-8">
            {/* Pending */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-base font-semibold text-gray-800">Para aprobar</h2>
                {pending.length > 0 && (
                  <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    {pending.length}
                  </span>
                )}
              </div>
              <PostGrid
                posts={pending}
                onSelect={setSelectedPost}
                emptyMessage="No hay posts pendientes de aprobación"
              />
            </div>

            {/* Approved — assign date */}
            {approved.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-gray-800 mb-1">
                  Aprobados — tocá un día del calendario para programarlo
                </h2>
                <p className="text-xs text-gray-400 mb-3">Estos posts están listos pero sin fecha asignada aún</p>
                <PostGrid posts={approved} onSelect={setSelectedPost} />
              </div>
            )}
          </div>
        )}

        {tab === "calendario" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-base font-semibold text-gray-800 mb-4">Esta semana</h2>
              <WeeklyCalendar posts={weekPosts} onSelect={setSelectedPost} />
            </div>
            {scheduled.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-gray-800 mb-3">Programados</h2>
                <PostGrid posts={scheduled} onSelect={setSelectedPost} />
              </div>
            )}
          </div>
        )}

        {tab === "runner" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-gray-800 mb-3">
                Publicados
                <span className="ml-2 text-sm text-gray-400 font-normal">({published.length})</span>
              </h2>
              <PostGrid
                posts={published}
                onSelect={setSelectedPost}
                emptyMessage="No hay posts publicados todavía"
              />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800 mb-3">
                Programados
                <span className="ml-2 text-sm text-gray-400 font-normal">({scheduled.length})</span>
              </h2>
              <PostGrid
                posts={scheduled}
                onSelect={setSelectedPost}
                emptyMessage="No hay posts programados"
              />
            </div>
          </div>
        )}

        {tab === "marca" && (
          <div className="max-w-lg">
            <p className="text-sm text-gray-500 mb-4">Configurá los datos de tu marca para mejorar la generación de contenido.</p>
            <a href="/settings" className="inline-flex items-center gap-1 text-sm text-green-600 underline">
              Ir a configuración de marca →
            </a>
          </div>
        )}

        {tab === "conexion" && (
          <div className="max-w-lg">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-medium mb-2">Instagram Business</h3>
              {company.instagram_connected ? (
                <div>
                  <p className="text-sm text-green-600 mb-3">✓ Conectado como @{company.instagram_username}</p>
                  <a href="/settings/instagram" className="text-sm text-gray-500 underline">Reconectar →</a>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-3">No hay cuenta de Instagram conectada todavía.</p>
                  <a href="/settings/instagram" className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90">
                    Conectar Instagram →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de aprobación */}
      {selectedPost && (
        <PostApprovalModal
          post={selectedPost as Parameters<typeof PostApprovalModal>[0]["post"]}
          onClose={() => setSelectedPost(null)}
          onUpdated={refresh}
        />
      )}
    </div>
  )
}
