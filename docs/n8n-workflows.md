# N8N Workflows — FMCODE Marketing

## Resumen

N8N maneja todo el trabajo pesado con IA y la publicación en Instagram. Next.js solo actúa como orquestador liviano:
- Dispara webhooks a N8N cuando Fede aprueba un post
- Recibe webhooks de N8N con los resultados

---

## Workflow 1: Generación de Contenido Mensual

**Trigger**: Webhook POST `/webhook/generate-content`
**Payload de entrada**:
```json
{
  "company_id": "uuid",
  "month": 6,
  "year": 2026
}
```

**Pasos**:
1. Buscar datos de la empresa en Supabase (nombre, industria, descripción, tono, público objetivo)
2. Llamar a Claude (claude-sonnet-4-6) para generar la estrategia del mes
3. Para cada semana del mes, llamar a Claude para generar los posts de esa semana
4. Para cada post, llamar a Pollinations.ai para generar la imagen:
   ```
   GET https://image.pollinations.ai/prompt/{image_prompt}?width=1080&height=1080&nologo=true
   ```
5. Enviar webhook a Next.js con todos los posts generados:

**Payload de salida** → `POST {APP_URL}/api/webhooks/n8n`:
```json
{
  "event": "content_generated",
  "data": {
    "company_id": "uuid",
    "posts": [
      {
        "company_id": "uuid",
        "platform": "instagram",
        "content_type": "feed_post",
        "objective": "Aumentar engagement",
        "hook": "¿Sabías que...?",
        "caption": "Texto del post...",
        "cta": "Guardá este post ⬇️",
        "hashtags": ["marketing", "ia", "contenido"],
        "image_prompt": "Professional photo of...",
        "image_url": "https://image.pollinations.ai/...",
        "scheduled_at": "2026-06-10T18:00:00Z",
        "n8n_execution_id": "exec_123"
      }
    ]
  }
}
```
Header: `X-N8N-Secret: {N8N_WEBHOOK_SECRET}`

---

## Workflow 2: Publicar Post Aprobado

**Trigger**: Webhook POST `/webhook/publish-post`
**Payload de entrada**:
```json
{
  "post_id": "uuid",
  "scheduled_at": "2026-06-10T18:00:00Z"
}
```

**Pasos**:
1. Buscar datos del post en Supabase (caption, hashtags, image_url, company_id)
2. Buscar el access_token de Instagram para esa empresa en `social_accounts`
3. Verificar que `scheduled_at` sea en el futuro y calcular delay
4. En el momento de publicación:
   a. Subir imagen a Instagram Media Container:
      ```
      POST https://graph.facebook.com/v18.0/{ig-user-id}/media
      { image_url, caption: "{caption}\n\n{hashtags}" }
      ```
   b. Publicar el container:
      ```
      POST https://graph.facebook.com/v18.0/{ig-user-id}/media_publish
      { creation_id: "{container_id}" }
      ```
5. Enviar resultado a Next.js:

**Payload de salida (éxito)** → `POST {APP_URL}/api/webhooks/n8n`:
```json
{
  "event": "post_published",
  "data": {
    "post_id": "uuid",
    "platform_post_id": "18xxx"
  }
}
```

**Payload de salida (error)**:
```json
{
  "event": "post_failed",
  "data": {
    "post_id": "uuid",
    "error": "Mensaje de error",
    "execution_id": "exec_456",
    "workflow": "publish-post"
  }
}
```

---

## Workflow 3: Recolección de Métricas

**Trigger**: Schedule — todos los días a las 10:00 AM UTC
**Pasos**:
1. Buscar todos los posts publicados en las últimas 48hs en Supabase
2. Para cada post, llamar a la Instagram Graph API:
   ```
   GET https://graph.facebook.com/v18.0/{media_id}/insights
   ?metric=likes,comments,shares,saved,reach,impressions
   &access_token={access_token}
   ```
3. Calcular engagement_rate: `(likes + comments + shares + saves) / reach * 100`
4. Enviar métricas a Next.js:

**Payload de salida** → `POST {APP_URL}/api/webhooks/n8n`:
```json
{
  "event": "metrics_updated",
  "data": {
    "post_id": "uuid",
    "metrics": {
      "likes": 45,
      "comments": 8,
      "shares": 3,
      "saves": 12,
      "reach": 1200,
      "impressions": 1450,
      "engagement_rate": 5.67
    }
  }
}
```

---

## Workflow 4: Retry de Workflows Fallidos

**Trigger**: Webhook POST `/webhook/retry-workflow`
**Payload de entrada**:
```json
{
  "execution_id": "exec_456"
}
```

**Pasos**:
1. Buscar la ejecución fallida en N8N por ID
2. Re-ejecutar el workflow con los mismos parámetros
3. Actualizar el registro en `automation_errors` cuando termine

---

## Variables de entorno en N8N

Configurar en N8N → Settings → Environment Variables:

| Variable | Descripción |
|----------|-------------|
| `NEXT_WEBHOOK_URL` | URL de Next.js (ej: `https://tu-dominio.vercel.app`) |
| `NEXT_WEBHOOK_SECRET` | Mismo valor que `N8N_WEBHOOK_SECRET` en Next.js |
| `SUPABASE_URL` | URL de Supabase |
| `SUPABASE_SERVICE_KEY` | Service role key de Supabase |
| `ANTHROPIC_API_KEY` | API key de Anthropic |

---

## Autenticación entre Next.js y N8N

Todas las llamadas usan el header `X-N8N-Secret`.

- **Next.js → N8N**: Next.js envía `X-N8N-Secret: {N8N_WEBHOOK_SECRET}`
- **N8N → Next.js**: N8N envía `X-N8N-Secret: {N8N_WEBHOOK_SECRET}`, Next.js lo valida en `/api/webhooks/n8n/route.ts`
