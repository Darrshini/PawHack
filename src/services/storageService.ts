import { supabase } from '../lib/supabase'

const BUCKET = 'pet-photos'
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Please upload a JPEG, PNG, or WebP image.'
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'Image must be smaller than 5 MB.'
  }
  return null
}

export async function uploadPetPhoto(
  userId: string,
  petId: string,
  file: File
): Promise<string> {
  const validationError = validateImageFile(file)
  if (validationError) throw new Error(validationError)

  const ext = file.name.split('.').pop() ?? 'jpg'
  const timestamp = Date.now()
  const path = `${userId}/${petId}/profile-${timestamp}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) {
    console.error('uploadPetPhoto error:', error)
    throw new Error('Failed to upload photo. Please try again.')
  }

  return path
}

export async function getPetPhotoUrl(path: string): Promise<string | null> {
  if (!path) return null

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60) // 1 hour

  if (error) {
    console.error('getPetPhotoUrl error:', error)
    return null
  }

  return data.signedUrl
}

export async function deletePetPhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) {
    console.error('deletePetPhoto error:', error)
    throw new Error('Failed to delete photo.')
  }
}
