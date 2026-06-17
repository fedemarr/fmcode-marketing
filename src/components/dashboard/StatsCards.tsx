import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  stats: { pending: number; scheduled: number; published: number; total: number }
}

export default function StatsCards({ stats }: Props) {
  const cards = [
    { title: "Para aprobar", value: stats.pending, color: "text-yellow-600" },
    { title: "Programados", value: stats.scheduled, color: "text-blue-600" },
    { title: "Publicados", value: stats.published, color: "text-green-600" },
    { title: "Total del mes", value: stats.total, color: "text-gray-700" },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ title, value, color }) => (
        <Card key={title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
