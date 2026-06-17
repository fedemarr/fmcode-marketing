# FMCODE AI Marketing Platform

Plataforma interna para gestionar el marketing de clientes con IA.  
Operador único: Fede. Stack: Next.js + PostgreSQL + Claude API + Instagram Graph API.

---

## Setup local

### 1. Clonar y dependencias
```bash
git clone <tu-repo>
cd fmcode-marketing-platform
npm install
```

### 2. Variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 3. Base de datos (Neon)
1. Crear cuenta en [neon.tech](https://neon.tech) (free tier)
2. Crear un proyecto llamado `fmcode-marketing`
3. Copiar la connection string a `DATABASE_URL` y `DIRECT_URL` en `.env`

```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Correr en desarrollo
```bash
npm run dev
# http://localhost:3000
```

---

## Servicios que necesitás configurar

### Claude API (Anthropic)
- Ir a [console.anthropic.com](https://console.anthropic.com)
- Crear API key
- Pegar en `ANTHROPIC_API_KEY`

### Instagram Graph API (Meta)
1. Ir a [developers.facebook.com](https://developers.facebook.com)
2. Crear una app → tipo "Business"
3. Agregar producto "Instagram Basic Display"
4. Configurar OAuth redirect: `https://tu-dominio.vercel.app/api/auth/instagram/callback`
5. Pegar `INSTAGRAM_APP_ID` y `INSTAGRAM_APP_SECRET`

**Para conectar la cuenta de Instagram de cada cliente:**
- Desde la UI del cliente, habrá un botón "Conectar Instagram"
- Redirige al OAuth de Meta
- El token se guarda en la tabla `Client`

### Cloudinary (imágenes)
- Cuenta gratuita en [cloudinary.com](https://cloudinary.com)
- Copiar cloud name, API key y secret

---

## Flujo de uso

```
1. Crear cliente con sus datos
2. Click "Generar contenido de [mes]"
3. El agente IA genera la estrategia + 16-20 posts del mes
4. Los posts aparecen como DRAFT en la pantalla de aprobación
5. Revisás cada post: Aprobar / Editar / Rechazar
6. Los aprobados quedan como SCHEDULED
7. Vercel Cron los publica automáticamente en Instagram
8. Al día siguiente se recolectan las métricas
9. El próximo mes, el agente usa esas métricas para mejorar
```

---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) |
| `DIRECT_URL` | Same as DATABASE_URL (requerido por Neon) |
| `AUTH_SECRET` | Secret para NextAuth (generar con `openssl rand -base64 32`) |
| `ADMIN_EMAIL` | Tu email de acceso al dashboard |
| `ADMIN_PASSWORD` | Tu password de acceso |
| `ANTHROPIC_API_KEY` | API key de Claude |
| `INSTAGRAM_APP_ID` | App ID de Meta |
| `INSTAGRAM_APP_SECRET` | App Secret de Meta |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud en Cloudinary |
| `CLOUDINARY_API_KEY` | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary |
| `NEXT_PUBLIC_APP_URL` | URL de tu app (ej: `https://fmcode-marketing.vercel.app`) |
| `CRON_SECRET` | Secret para proteger los endpoints de cron |

---

## Comandos

```bash
npm run dev              # Desarrollo local
npm run build            # Build de producción
npm run typecheck        # Verificar tipos TypeScript
npx prisma migrate dev   # Nueva migración
npx prisma studio        # UI para ver la DB
npm run db:seed          # Datos de prueba
```

---

## Deploy en Vercel

```bash
npm i -g vercel
vercel --prod
```

Agregar todas las variables de entorno en el dashboard de Vercel.  
Los cron jobs se activan automáticamente desde `vercel.json`.

---

## Arquitectura del sistema

Ver `CLAUDE.md` para instrucciones completas sobre el código y la arquitectura.

### Estructura de carpetas clave

```
src/
├── app/api/              # API Routes
│   ├── clients/          # CRUD clientes
│   ├── content/[id]/     # Aprobar / rechazar posts
│   ├── calendar/generate # Generar calendario mensual con IA
│   ├── publish/          # Publicación manual
│   └── cron/             # Jobs automáticos (Vercel Cron)
├── services/
│   ├── ai/               # Agente de marketing (Claude)
│   ├── instagram/        # Instagram Graph API
│   └── storage/          # Cloudinary
└── lib/                  # DB, errores, validaciones
```

### Agregar una nueva red social (futuro)

1. Crear `src/services/tiktok/` con `client.ts`, `publish.ts`, `metrics.ts`
2. Agregar `TIKTOK` al enum `Platform` en el schema de Prisma
3. Agregar la columna de token/accountId al modelo `Client`
4. El calendario ya soporta múltiples plataformas — solo asignar la plataforma en `CalendarSlot`

No hay que tocar el agente de IA ni el calendario — están diseñados para ser agnósticos a la plataforma.
