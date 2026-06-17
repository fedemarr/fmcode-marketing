"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const nav = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/clients", label: "Clientes", icon: "👥" },
  { href: "/admin/posts", label: "Posts", icon: "✍" },
  { href: "/admin/errors", label: "Errores N8N", icon: "⚠" },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="w-60 bg-white border-r flex flex-col">
      <div className="p-4 border-b">
        <span className="font-bold text-lg">FMCODE Admin</span>
        <span className="text-xs text-red-500 block">Panel interno</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === href || (href !== "/admin" && pathname.startsWith(href))
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <span>{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t space-y-1">
        <Link href="/dashboard" className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50">
          Ir al cliente →
        </Link>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
