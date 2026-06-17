"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export default function ResolveErrorButton({ errorId }: { errorId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function resolve() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from("automation_errors").update({ resolved: true }).eq("id", errorId)
    setLoading(false)
    router.refresh()
  }

  return (
    <Button size="sm" variant="outline" onClick={resolve} disabled={loading} className="flex-shrink-0">
      {loading ? "..." : "Resolver"}
    </Button>
  )
}
