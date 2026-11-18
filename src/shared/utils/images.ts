/** Build a sized, cropped Unsplash image URL from a photo id. */
export const unsplash = (id: string, width = 900, quality = 85) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=${quality}`
