"use client"

import { useId, useRef, useState } from "react"
import { prepareImageUpload } from "./prepare-image-upload"

export type AdminProductImage = {
  /** Media document id returned by /api/media/upload. */
  mediaId: string
  url: string
  color: string
  colorHex: string
  isMain: boolean
  order: number
}

type CmsColor = { name: string; hex: string }

type PendingUpload = {
  key: string
  preview: string
  name: string
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Unlimited product gallery. Files are resized, uploaded straight away and
 * shown as cards where each image gets a color name/HEX, a main flag and an
 * order. Dragging files onto the drop zone works like the file picker.
 */
export function ProductImagesManager({
  value,
  onChange,
  colorOptions,
  disabled,
  error,
}: {
  value: AdminProductImage[]
  onChange: (images: AdminProductImage[]) => void
  colorOptions: CmsColor[]
  disabled?: boolean
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const datalistId = useId()
  const radioName = useId()
  const [dragOver, setDragOver] = useState(false)
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [uploadError, setUploadError] = useState("")
  // Keep the latest gallery available to async uploads that finish together.
  const valueRef = useRef(value)
  valueRef.current = value

  const setImages = (next: AdminProductImage[]) => {
    valueRef.current = next
    onChange(next)
  }

  function withOrder(images: AdminProductImage[]): AdminProductImage[] {
    const mainIndex = images.findIndex((image) => image.isMain)
    return images.map((image, index) => ({
      ...image,
      order: index,
      isMain: index === (mainIndex >= 0 ? mainIndex : 0),
    }))
  }

  async function uploadOne(file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadError(`"${file.name}" is not an image.`)
      return
    }

    const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const preview = URL.createObjectURL(file)
    setPending((current) => [...current, { key, preview, name: file.name }])
    setUploadError("")

    try {
      const prepared = await prepareImageUpload(file)
      const base64 = await fileToBase64(prepared.file)
      const response = await fetch("/api/media/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64,
          filename: prepared.file.name,
          mimeType: prepared.file.type,
        }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.error ?? "Upload failed.")
      }
      const uploaded = await response.json()
      const next = withOrder([
        ...valueRef.current,
        {
          mediaId: uploaded.id,
          url: uploaded.url ?? `/api/media/file/${uploaded.id}`,
          color: "",
          colorHex: "#000000",
          isMain: false,
          order: valueRef.current.length,
        },
      ])
      setImages(next)
    } catch (cause) {
      setUploadError(
        cause instanceof Error ? `"${file.name}" could not be uploaded: ${cause.message}` : "Upload failed.",
      )
    } finally {
      URL.revokeObjectURL(preview)
      setPending((current) => current.filter((item) => item.key !== key))
    }
  }

  function handleFiles(files: FileList | File[] | null) {
    if (!files) return
    const list = Array.from(files)
    if (list.length === 0) return
    for (const file of list) void uploadOne(file)
    if (inputRef.current) inputRef.current.value = ""
  }

  function updateImage(index: number, patch: Partial<AdminProductImage>) {
    const next = valueRef.current.map((image, i) => (i === index ? { ...image, ...patch } : image))
    setImages(next)
  }

  function handleColorName(index: number, name: string) {
    const match = colorOptions.find(
      (option) => option.name.toLowerCase() === name.trim().toLowerCase(),
    )
    updateImage(index, { color: name, ...(match ? { colorHex: match.hex } : {}) })
  }

  function setMain(index: number) {
    setImages(
      withOrder(
        valueRef.current.map((image, i) => ({ ...image, isMain: i === index })),
      ),
    )
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= valueRef.current.length) return
    const next = [...valueRef.current]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    setImages(withOrder(next))
  }

  function remove(index: number) {
    setImages(withOrder(valueRef.current.filter((_, i) => i !== index)))
  }

  const total = value.length + pending.length

  return (
    <div className="admin-images">
      <div
        className={`admin-images-dropzone${dragOver ? " is-dragover" : ""}${disabled ? " is-disabled" : ""}`}
        onDragOver={(event) => {
          if (disabled) return
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          if (disabled) return
          event.preventDefault()
          setDragOver(false)
          handleFiles(event.dataTransfer.files)
        }}
      >
        <svg className="admin-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        <p className="admin-images-dropzone-title">Drag &amp; drop images here</p>
        <p className="admin-upload-hint">PNG, JPG, WebP, GIF, AVIF or SVG. Add as many as you like.</p>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          Choose images
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
          multiple
          className="admin-upload-input"
          onChange={(event) => handleFiles(event.target.files)}
          disabled={disabled}
        />
        <datalist id={datalistId}>
          {colorOptions.map((option) => (
            <option key={option.name} value={option.name} />
          ))}
        </datalist>
      </div>

      {total === 0 && (
        <p className="admin-field-error" style={{ display: "block" }}>
          Add at least one image and link it to a color.
        </p>
      )}

      {(value.length > 0 || pending.length > 0) && (
        <div className="admin-images-grid">
          {value.map((image, index) => (
            <div className="admin-image-card" key={image.mediaId + index}>
              <div className="admin-image-preview">
                <img src={image.url} alt="" />
                {image.isMain && <span className="admin-image-main-badge">Main</span>}
              </div>

              <div className="admin-image-card-fields">
                <label className="admin-field">
                  <span className="admin-field-label">Color *</span>
                  <input
                    type="text"
                    list={datalistId}
                    value={image.color}
                    onChange={(event) => handleColorName(index, event.target.value)}
                    className={`admin-field-input${error && !image.color.trim() ? " error" : ""}`}
                    placeholder="e.g. Black"
                    disabled={disabled}
                  />
                </label>

                <div className="admin-image-color-row">
                  <input
                    type="color"
                    value={/^#[0-9a-f]{6}$/i.test(image.colorHex) ? image.colorHex : "#000000"}
                    onChange={(event) => updateImage(index, { colorHex: event.target.value.toUpperCase() })}
                    className="admin-color-input"
                    aria-label="Color HEX"
                    disabled={disabled}
                  />
                  <input
                    type="text"
                    value={image.colorHex}
                    onChange={(event) => updateImage(index, { colorHex: event.target.value })}
                    className="admin-field-input admin-color-hex"
                    placeholder="#000000"
                    aria-label="HEX code"
                    disabled={disabled}
                  />
                </div>

                <div className="admin-image-actions">
                  <label className="admin-image-main-toggle">
                    <input
                      type="radio"
                      name={radioName}
                      checked={image.isMain}
                      onChange={() => setMain(index)}
                      disabled={disabled}
                    />
                    <span>Main image</span>
                  </label>

                  <div className="admin-image-order">
                    <button
                      type="button"
                      className="admin-action-btn"
                      onClick={() => move(index, -1)}
                      disabled={disabled || index === 0}
                      aria-label="Move image up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="admin-action-btn"
                      onClick={() => move(index, 1)}
                      disabled={disabled || index === value.length - 1}
                      aria-label="Move image down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="admin-action-btn delete"
                      onClick={() => remove(index)}
                      disabled={disabled}
                      aria-label="Delete image"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {pending.map((item) => (
            <div className="admin-image-card is-uploading" key={item.key}>
              <div className="admin-image-preview">
                <img src={item.preview} alt="" />
                <span className="admin-upload-pending">
                  <span className="co-spinner" aria-hidden="true" /> Uploading…
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploadError && <span className="admin-field-error" style={{ display: "block" }}>{uploadError}</span>}
    </div>
  )
}
