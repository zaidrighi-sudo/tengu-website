import { WILAYAS, wilayaLabel } from "@/features/delivery/algeria"
import { communeLabel, communesForWilaya } from "@/features/delivery/communes"
import type { Address, Errors } from "@/features/checkout/utils"
import { SelectField, TextField } from "@/features/checkout/Field"
import { t } from "@/shared/i18n"

type Props = {
  /** Field id prefix and error key prefix, e.g. `ship`. */
  prefix: string
  /** HTML autocomplete section. */
  section: "shipping" | "billing"
  value: Address
  onChange: (patch: Partial<Address>) => void
  /** Error to show for a field id, or "" while it is untouched. */
  errorFor: (id: string) => string
  onBlurField: (id: string) => void
}

/** Algerian address block: name, mobile, wilaya, commune and street. */
export function AddressFields({
  prefix,
  section,
  value,
  onChange,
  errorFor,
  onBlurField,
}: Props) {
  const id = (key: keyof Address) => `${prefix}-${key}`
  const common = (key: keyof Address, token: string) => ({
    id: id(key),
    autoComplete: `${section} ${token}`,
    value: value[key],
    error: errorFor(id(key)),
    onBlur: () => onBlurField(id(key)),
    onValueChange: (next: string) => onChange({ [key]: next }),
  })

  const communeOptions = value.region
    ? communesForWilaya(value.region).map((commune) => ({
        value: commune.name,
        label: communeLabel(commune),
      }))
    : []
  // Keep a saved commune that is not in the dataset selectable instead of blank.
  if (value.city && !communeOptions.some((option) => option.value === value.city)) {
    communeOptions.unshift({ value: value.city, label: value.city })
  }

  return (
    <div className="field-grid">
      <TextField
        {...common("firstName", "given-name")}
        label={t("First name")}
        autoCapitalize="words"
      />
      <TextField
        {...common("lastName", "family-name")}
        label={t("Last name")}
        autoCapitalize="words"
      />
      <TextField
        {...common("phone", "tel")}
        label={t("Mobile number")}
        type="tel"
        inputMode="tel"
        placeholder="05 50 12 34 56"
        className="span-2"
        hint={t("The courier calls this number before delivery.")}
      />
      <SelectField
        id={id("region")}
        label={t("Wilaya")}
        className="span-2"
        autoComplete={`${section} address-level1`}
        value={value.region}
        placeholder={t("Select your wilaya")}
        options={WILAYAS.map((wilaya) => ({
          value: wilaya.name,
          label: wilayaLabel(wilaya),
        }))}
        error={errorFor(id("region"))}
        onBlur={() => onBlurField(id("region"))}
        onValueChange={(next) => onChange({ region: next, city: "" })}
      />
      <SelectField
        id={id("city")}
        label={t("Commune")}
        className="span-2"
        autoComplete={`${section} address-level2`}
        value={value.city}
        placeholder={t("Select your commune")}
        options={communeOptions}
        disabled={!value.region}
        hint={value.region ? undefined : t("Select your wilaya first.")}
        error={errorFor(id("city"))}
        onBlur={() => onBlurField(id("city"))}
        onValueChange={(next) => onChange({ city: next })}
      />
      <TextField
        {...common("address1", "address-line1")}
        label={t("Address")}
        className="span-2"
        placeholder={t("Street, building, number")}
      />
      <TextField
        {...common("address2", "address-line2")}
        label={t("Landmark")}
        optional
        className="span-2"
        hint={t("Anything that helps the courier find you.")}
      />
    </div>
  )
}

export type { Errors }
