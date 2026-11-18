export const PROFILE_IMAGE_TIMEOUT_MS = 12000

async function bounded(operation) {
  const controller = new AbortController()
  let timer
  try {
    return await Promise.race([
      operation(controller.signal),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Image request timed out. Please retry.')) }, PROFILE_IMAGE_TIMEOUT_MS) }),
    ])
  } finally { clearTimeout(timer) }
}

export async function persistProfileImage(client, userId, candidate) {
  const bucket = client.storage.from('profile-images')
  const result = await bounded(() => bucket.upload(candidate.path, candidate.file, { upsert: false, contentType: candidate.file.type }))
  if (result.error) {
    if (String(result.error.statusCode || result.error.status) !== '409') throw new Error('We could not upload the image. Please retry.')
    const [folder, filename] = candidate.path.split('/')
    const { data, error } = await bounded(() => bucket.list(folder, { limit: 100, search: filename }))
    const existing = data?.find(item => item.name === filename)
    if (error || Number(existing?.metadata?.size) !== candidate.file.size || existing?.metadata?.mimetype !== candidate.file.type) {
      throw new Error('We could not confirm the existing image. Please retry.')
    }
  }
  const { data: { publicUrl } } = bucket.getPublicUrl(candidate.path)
  try {
    const { error } = await bounded(signal => client.from('profiles').update({ profile_image_url: publicUrl }).eq('id', userId).abortSignal(signal))
    if (error) throw error
    return publicUrl
  } catch {
    // Never delete after an uncertain save: the database may already reference this image.
    const { data, error } = await bounded(signal => client.from('profiles').select('profile_image_url').eq('id', userId).maybeSingle().abortSignal(signal))
    if (!error && data?.profile_image_url === publicUrl) return publicUrl
    throw new Error('We could not confirm the image save. Retry image save. The uploaded image stays available for recovery.')
  }
}
