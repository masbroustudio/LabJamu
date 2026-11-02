/**
 * Origin Private File System (OPFS) & Thumbnail Utilities
 * Privacy-Preserving On-Device Storage — Zero Cloud Retention for raw biometric face images.
 */

/**
 * Access the OPFS root directory handle.
 */
async function getOPFSRoot(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) {
    console.warn('[OPFS] Origin Private File System is not supported in this browser environment.')
    return null
  }
  return await navigator.storage.getDirectory()
}

/**
 * Save a raw full-resolution image Blob to OPFS.
 * @param relativePath e.g. "scans/session_123.jpg"
 * @param blob The image binary Blob
 */
export async function saveToOPFS(relativePath: string, blob: Blob): Promise<boolean> {
  try {
    const root = await getOPFSRoot()
    if (!root) return false

    const parts = relativePath.split('/')
    let currentDir = root

    // Navigate or create subdirectories if needed
    for (let i = 0; i < parts.length - 1; i++) {
      currentDir = await currentDir.getDirectoryHandle(parts[i], { create: true })
    }

    const fileName = parts[parts.length - 1]
    const fileHandle = await currentDir.getFileHandle(fileName, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(blob)
    await writable.close()

    return true
  } catch (err) {
    console.error('[OPFS] Failed to save file:', relativePath, err)
    return false
  }
}

/**
 * Read a file Blob from OPFS.
 */
export async function readFromOPFS(relativePath: string): Promise<Blob | null> {
  try {
    const root = await getOPFSRoot()
    if (!root) return null

    const parts = relativePath.split('/')
    let currentDir = root

    for (let i = 0; i < parts.length - 1; i++) {
      currentDir = await currentDir.getDirectoryHandle(parts[i], { create: false })
    }

    const fileName = parts[parts.length - 1]
    const fileHandle = await currentDir.getFileHandle(fileName, { create: false })
    return await fileHandle.getFile()
  } catch (err) {
    console.warn('[OPFS] File not found or read error:', relativePath, err)
    return null
  }
}

/**
 * Read a file from OPFS and return a browser Object URL (blob:...).
 */
export async function readFromOPFSAsUrl(relativePath: string): Promise<string | null> {
  const blob = await readFromOPFS(relativePath)
  if (!blob) return null
  return URL.createObjectURL(blob)
}

/**
 * Delete a file from OPFS.
 */
export async function deleteFromOPFS(relativePath: string): Promise<boolean> {
  try {
    const root = await getOPFSRoot()
    if (!root) return false

    const parts = relativePath.split('/')
    let currentDir = root

    for (let i = 0; i < parts.length - 1; i++) {
      currentDir = await currentDir.getDirectoryHandle(parts[i], { create: false })
    }

    const fileName = parts[parts.length - 1]
    await currentDir.removeEntry(fileName)
    return true
  } catch (err) {
    console.warn('[OPFS] Delete entry error:', relativePath, err)
    return false
  }
}

/**
 * Purge all files in OPFS root.
 */
export async function purgeAllOPFS(): Promise<boolean> {
  try {
    const root = await getOPFSRoot()
    if (!root) return false

    // @ts-ignore - values() iteration
    for await (const entry of (root as any).values()) {
      await root.removeEntry(entry.name, { recursive: true })
    }
    return true
  } catch (err) {
    console.error('[OPFS] Purge failed:', err)
    return false
  }
}

/**
 * Generate a lightweight 256x256 WebP thumbnail data URL from a canvas.
 */
export function generateThumbnailDataUrl(canvas: HTMLCanvasElement, maxDim = 256): string {
  const thumbCanvas = document.createElement('canvas')
  const scale = Math.min(maxDim / canvas.width, maxDim / canvas.height, 1)
  thumbCanvas.width = Math.round(canvas.width * scale)
  thumbCanvas.height = Math.round(canvas.height * scale)

  const ctx = thumbCanvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height)
    return thumbCanvas.toDataURL('image/webp', 0.8)
  }
  return canvas.toDataURL('image/jpeg', 0.6)
}
