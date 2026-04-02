import { useState } from 'react'
import { ImagePlus } from 'lucide-react'

async function compressImage(file, maxKB = 100) {
  const img = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const scale = img.width > 1200 ? 1200 / img.width : 1
  canvas.width  = Math.round(img.width  * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)

  let blob, quality = 0.9
  do {
    blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality))
    quality -= 0.1
  } while (blob.size > maxKB * 1024 && quality > 0.2)

  return blob
}

export default function ImageUpload({ onBlob }) {
  const [preview, setPreview] = useState(null)
  const [info, setInfo]       = useState('')
  const [loading, setLoading] = useState(false)

  async function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const blob = await compressImage(file)
      setPreview(URL.createObjectURL(blob))
      setInfo(`${Math.round(blob.size / 1024)} KB`)
      onBlob?.(blob)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer w-fit">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <ImagePlus size={14} />
          {loading ? 'Compressing…' : 'Choose image'}
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="sr-only"
        />
      </label>

      {preview && (
        <div>
          <img src={preview} alt="Reference" className="max-h-28 rounded border border-gray-200" />
          <p className="text-xs text-gray-400 mt-1">Compressed to {info}</p>
        </div>
      )}
    </div>
  )
}
