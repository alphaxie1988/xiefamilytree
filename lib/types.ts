export interface FamilyMember {
  id: number
  line1: string           // person's name
  line2: string | null    // first spouse
  line3: string | null    // second spouse
  position: string | null // generation label (一世, 二世 ...)
  refs: number[] | null   // children IDs
  is_deceased: boolean
  notes: string | null
  created_at?: string
  updated_at?: string
}

export type FamilyMemberUpdate = Partial<Omit<FamilyMember, 'id' | 'created_at' | 'updated_at'>>
export type FamilyMemberInsert = Omit<FamilyMember, 'id' | 'created_at' | 'updated_at'>
