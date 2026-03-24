'use client'

import { useState } from 'react'
import type { FamilyMember, FamilyMemberUpdate, FamilyMemberInsert } from '@/lib/types'

interface Props {
  member: FamilyMember
  canDelete: boolean
  isDark: boolean
  onClose: () => void
  onUpdate: (id: number, updates: FamilyMemberUpdate) => Promise<void>
  onAddChild: (parentId: number, member: FamilyMemberInsert) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

type Tab = 'edit' | 'add'

export function EditModal({ member, canDelete, isDark, onClose, onUpdate, onAddChild, onDelete }: Props) {
  const [tab, setTab] = useState<Tab>('edit')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [line1, setLine1] = useState(member.line1)
  const [line2, setLine2] = useState(member.line2 ?? '')
  const [line3, setLine3] = useState(member.line3 ?? '')
  const [notes, setNotes] = useState(member.notes ?? '')
  const [hideLine, setHideLine] = useState(member.hide_line ?? false)

  const [cLine1, setCLine1] = useState('')
  const [cLine2, setCLine2] = useState('')
  const [cLine3, setCLine3] = useState('')

  const [saving, setSaving] = useState(false)

  const D = isDark ? {
    modal:    'bg-gray-800 border-gray-700',
    header:   'border-gray-700',
    tabActive:'text-amber-400 border-amber-400',
    tabInact: 'text-gray-500 hover:text-gray-300',
    title:    'text-white',
    sub:      'text-gray-500',
    close:    'text-gray-600 hover:text-gray-300',
    label:    'text-gray-400',
    mutedTxt: 'text-gray-500',
    strongTxt:'text-gray-300',
  } : {
    modal:    'bg-white border-gray-200',
    header:   'border-gray-200',
    tabActive:'text-amber-600 border-amber-600',
    tabInact: 'text-gray-400 hover:text-gray-600',
    title:    'text-gray-900',
    sub:      'text-gray-400',
    close:    'text-gray-300 hover:text-gray-600',
    label:    'text-gray-500',
    mutedTxt: 'text-gray-400',
    strongTxt:'text-gray-700',
  }

  async function handleSave() {
    setSaving(true)
    await onUpdate(member.id, {
      line1: line1.trim() || member.line1,
      line2: line2.trim() || null,
      line3: line3.trim() || null,
      notes: notes.trim() || null,
      hide_line: hideLine,
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
      notes: null,
      refs:  null,
    })
    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    setSaving(true)
    await onDelete(member.id)
    setSaving(false)
  }

  return (
    <div className="modal-backdrop absolute inset-0 flex items-center justify-center z-50 p-4">
      <div
        className={`edit-modal rounded-xl w-full max-w-md border ${D.modal}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 pt-4 pb-3 border-b ${D.header}`}>
          <div>
            <h2 className={`font-chinese font-semibold text-lg leading-tight ${D.title}`}>{member.line1}</h2>
          </div>
          <button onClick={onClose} className={`text-xl leading-none pb-1 transition-colors ${D.close}`}>✕</button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${D.header}`}>
          {(['edit', 'add'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-chinese transition-colors ${tab === t ? `border-b-2 ${D.tabActive}` : D.tabInact}`}
            >
              {t === 'edit' ? '✎ 編輯 Edit' : '＋ 新增子孫 Add Child'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {tab === 'edit' ? (
            <>
              <Field label="姓名 Name *" value={line1} onChange={setLine1} isDark={isDark} D={D} />
              <Field label="配偶 Spouse 1" value={line2} onChange={setLine2} placeholder="e.g. 陳氏" isDark={isDark} D={D} />
              <Field label="配偶 Spouse 2" value={line3} onChange={setLine3} placeholder="optional" isDark={isDark} D={D} />
              <Field label="備註 Notes" value={notes} onChange={setNotes} placeholder="optional notes" multiline isDark={isDark} D={D} />
              <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={hideLine}
                  onChange={e => setHideLine(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className={`text-xs font-chinese ${D.label}`}>隱藏連線 Hide line to parent</span>
              </label>
            </>
          ) : (
            <>
              <p className={`text-xs font-chinese ${D.mutedTxt}`}>
                Adding child to <strong className={D.strongTxt}>{member.line1}</strong>
              </p>
              <Field label="姓名 Name *" value={cLine1} onChange={setCLine1} placeholder="Child's name" isDark={isDark} D={D} />
              <Field label="配偶 Spouse 1" value={cLine2} onChange={setCLine2} placeholder="e.g. 陳氏" isDark={isDark} D={D} />
              <Field label="配偶 Spouse 2" value={cLine3} onChange={setCLine3} placeholder="optional" isDark={isDark} D={D} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-5 pb-5`}>
          {/* Delete button (left side, only if leaf node) */}
          <div>
            {canDelete && tab === 'edit' && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${D.mutedTxt}`}>確定刪除?</span>
                  <button onClick={handleDelete} disabled={saving} className="btn-danger text-xs px-3 py-1.5">
                    確認
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className={`text-xs ${D.tabInact}`}>
                    取消
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="btn-danger text-xs px-3 py-1.5"
                >
                  🗑 刪除
                </button>
              )
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost text-sm">取消 Cancel</button>
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
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, multiline, isDark: _isDark, D,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
  isDark: boolean
  D: { label: string }
}) {
  return (
    <div className="space-y-1">
      <label className={`text-xs font-chinese block ${D.label}`}>{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="edit-input resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="edit-input"
        />
      )}
    </div>
  )
}
