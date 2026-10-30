export type ItemStatus = 'open' | 'claimed'
export type ItemType = 'lost' | 'found'
export type Role = 'student' | 'security_staff' | 'admin'

export interface LostFoundItem {
  id: string
  type: ItemType
  title: string
  description: string
  category: string
  location: string
  /** null when the caller is not signed in (data minimisation, GDPR Art. 5(1)(c)) */
  contact: string | null
  status: ItemStatus
  created_at: string
}

export interface SessionUser {
  name: string
  email: string
  role: Role
}
