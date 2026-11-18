import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  changePassword as changePasswordOnServer,
  getSessionUser,
  saveAccount,
  signIn,
  signOut,
  signUp,
} from "@/app/(frontend)/auth-actions"
import { loginWithGoogle as loginWithGoogleServer } from "@/app/(frontend)/auth-actions"
import { type Address, emptyAddress } from "@/store/utils/checkout"

export type SavedAddress = Address & {
  id: string
  label: string
  isDefault: boolean
}

export type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  marketing: boolean
  createdAt: string
  addresses: SavedAddress[]
  /** Total DA spent on delivered orders; unlocks free home delivery at the CMS threshold. */
  lifetimeSpent: number
  avatar?: string
  provider?: string
}

/** Result from server actions - can be customer login, admin login, or failure. */
type AuthResult =
  | { ok: true; user: User; isAdmin?: false }
  | { ok: true; isAdmin: true; redirectTo: '/manage/dashboard' }
  | { ok: false; field?: string; message: string }

type Result = { ok: true } | { ok: false; field?: string; message: string }

type AuthValue = {
  user: User | null
  /** True while the visitor is not signed in: only the sign-in screens are available. */
  gate: boolean
  register: (input: {
    firstName: string
    lastName: string
    email: string
    password: string
    marketing: boolean
  }) => Promise<Result>
  login: (email: string, password: string, next?: string) => Promise<Result>
  loginWithGoogle: (next?: string) => Promise<Result>
  logout: () => void
  /** Re-read the account from the database (addresses, delivered spend) and update the session. */
  refreshSession: () => Promise<void>
  updateProfile: (
    patch: Pick<User, "firstName" | "lastName" | "email" | "phone" | "marketing">,
  ) => Result
  changePassword: (current: string, next: string) => Promise<Result>
  saveAddress: (address: Omit<SavedAddress, "id" | "isDefault"> & { id?: string; isDefault?: boolean }) => void
  removeAddress: (id: string) => void
  setDefaultAddress: (id: string) => void
}

const AuthContext = createContext<AuthValue | null>(null)

const randomId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).slice(0, 18)

const byDefault = (list: SavedAddress[]) =>
  [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault))

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode
  initialUser: User | null
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const latest = useRef<User | null>(initialUser)
  latest.current = user

  /** Show the change at once, then save it; the server's copy replaces ours. */
  const commit = useCallback((next: User) => {
    latest.current = next
    setUser(next)
    void saveAccount({
      firstName: next.firstName,
      lastName: next.lastName,
      phone: next.phone,
      marketing: next.marketing,
      addresses: next.addresses.map((address) => ({
        label: address.label,
        isDefault: address.isDefault,
        firstName: address.firstName,
        lastName: address.lastName,
        phone: address.phone,
        region: address.region,
        city: address.city,
        address1: address.address1,
        address2: address.address2,
      })),
    }).then((result) => {
      if (result.ok && !result.isAdmin) {
        latest.current = result.user
        setUser(result.user)
      }
    })
  }, [])

  const enter = useCallback((signedIn: User, next?: string) => {
    setUser(signedIn)
    // The page was rendered for a visitor: reload so the server sends the shop.
    // Use next parameter if provided (for hash-based routing), otherwise go to home
    window.location.assign(next || "/")
  }, [])

  const login: AuthValue["login"] = useCallback(
    async (email, password, next?: string) => {
      const result = await signIn({ email, password })
      if (!result.ok) return result
      // Admin login: redirect to admin panel
      if (result.isAdmin && result.redirectTo === '/manage/dashboard') {
        window.location.assign('/manage/dashboard')
        return { ok: true }
      }
      // Customer login: result has user property (type narrowed by checking isAdmin)
      const userResult = result as { ok: true; user: User; isAdmin?: false }
      enter(userResult.user, next)
      return { ok: true }
    },
    [enter],
  )

  const register: AuthValue["register"] = useCallback(
    async (input) => {
      const result = await signUp(input)
      if (!result.ok) return result
      // signUp always returns a user (no admin variant)
      const userResult = result as { ok: true; user: User }
      enter(userResult.user)
      return { ok: true }
    },
    [enter],
  )

  const logout = useCallback(() => {
    void signOut().finally(() => window.location.assign("/"))
  }, [])

  const refreshSession = useCallback(async () => {
    const result = await getSessionUser()
    if (result.ok) {
      latest.current = result.user
      setUser(result.user)
    }
  }, [])

  const updateProfile: AuthValue["updateProfile"] = useCallback(
    (patch) => {
      const current = latest.current
      if (!current) return { ok: false, message: "Please sign in again." }
      // The email is the account's login and stays as it is.
      commit({
        ...current,
        firstName: patch.firstName,
        lastName: patch.lastName,
        phone: patch.phone,
        marketing: patch.marketing,
      })
      return { ok: true }
    },
    [commit],
  )

  const changePassword: AuthValue["changePassword"] = useCallback(async (current, next) => {
    const result = await changePasswordOnServer({ current, next })
    return result.ok ? { ok: true } : result
  }, [])

  const loginWithGoogle: AuthValue["loginWithGoogle"] = useCallback(
    async (next?: string) => {
      const result = await loginWithGoogleServer({ next })
      if (!result.ok) return result
      // loginWithGoogleServer returns a redirect URL to the Google OAuth initiation endpoint
      if (result.redirectTo) {
        window.location.assign(result.redirectTo)
        return { ok: true }
      }
      return { ok: true }
    },
    [enter],
  )

  const saveAddress: AuthValue["saveAddress"] = useCallback(
    (address) => {
      const current = latest.current
      if (!current) return
      const id = address.id ?? randomId()
      const first = current.addresses.length === 0
      const makeDefault = address.isDefault || first
      const others = current.addresses
        .filter((a) => a.id !== id)
        .map((a) => (makeDefault ? { ...a, isDefault: false } : a))
      const previous = current.addresses.find((a) => a.id === id)
      const saved: SavedAddress = {
        ...emptyAddress(),
        ...address,
        id,
        isDefault: makeDefault || (previous?.isDefault ?? false),
      }
      commit({ ...current, addresses: byDefault([saved, ...others]) })
    },
    [commit],
  )

  const removeAddress = useCallback(
    (id: string) => {
      const current = latest.current
      if (!current) return
      const rest = current.addresses.filter((a) => a.id !== id)
      if (rest.length && !rest.some((a) => a.isDefault)) rest[0] = { ...rest[0], isDefault: true }
      commit({ ...current, addresses: rest })
    },
    [commit],
  )

  const setDefaultAddress = useCallback(
    (id: string) => {
      const current = latest.current
      if (!current) return
      commit({
        ...current,
        addresses: byDefault(current.addresses.map((a) => ({ ...a, isDefault: a.id === id }))),
      })
    },
    [commit],
  )

  const value = useMemo<AuthValue>(
    () => ({
      user,
      gate: user === null,
      register,
      login,
      loginWithGoogle,
      logout,
      refreshSession,
      updateProfile,
      changePassword,
      saveAddress,
      removeAddress,
      setDefaultAddress,
    }),
    [user, register, login, loginWithGoogle, logout, refreshSession, updateProfile, changePassword, saveAddress, removeAddress, setDefaultAddress],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>")
  return context
}
