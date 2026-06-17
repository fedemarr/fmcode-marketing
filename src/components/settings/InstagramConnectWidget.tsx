"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Props {
  company: { id: string; name: string }
  account: { id: string; username: string | null; is_active: boolean; token_expires_at: string | null } | null
  flashSuccess?: string
  flashError?: string
  username?: string
}

export default function InstagramConnectWidget({ company, account, flashSuccess, flashError, username }: Props) {
  const connectUrl = `/api/instagram/connect?company_id=${company.id}`

  const isExpired = account?.token_expires_at ? new Date(account.token_expires_at) < new Date() : false

  return (
    <div className="space-y-4">
      {flashSuccess === "connected" && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg">
          ✓ Instagram conectado exitosamente{username ? ` (@${username})` : ""}
        </div>
      )}
      {flashError && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-lg">
          Error: {flashError === "oauth_denied" ? "Acceso denegado en Instagram" : flashError === "token_exchange_failed" ? "Error al obtener el token" : flashError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {account ? "Cuenta conectada" : "Conectar cuenta de Instagram"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {account ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {account.username?.[0]?.toUpperCase() ?? "I"}
                </div>
                <div>
                  <p className="font-medium">@{account.username ?? "cuenta conectada"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={account.is_active && !isExpired ? "default" : "destructive"} className="text-xs">
                      {isExpired ? "Token expirado" : account.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                    {account.token_expires_at && (
                      <span className="text-xs text-muted-foreground">
                        Expira {new Date(account.token_expires_at).toLocaleDateString("es-AR")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <a href={connectUrl}>
                <Button variant="outline" className="w-full">
                  {isExpired ? "Renovar conexión" : "Reconectar cuenta"}
                </Button>
              </a>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Al conectar tu cuenta, vas a autorizar a FMCODE Marketing a publicar posts en tu perfil de Instagram Business a través de la API oficial de Meta.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Necesitás una cuenta de Instagram Business o Creator</li>
                <li>La cuenta debe estar conectada a una Página de Facebook</li>
                <li>El acceso se puede revocar en cualquier momento desde Meta</li>
              </ul>
              <a href={connectUrl}>
                <Button className="w-full">
                  Conectar con Instagram
                </Button>
              </a>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
