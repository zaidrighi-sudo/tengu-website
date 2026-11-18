/**
 * Shared product constants used by both admin and storefront
 */

export const SIZE_OPTIONS = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL',
  'One size',
] as const

export const FIT_OPTIONS = [
  'Slim',
  'Regular',
  'Relaxed',
  'Oversized',
] as const

export type SizeOption = typeof SIZE_OPTIONS[number]
export type FitOption = typeof FIT_OPTIONS[number]