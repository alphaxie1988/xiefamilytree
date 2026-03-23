'use client'

import { useState } from 'react'
import type { FamilyMember, FamilyMemberUpdate, FamilyMemberInsert } from '@/lib/types'
import { nextGenerationName } from '@/lib/treeUtils'

interface Props {
  member: FamilyMember
  onClose: () => void
  onUpdate: (id: number, updates: FamilyMemberUpdate) => Promise<void>
  onAddChild: (parentId: number, member: FamilyMemberInsert) => Promise<void>
}

type Tab = 'edit' | 'add'

export function EditModal({ member, onClose, onUpdate, onAddChild }: Props) {
  const [tab, setTab] = useState<Tab>('edit')

  // Edit form state
  const [line1, setLine1] = useState(member.line1)
  const [line2, setLine2] = useState(member.line2 ?? '')
  const [line3, setLine3] = useState(member.line3 ?? '')
  const [position, setPosition] = useState(member.position ?? '')
  const [isDeceased, setIsDeceased] = useState(member.is_deceased)
  const [notes, setNotes] = useState(member.notes ?? '')

  // Add child form state
  const nextGen = nextGenerationName(member.position)
  const [cLine1, setCLine1] = useState('')
  const [cLine2, setCLine2] = useState('')
  const [cLine3, setCLine3] = useState('')
  const [cPosition, setCPosition] = useState(nextGen)
  const [cDeceased, setCDeceased] = useState(false)

  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onUpdate(member.id, {
      line1: line1.trim() || member.line1,
      line2: line2.trim() || null,
      line3: line3.trim() || null,
      position: position.trim() || null,
      is_deceased: isDeceased,
      notes: notes.trim() || null,
    })
    setSaving(false)
    onClose()
  }

  async function handleAddChild() {
    if (!cLine1.trim()) return
    setSaving(true)
    await onAddChild(member.id, {
      line1: cLine1.trim(),
      line2: cLine2.trim() || null,
      line3: cLine3.trim() || null,
      position: cPosition.trim() || nextGen,
      is_deceased: cDeceased,
      notes: null,
      refs: null,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-backdrop absolute inset-0 flex items-center justify-center z-50 p-4">
      <div
        className="edit-modal rounded-lg w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gold/20">
          <div>
            <h2 className="text-gold font-chinese font-semibold text-lg leading-tight">
              {member.line1}
            </h2>
            {member.position && (
              <p className="text-gold/50 text-xs font-chinese">{member.position}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gold/40 hover:text-gold transition-colors text-xl leading-none pb-1"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gold/20">
          {(['edit', 'add'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-chinese transition-colors ${
                tab === t
                  ? 'text-gold border-b-2 border-gold'
                  : 'text-gold/40 hover:text-gold/70'
              }`}
            >
              {t === 'edit' ? '✎ 編輯 Edit' : '＋ 新增子孫 Add Child'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {tab === 'edit' ? (
            <>
              <Field label="姓名 Name *" value={line1} onChange={setLine1} />
              <Field label="配偶 Spouse 1" value={line2} onChange={setLine2} placeholder="e.g. 陳氏" />
              <Field label="配偶 Spouse 2" value={line3} onChange={setLine3} placeholder="optional" />
              <Field label="世代 Generation" value={position} onChange={setPosition} placeholder="e.g. 一世" />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDeceased}
                    onChange={e => setIsDeceased(e.target.checked)}
                    className="accent-gold w-4 h-4"
                  />
                  <span className="text-gold/80 text-sm font-chinese">已故 Deceased</span>
                </label>
              </div>
              <Field label="備註 Notes" value={notes} onChange={setNotes} placeholder="optional notes" multiline />
            </>
          ) : (
            <>
              <p className="text-gold/50 text-xs font-chinese">
                Adding child to <strong className="text-gold/80">{member.line1}</strong> ({member.position})
              </p>
              <Field label="姓名 Name *" value={cLine1} onChange={setCLine1} placeholder="Child's name" />
              <Field label="配偶 Spouse 1" value={cLine2} onChange={setCLine2} placeholder="e.g. 陳氏" />
              <Field label="配偶 Spouse 2" value={cLine3} onChange={setCLine3} placeholder="optional" />
              <Field label="世代 Generation" value={cPosition} onChange={setCPosition} />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cDeceased}
                  onChange={e => setCDeceased(e.target.checked)}
                  className="accent-gold w-4 h-4"
                />
                <span className="text-gold/80 text-sm font-chinese">已故 Deceased</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button onClick={onClose} className="btn-ghost text-sm">
            取消 Cancel
          </button>
          <button
            onClick={tab === 'edit' ? handleSave : handleAddChild}
            disabled={saving || (tab === 'add' && !cLine1.trim())}
            className="btn-primary text-sm disabled:opacity-40"
          >
            {saving ? '儲存中…' : tab === 'edit' ? '儲存 Save' : '新增 Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
}) {
  return (
    <div className="space-y-1">
      <label className="text-gold/60 text-xs font-chinese block">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="edit-input resize-none text-sm"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="edit-input text-sm"
        />
      )}
    </div>
  )
}
