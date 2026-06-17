"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Instagram, Save, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Props {
  clientId: string
  instagramHandle?: string | null
  instagramAccountId?: string | null
  isConnected: boolean
}

export function InstagramSettings({ clientId, instagramHandle, instagramAccountId, isConnected }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(!isConnected)
  const [loading, setLoading] = useState(false)
  const [handle, setHandle] = useState(instagramHandle ?? "")
  const [accountId, setAccountId] = useState(instagramAccountId ?? "")
  const [token, setToken] = useState("")

  async function handleSave() {
    if (!accountId.trim() || !token.trim()) {
      toast({ title: "Completá el Account ID y el Token", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagramHandle: handle.replace(/^@/, "").trim() || undefined,
          instagramAccountId: accountId.trim(),
          instagramToken: token.trim(),
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error?.message)

      toast({ title: "Instagram configurado", variant: "success" })
      setToken("")
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {instagramHandle ? (
            <div className="flex items-center gap-2 text-sm">
              <Instagram className="h-4 w-4 text-pink-500" />
              <span className="text-gray-700">@{instagramHandle}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Instagram className="h-4 w-4" />
              <span>Sin cuenta</span>
            </div>
          )}
          <Badge variant={isConnected ? "success" : "secondary"}>
            {isConnected ? "Conectado" : "Sin conectar"}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setOpen(!open)}>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {isConnected ? "Editar" : "Configurar"}
        </Button>
      </div>

      {open && (
        <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
          <div className="text-xs text-gray-600 space-y-1 bg-blue-50 border border-blue-100 rounded p-3">
            <p className="font-medium text-blue-700">Cómo obtener el token de Instagram:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Andá a <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 inline-flex items-center gap-0.5">Graph API Explorer <ExternalLink className="h-3 w-3" /></a></li>
              <li>Seleccioná tu app de Meta → &quot;Generate Access Token&quot;</li>
              <li>Permisos necesarios: <code className="bg-white px-1 rounded">instagram_basic</code>, <code className="bg-white px-1 rounded">instagram_content_publish</code>, <code className="bg-white px-1 rounded">pages_read_engagement</code></li>
              <li>Copiá el token y pegalo abajo</li>
              <li>Para el Account ID: <code className="bg-white px-1 rounded">GET /me/accounts</code> → buscá tu página → <code className="bg-white px-1 rounded">GET /{"{page_id}"}/instagram_accounts</code></li>
            </ol>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Instagram Handle (sin @)</Label>
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="mi_cuenta"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Instagram Business Account ID</Label>
              <Input
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="17841400000000000"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Access Token</Label>
              <Input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="EAAxxxxxx..."
              />
              <p className="text-xs text-gray-400">Se guarda encriptado. No se muestra por seguridad.</p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading} size="sm">
            <Save className="h-4 w-4 mr-1" />
            {loading ? "Guardando..." : "Guardar configuración"}
          </Button>
        </div>
      )}
    </div>
  )
}
