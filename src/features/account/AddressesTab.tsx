import { useMemo, useRef, useState } from "react"
import { AddressFields } from "@/features/checkout/AddressFields"
import { CheckField, ErrorSummary, TextField } from "@/features/checkout/Field"
import { Icon } from "@/shared/components/Icon"
import { type SavedAddress, type User, useAuth } from "@/features/auth/AuthContext"
import { wilayaDisplay } from "@/features/delivery/algeria"
import { type Address, emptyAddress, validateAddress } from "@/features/checkout/utils"
import { cn } from "@/shared/utils/cn"
import { useFormErrors } from "@/shared/utils/useFormErrors"
import { t, tr } from "@/shared/i18n"

type Draft = Address & { id?: string; label: string; isDefault: boolean }

const blank = (user: User): Draft => ({
  ...emptyAddress(),
  firstName: user.firstName,
  lastName: user.lastName,
  label: "",
  isDefault: user.addresses.length === 0,
})

export function AddressesTab({ user }: { user: User }) {
  const { saveAddress, removeAddress, setDefaultAddress } = useAuth()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const form = useRef<HTMLFormElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  const errors = useMemo(() => (draft ? validateAddress(draft, "addr") : {}), [draft])
  const { errorFor, touch, check, reset, shown } = useFormErrors(errors, form)

  const open = (next: Draft) => {
    reset()
    setDraft(next)
    requestAnimationFrame(() => heading.current?.focus())
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft || !check()) return
    const { label, ...address } = draft
    saveAddress({ ...address, label: label.trim() || "Address" })
    setDraft(null)
  }

  return (
    <div>
      <div className="acct-bar">
        <p>
          {user.addresses.length === 0
            ? t("Save an address to check out faster.")
            : t("{count} saved {unit}", {
                count: user.addresses.length,
                unit: user.addresses.length === 1 ? t("address") : t("addresses"),
              })}
        </p>
        {!draft && (
          <button type="button" className="btn btn-solid" onClick={() => open(blank(user))}>
            <span className="cart-checkout-label">
              <Icon name="plus" /> {t("Add address")}
            </span>
          </button>
        )}
      </div>

      {draft && (
        <form ref={form} noValidate onSubmit={submit} className="acct-form" aria-label={draft.id ? t("Edit address") : t("New address")}>
          <h2 ref={heading} tabIndex={-1} className="acct-form-title">
            {draft.id ? t("Edit address") : t("New address")}
          </h2>
          <ErrorSummary errors={shown} />
          <TextField
            id="addr-label"
            label={t("Label")}
            optional
            hint={t("For example Home or Studio.")}
            value={draft.label}
            maxLength={24}
            onValueChange={(label) => setDraft({ ...draft, label })}
          />
          <AddressFields
            prefix="addr"
            section="shipping"
            value={draft}
            onChange={(patch) => setDraft({ ...draft, ...patch })}
            errorFor={errorFor}
            onBlurField={touch}
          />
          <CheckField
            id="addr-default"
            label={t("Use as my default address")}
            checked={draft.isDefault}
            onCheckedChange={(isDefault) => setDraft({ ...draft, isDefault })}
          />
          <div className="acct-form-actions">
            <button type="button" className="co-link" onClick={() => setDraft(null)}>
              {t("Cancel")}
            </button>
            <button type="submit" className="btn btn-solid">
              {t("Save address")} <Icon name="arrow" />
            </button>
          </div>
        </form>
      )}

      {user.addresses.length === 0 && !draft ? (
        <div className="acct-empty">
          <Icon name="pin" />
          <h2>{t("No saved addresses")}</h2>
          <p>{t("Add one now and we will fill it in at checkout.")}</p>
        </div>
      ) : (
        <ul className="addr-grid">
          {user.addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              confirming={confirming === address.id}
              onEdit={() => open({ ...address })}
              onAskRemove={() => setConfirming(address.id)}
              onCancelRemove={() => setConfirming(null)}
              onRemove={() => {
                removeAddress(address.id)
                setConfirming(null)
              }}
              onDefault={() => setDefaultAddress(address.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function AddressCard({
  address,
  confirming,
  onEdit,
  onAskRemove,
  onCancelRemove,
  onRemove,
  onDefault,
}: {
  address: SavedAddress
  confirming: boolean
  onEdit: () => void
  onAskRemove: () => void
  onCancelRemove: () => void
  onRemove: () => void
  onDefault: () => void
}) {
  return (
    <li className={cn("addr-card", address.isDefault && "is-default")}>
      <div className="addr-card-head">
        <h3>{tr(address.label)}</h3>
        {address.isDefault && <span className="tag">{t("Default")}</span>}
      </div>
      <address className="acct-address">
        {tr(address.firstName)} {tr(address.lastName)}
        <br />
        {tr(address.address1)}
        {address.address2 && <>, {tr(address.address2)}</>}
        <br />
        {tr(address.city)}, {wilayaDisplay(address.region)}
        {address.phone && (
          <>
            <br />
            {tr(address.phone)}
          </>
        )}
      </address>
      {confirming ? (
        <div className="addr-confirm" role="alert">
          <p>{t("Remove this address?")}</p>
          <div>
            <button type="button" className="btn btn-solid" onClick={onRemove}>
              {t("Remove")}
            </button>
            <button type="button" className="btn" onClick={onCancelRemove}>
              {t("Keep")}
            </button>
          </div>
        </div>
      ) : (
        <div className="addr-actions">
          <button type="button" className="link-btn" onClick={onEdit}>
            {t("Edit")}<span className="sr-only"> {tr(address.label)}</span>
          </button>
          <button type="button" className="link-btn" onClick={onAskRemove}>
            {t("Remove")}<span className="sr-only"> {tr(address.label)}</span>
          </button>
          {!address.isDefault && (
            <button type="button" className="link-btn" onClick={onDefault}>
              {t("Make default")}<span className="sr-only">: {tr(address.label)}</span>
            </button>
          )}
        </div>
      )}
    </li>
  )
}
