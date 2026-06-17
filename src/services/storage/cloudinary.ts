import { v2 as cloudinary } from "cloudinary"
import { env } from "@/lib/env"

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

export async function uploadImageFromUrl(imageUrl: string, postId: string): Promise<string> {
  const result = await cloudinary.uploader.upload(imageUrl, {
    public_id: `posts/${postId}`,
    overwrite: true,
    folder: "fmcode-marketing",
  })
  return result.secure_url
}

export async function uploadImageFromBase64(base64: string, postId: string): Promise<string> {
  const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64}`, {
    public_id: `posts/${postId}`,
    overwrite: true,
    folder: "fmcode-marketing",
  })
  return result.secure_url
}

export async function deleteImage(postId: string): Promise<void> {
  await cloudinary.uploader.destroy(`fmcode-marketing/posts/${postId}`)
}
