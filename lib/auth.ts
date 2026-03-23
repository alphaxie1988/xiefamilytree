import { AUTHORIZED_EDITORS } from './constants'

export function isAuthorizedEditor(email: string | undefined | null): boolean {
  if (!email) return false
  return AUTHORIZED_EDITORS.map(e => e.toLowerCase()).includes(email.toLowerCase())
}
