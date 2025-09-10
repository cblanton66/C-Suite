// Access Gate Configuration
// To disable the access gate, change ENABLE_ACCESS_GATE to false

export const ENABLE_ACCESS_GATE = true
export const ACCESS_CODE = "goldstar"
export const SESSION_KEY = "peaksuiteai_access_granted"

export function hasValidAccess(): boolean {
  if (!ENABLE_ACCESS_GATE) return true
  
  if (typeof window === 'undefined') return false
  
  return sessionStorage.getItem(SESSION_KEY) === 'true'
}

export function grantAccess(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, 'true')
  }
}

export function revokeAccess(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY)
  }
}

export function validateAccessCode(code: string): boolean {
  if (!ENABLE_ACCESS_GATE) return true
  
  return code.toLowerCase().trim() === ACCESS_CODE.toLowerCase()
}