const IG_API = "https://graph.facebook.com/v21.0"

async function igFetch(path: string, body: Record<string, unknown>, token: string) {
  const res = await fetch(`${IG_API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, access_token: token }),
  })
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error?.message ?? `Instagram API error ${res.status}`)
  return data
}

export async function publishFeedPost(
  accountId: string,
  token: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  const { id: containerId } = await igFetch(`/${accountId}/media`, {
    image_url: imageUrl,
    caption,
    media_type: "IMAGE",
  }, token)

  await new Promise(r => setTimeout(r, 2000))

  const { id: postId } = await igFetch(`/${accountId}/media_publish`, {
    creation_id: containerId,
  }, token)

  return postId
}

export async function publishCarousel(
  accountId: string,
  token: string,
  imageUrls: string[],
  caption: string
): Promise<string> {
  if (imageUrls.length < 2 || imageUrls.length > 10) {
    throw new Error("Carousel requires 2-10 images")
  }

  const itemIds: string[] = []
  for (const url of imageUrls) {
    const { id } = await igFetch(`/${accountId}/media`, {
      image_url: url,
      is_carousel_item: true,
    }, token)
    itemIds.push(id)
    await new Promise(r => setTimeout(r, 1000))
  }

  const { id: carouselId } = await igFetch(`/${accountId}/media`, {
    media_type: "CAROUSEL",
    caption,
    children: itemIds,
  }, token)

  await new Promise(r => setTimeout(r, 2000))

  const { id: postId } = await igFetch(`/${accountId}/media_publish`, {
    creation_id: carouselId,
  }, token)

  return postId
}

export async function publishStory(
  accountId: string,
  token: string,
  imageUrl: string
): Promise<string> {
  const { id: containerId } = await igFetch(`/${accountId}/media`, {
    image_url: imageUrl,
    media_type: "STORIES",
  }, token)

  await new Promise(r => setTimeout(r, 2000))

  const { id: postId } = await igFetch(`/${accountId}/media_publish`, {
    creation_id: containerId,
  }, token)

  return postId
}

export async function schedulePost(
  accountId: string,
  token: string,
  imageUrl: string,
  caption: string,
  publishTime: Date
): Promise<string> {
  const unixTime = Math.floor(publishTime.getTime() / 1000)

  const { id: containerId } = await igFetch(`/${accountId}/media`, {
    image_url: imageUrl,
    caption,
    media_type: "IMAGE",
    publish_time: unixTime,
    is_auto_repost: false,
  }, token)

  await new Promise(r => setTimeout(r, 2000))

  const { id: postId } = await igFetch(`/${accountId}/media_publish`, {
    creation_id: containerId,
  }, token)

  return postId
}

export async function getMetrics(mediaId: string, token: string) {
  const fields = "like_count,comments_count,reach,impressions,saved,shares_count"
  const res = await fetch(`${IG_API}/${mediaId}?fields=${fields}&access_token=${token}`)
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error?.message ?? "Instagram metrics error")
  return {
    likes: data.like_count ?? 0,
    comments: data.comments_count ?? 0,
    saves: data.saved ?? 0,
    shares: data.shares_count ?? 0,
    reach: data.reach ?? 0,
    impressions: data.impressions ?? 0,
  }
}
