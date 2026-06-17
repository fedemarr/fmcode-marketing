# FMCODE AI Marketing Platform — Claude Code Instructions

## Contexto del proyecto
Plataforma interna para FMCODE (agencia de IA y desarrollo web, Buenos Aires).
Uso exclusivo de Fede (operador único). Gestiona el marketing de clientes en Instagram con IA.
NO es un SaaS. NO tiene usuarios externos. NO necesita multi-tenancy.

## Stack
- **Framework**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript (strict)
- **Estilos**: Tailwind CSS + shadcn/ui
- **ORM**: Prisma
- **Base de datos**: PostgreSQL (Neon serverless)
- **IA**: Anthropic Claude API (claude-sonnet-4-6)
- **Auth**: NextAuth.js (credenciales simples — solo Fede usa esto)
- **Deploy**: Vercel
- **Cron jobs**: Vercel Cron
- **Storage de imágenes**: Cloudinary (free tier)
- **Scheduling**: Vercel Cron + Instagram Graph API

## Arquitectura clave
- Monolito modular en Next.js. Todo en un solo repo y deploy.
- Los módulos de redes sociales son carpetas en `src/services/` — se agregan sin tocar el núcleo.
- El Calendario es el núcleo del sistema. Todo gira alrededor de CalendarEntry.
- El Agente IA vive en `src/services/ai/` — un servicio por responsabilidad.
- Los estados de Post siguen el flujo: DRAFT → PENDING_APPROVAL → APPROVED → SCHEDULED → PUBLISHED

## Convenciones de código
- Respuestas API siempre: `{ success: true, data: T }` o `{ success: false, error: { code, message } }`
- Siempre usar Zod para validación de inputs
- Soft delete en todas las entidades (campo `deletedAt`)
- Nunca `SELECT *` — siempre especificar campos con Prisma `select`
- Errores manejados centralizadamente, no try/catch en cada handler
- Variables de entorno: nunca hardcodear, siempre desde `process.env` validado con Zod en `src/lib/env.ts`

## Estructura de carpetas
```
src/
├── app/
│   ├── (dashboard)/          # Rutas protegidas del dashboard
│   │   ├── dashboard/        # Vista principal con KPIs
│   │   ├── clients/          # Lista y detalle de clientes
│   │   ├── calendar/         # Calendario mensual
│   │   ├── content/[id]/     # Vista de aprobación de post
│   │   └── metrics/          # Analítica general
│   ├── api/
│   │   ├── clients/          # CRUD clientes
│   │   ├── content/          # Generación y gestión de posts
│   │   ├── calendar/         # Generación de calendario
│   │   ├── publish/          # Publicación manual
│   │   └── cron/             # Jobs automáticos (Vercel Cron)
│   └── layout.tsx
├── components/
│   ├── ui/                   # shadcn components
│   ├── clients/              # Componentes de clientes
│   ├── calendar/             # Componentes de calendario
│   ├── content/              # Componentes de posts/aprobación
│   └── dashboard/            # Widgets del dashboard
├── lib/
│   ├── db.ts                 # Prisma client singleton
│   ├── auth.ts               # NextAuth config
│   ├── env.ts                # Variables de entorno validadas con Zod
│   ├── errors.ts             # AppError class
│   └── validations/          # Zod schemas por entidad
├── services/
│   ├── ai/
│   │   ├── agent.ts          # Agente principal de marketing
│   │   ├── strategy.ts       # Generación de estrategia mensual
│   │   ├── content.ts        # Generación de posts individuales
│   │   └── calendar.ts       # Generación del calendario mensual
│   ├── instagram/
│   │   ├── client.ts         # Instagram Graph API client
│   │   ├── publish.ts        # Publicación de posts
│   │   └── metrics.ts        # Recolección de métricas
│   └── storage/
│       └── cloudinary.ts     # Upload de imágenes
├── types/
│   └── index.ts              # Tipos globales (re-exports de Prisma + custom)
└── hooks/                    # Custom React hooks
```

## Flujo del agente IA
Al generar contenido mensual para un cliente:
1. `strategy.ts` analiza el negocio y genera la estrategia del mes
2. `calendar.ts` decide qué tipo de contenido va cada día según la estrategia
3. `content.ts` genera cada post con: objetivo, hook, caption, CTA, hashtags, prompt de imagen
4. Los posts se guardan en estado DRAFT
5. Fede ve los posts en la UI, aprueba/edita/rechaza
6. Los aprobados pasan a SCHEDULED
7. El cron de Vercel los publica en Instagram en la fecha/hora programada
8. Otro cron recolecta las métricas 24hs después
9. Las métricas se almacenan y alimentan al agente en futuras generaciones

## Variables de entorno requeridas
Ver `.env.example`

## Comandos principales
```bash
npm run dev              # Desarrollo local
npm run build            # Build producción
npx prisma migrate dev   # Aplicar migraciones
npx prisma studio        # Ver la DB en el browser
npm run db:seed          # Seed de datos de prueba
```

## Lo que NO hacer
- No agregar autenticación compleja — solo NextAuth con credenciales (email/password de Fede)
- No usar Redis — Vercel Cron es suficiente para esta escala
- No crear microservicios — todo en el monolito Next.js
- No poner lógica de negocio en los componentes React — va en servicios y API routes
- No borrar datos — siempre soft delete con `deletedAt`
