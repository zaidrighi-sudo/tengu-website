"use client"

import { useId, useRef, useState } from "react"
import { prepareImageUpload } from "./prepare-image-upload"

type Props = {
  /** Name of the hidden input that carries the media id to the form action. */
  name: string
  label: string
  /** Existing media id on edit forms. */
  defaultValue?: string
  /** Existing image URL used for the preview. */
  defaultUrl?: string
  hint?: string
  required?: boolean
  /** Notified with the media id (or "") and preview URL whenever the image changes. */
  onChange?: (id: string, url: string) => void
}

/**
 * Admin image picker: uploads a picture from the device and submits the stored
 * media id with the surrounding form, so no URL or media id has to be typed.
 */
export function ImageUploadField({
  name,
  label,
  defaultValue = "",
  defaultUrl = "",
  hint,
  required,
  onChange,
}: Props) {
  const inputId = useId()
  const fileInput = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(defaultValue)
  const [preview, setPreview] = useState(defaultUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const hasImage = Boolean(value || preview)

  function apply(id: string, url: string) {
    setValue(id)
    setPreview(url)
    onChange?.(id, url)
  }

  /** Convert a File to a base64 data URL using FileReader API. */
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (err) => reject(err)
    })
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError("")
    setUploading(true)
    try {
      console.log('[ImageUpload] File selected:', { name: file.name, type: file.type, size: file.size })

      // Optionally resize large photos client-side before upload.
      const prepared = await prepareImageUpload(file)
      console.log('[ImageUpload] Prepared file:', { name: prepared.file.name, type: prepared.file.type, size: prepared.file.size })

      // Convert to base64 data URL for reliable server-side storage.
      const base64 = await fileToBase64(prepared.file)
      console.log('[ImageUpload] Base64 length:', base64.length)

      const res = await fetch("/api/media/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64,
          filename: prepared.file.name,
          mimeType: prepared.file.type,
        }),
      })

      console.log('[ImageUpload] Server response status:', res.status)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? "Upload failed. Please try again.")
      }

      const uploaded = await res.json()
      console.log('[ImageUpload] Upload success:', { id: uploaded.id, url: uploaded.url })
      apply(uploaded.id, uploaded.url)
    } catch (cause) {
      console.error('[ImageUpload] Error:', cause)
      setError(cause instanceof Error ? cause.message : "Upload failed. Please try again.")
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  return (
    <div className="admin-field">
      <span className="admin-field-label" id={`${inputId}-label`}>
        {label}
        {required ? " *" : ""}
      </span>

      <input type="hidden" name={name} value={value} />
      <input
        ref={fileInput}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
        className="admin-upload-input"
        onChange={(event) => handleFile(event.target.files?.[0])}
        disabled={uploading}
        aria-labelledby={`${inputId}-label`}
      />

      <div className="admin-upload-row">
        <div className={`admin-upload-preview${preview ? " has-image" : ""}`}>
          {preview ? (
            <img src={preview} alt="" />
          ) : (
            <span>{uploading ? "Uploading…" : "No image"}</span>
          )}
        </div>

        <div className="admin-upload-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : hasImage ? "Replace image" : "Choose image"}
          </button>
          {hasImage && (
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => apply("", "")}
              disabled={uploading}
            >
              Remove
            </button>
          )}
          <p className="admin-upload-hint">
            {hint ?? "Add a picture from your device. Large photos are resized automatically."}
          </p>
        </div>
      </div>

      {error && <span className="admin-field-error">{error}</span>}
    </div>
  )
}
