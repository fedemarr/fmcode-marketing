import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Usuario admin (Fede)
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "admin1234", 12)

  await db.user.upsert({
    where: { email: process.env.ADMIN_EMAIL ?? "fede@fmcode.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL ?? "fede@fmcode.com",
      password: hashedPassword,
      name: "Fede FMCODE",
    },
  })

  // Cliente de prueba
  await db.client.upsert({
    where: { id: "seed-client-001" },
    update: {},
    create: {
      id: "seed-client-001",
      name: "Veterinaria San Miguel",
      industry: "Veterinaria / Salud animal",
      description:
        "Veterinaria de barrio en San Miguel, Zona Norte GBA. 15 años de experiencia. Servicios: consultas, vacunación, cirugías, estética canina y felina, guardería, venta de alimentos y accesorios.",
      targetAudience:
        "Dueños de mascotas de San Miguel, José C. Paz y alrededores. Principalmente mujeres de 25-50 años que tratan a sus mascotas como parte de la familia. Preocupados por la salud y el bienestar del animal.",
      objectives:
        "Generar más turnos online, posicionarse como la veterinaria de referencia de la zona, aumentar ventas de productos premium.",
      communicationTone:
        "Cálido, cercano, como hablarle a un vecino. Profesional pero no frío. Con mucho amor por los animales. Emojis ocasionales.",
      postFrequency: 4,
      instagramHandle: "veteriariasanmiguel",
    },
  })

  console.log("✅ Seed completado")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
