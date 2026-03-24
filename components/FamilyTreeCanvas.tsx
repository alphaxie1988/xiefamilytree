'use client'

import { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import * as d3 from 'd3'
import type { FamilyMember, FamilyMemberUpdate, FamilyMemberInsert } from '@/lib/types'
import { computeLayout, GEN_NAMES, type LayoutNode, type LayoutLink, NODE_W, NODE_H } from '@/lib/treeUtils'
import { EditModal } from './EditModal'

interface Props {
  members: FamilyMember[]
  canEdit: boolean
  isDark: boolean
  focusNodeId?: number | null
}

// Theme colour palettes for SVG elements
const DARK = {
  canvas:          '#111827',
  nodeFill:        '#1F2937',
  nodeFillHover:   '#263347',
  nodeFillSel:     '#1a2e4a',
  border:          '#374151',
  borderHover:     '#6B7280',
  borderSel:       '#F59E0B',
  accent:          '#F59E0B',
  accentBar:       'rgba(245,158,11,0.22)',
  separator:       'rgba(255,255,255,0.07)',
  text1:           '#F9FAFB',
  text2:           '#CBD5E1',
  text3:           '#94A3B8',
  textDate:        '#6B7280',
  genLabel:        'rgba(156,163,175,0.7)',
  genLabelSel:     'rgba(245,158,11,0.9)',
  connector:       '#6B7280',
  glowColor:       '#F59E0B',
  shadowColor:     'rgba(0,0,0,0.6)',
}

const LIGHT = {
  canvas:          '#F1F5F9',
  nodeFill:        '#FFFFFF',
  nodeFillHover:   '#F8FAFC',
  nodeFillSel:     '#FFFBEB',
  border:          '#E2E8F0',
  borderHover:     '#94A3B8',
  borderSel:       '#D97706',
  accent:          '#D97706',
  accentBar:       'rgba(217,119,6,0.14)',
  separator:       'rgba(0,0,0,0.07)',
  text1:           '#0F172A',
  text2:           '#334155',
  text3:           '#64748B',
  textDate:        '#94A3B8',
  genLabel:        'rgba(100,116,139,0.8)',
  genLabelSel:     'rgba(217,119,6,0.95)',
  connector:       '#64748B',
  glowColor:       '#D97706',
  shadowColor:     'rgba(0,0,0,0.12)',
}

export function FamilyTreeCanvas({ members: initialMembers, canEdit, isDark, focusNodeId }: Props) {
  const T = isDark ? DARK : LIGHT

  const svgRef = useRef<SVGSVGElement>(null)
  const gRef   = useRef<SVGGElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const { nodes, links } = useMemo(() => computeLayout(members), [members])

  useEffect(() => {
    const svg = svgRef.current
    const g   = gRef.current
    if (!svg || !g) return

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.04, 4])
      .on('zoom', e => { d3.select(g).attr('transform', e.transform.toString()) })

    zoomRef.current = zoom
    d3.select(svg).call(zoom)

    const { clientWidth: w, clientHeight: h } = svg
    d3.select(svg).call(zoom.transform, d3.zoomIdentity.translate(w / 2, h * 0.08).scale(0.55))

    return () => { d3.select(svg).on('.zoom', null) }
  }, [])

  // Pan & zoom to focused search result
  useEffect(() => {
    if (focusNodeId == null || !svgRef.current || !zoomRef.current) return
    const node = nodes.find(n => n.data.id === focusNodeId)
    if (!node) return
    const { clientWidth: w, clientHeight: h } = svgRef.current
    const scale = 1.4
    d3.select(svgRef.current).transition().duration(500).call(
      zoomRef.current.transform,
      d3.zoomIdentity
        .translate(w / 2 - scale * node.x, h / 2 - scale * node.y)
        .scale(scale)
    )
  }, [focusNodeId, nodes])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2800)
  }

  const handleUpdate = useCallback(async (id: number, updates: FamilyMemberUpdate) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/family/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error(await res.text())
      const updated: FamilyMember = await res.json()
      setMembers(prev => prev.map(m => m.id === id ? updated : m))
      showToast('已儲存 Saved')
    } catch {
      showToast('儲存失敗 Save failed', false)
    } finally {
      setSaving(false)
    }
  }, [])

  const handleAddChild = useCallback(async (parentId: number, newMember: FamilyMemberInsert) => {
    setSaving(true)
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      })
      if (!res.ok) throw new Error(await res.text())
      const created: FamilyMember = await res.json()

      const parent = members.find(m => m.id === parentId)
      const updatedRefs = [...(parent?.refs ?? []), created.id]
      const patchRes = await fetch(`/api/family/${parentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refs: updatedRefs }),
      })
      if (!patchRes.ok) throw new Error(await patchRes.text())
      const updatedParent: FamilyMember = await patchRes.json()

      setMembers(prev => [...prev.map(m => m.id === parentId ? updatedParent : m), created])
      showToast('已新增 Added')
    } catch {
      showToast('新增失敗 Add failed', false)
    } finally {
      setSaving(false)
    }
  }, [members])

  const handleDelete = useCallback(async (id: number) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/family/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      setMembers(prev => prev
        .filter(m => m.id !== id)
        .map(m => ({ ...m, refs: m.refs ? m.refs.filter(r => r !== id) : null }))
      )
      setSelectedId(null)
      showToast('已刪除 Deleted')
    } catch {
      showToast('刪除失敗 Delete failed', false)
    } finally {
      setSaving(false)
    }
  }, [])

  const selectedNode   = nodes.find(n => n.data.id === selectedId) ?? null
  const selectedMember = selectedNode?.data ?? null
  const canDelete      = selectedNode != null && selectedNode.children.length === 0

  function zoomIn()  { const s = svgRef.current; if (s && zoomRef.current) d3.select(s).transition().duration(300).call(zoomRef.current.scaleBy, 1.4) }
  function zoomOut() { const s = svgRef.current; if (s && zoomRef.current) d3.select(s).transition().duration(300).call(zoomRef.current.scaleBy, 1/1.4) }
  function zoomFit() {
    const svg = svgRef.current
    if (!svg || !zoomRef.current || !nodes.length) return
    const { clientWidth: w, clientHeight: h } = svg
    const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y)
    const minX = Math.min(...xs) - NODE_W/2 - 20, maxX = Math.max(...xs) + NODE_W/2 + 20
    const minY = Math.min(...ys) - NODE_H/2 - 20, maxY = Math.max(...ys) + NODE_H/2 + 20
    const scale = Math.min(w / (maxX - minX), h / (maxY - minY), 1) * 0.92
    d3.select(svg).transition().duration(600).call(
      zoomRef.current.transform,
      d3.zoomIdentity.translate(w/2 - scale*((minX+maxX)/2), h/2 - scale*((minY+maxY)/2)).scale(scale)
    )
  }

  const toastBg = toast?.ok
    ? (isDark ? 'bg-gray-800 text-amber-400 border-gray-700' : 'bg-white text-amber-700 border-amber-200')
    : (isDark ? 'bg-red-950 text-red-300 border-red-800'    : 'bg-red-50  text-red-600  border-red-200')

  return (
    <div className="relative w-full h-full">
      <div className="canvas-bg absolute inset-0 pointer-events-none" />

      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        onClick={e => { if (e.target === svgRef.current) setSelectedId(null) }}
      >
        <defs>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="sel-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feFlood floodColor={T.glowColor} floodOpacity="0.35" result="color"/>
            <feComposite in="color" in2="blur" operator="in" result="g"/>
            <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={T.shadowColor}/>
          </filter>
        </defs>

        <g ref={gRef}>
          {/* Group links by parent so each parent draws one stem + one bar */}
          {Object.values(
            links.reduce<Record<number, LayoutLink[]>>((acc, link) => {
              const pid = link.source.data.id
              ;(acc[pid] ??= []).push(link)
              return acc
            }, {})
          ).map((group, gi) => (
            <ParentConnector key={`pc-${group[0].source.data.id}`} links={group} groupIndex={gi} color={T.connector} />
          ))}
          {nodes.map((node, i) => (
            <PersonNode
              key={node.data.id}
              node={node}
              T={T}
              canEdit={canEdit}
              isSelected={selectedId === node.data.id}
              isFocused={focusNodeId === node.data.id}
              animIndex={i}
              onClick={() => { if (canEdit) setSelectedId(node.data.id) }}
            />
          ))}
        </g>
      </svg>

      {/* Zoom controls — hidden on mobile, visible on md+ */}
      <div className="hidden md:flex absolute right-4 flex-col gap-2" style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <button className="zoom-btn" onClick={zoomIn}  title="Zoom in">＋</button>
        <button className="zoom-btn" onClick={zoomFit} title="Fit" style={{ fontSize: 13 }}>⊞</button>
        <button className="zoom-btn" onClick={zoomOut} title="Zoom out">－</button>
      </div>

      {canEdit && (
        <div
          className="absolute left-4 text-[10px] italic opacity-50"
          style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))', color: isDark ? '#9CA3AF' : '#64748B' }}
        >
          Tap node to edit
        </div>
      )}

      {saving && (
        <div className={`absolute top-4 right-4 text-xs px-3 py-2 rounded-lg border font-chinese ${isDark ? 'bg-gray-800 text-amber-400 border-gray-700' : 'bg-white text-amber-700 border-amber-200'}`}>
          儲存中… Saving…
        </div>
      )}

      {toast && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-chinese border shadow-lg ${toastBg}`}>
          {toast.msg}
        </div>
      )}

      {selectedMember && canEdit && (
        <EditModal
          member={selectedMember}
          canDelete={canDelete}
          isDark={isDark}
          onClose={() => setSelectedId(null)}
          onUpdate={handleUpdate}
          onAddChild={handleAddChild}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

/* ── Parent Connector — one stem + bar + drops per sibling group ── */
function ParentConnector({ links, groupIndex, color }: { links: LayoutLink[]; groupIndex: number; color: string }) {
  const parent = links[0].source
  const allChildren = links.map(l => l.target)
  // Only draw connectors for children that don't have hide_line set
  const visibleChildren = allChildren.filter(c => !c.data.hide_line)

  if (visibleChildren.length === 0) return null

  const stemY  = parent.y + NODE_H / 2               // bottom of parent card
  const dropY  = visibleChildren[0].y - NODE_H / 2   // top of child cards
  const elbowY = (stemY + dropY) / 2                 // halfway

  const xs       = visibleChildren.map(c => c.x)
  // Always include parent.x so the bar connects the stem to any offset child
  const barLeft  = Math.min(...xs, parent.x)
  const barRight = Math.max(...xs, parent.x)

  const delay = `${0.1 + groupIndex * 0.03}s`
  const props = { fill: 'none', stroke: color, strokeWidth: 2, className: 'tree-link', style: { animationDelay: delay } }

  return (
    <g>
      {/* Single stem down from parent */}
      <line {...props} x1={parent.x} y1={stemY} x2={parent.x} y2={elbowY} />
      {/* Horizontal bar — spans from parent.x to all visible children */}
      {barLeft < barRight && (
        <line {...props} x1={barLeft} y1={elbowY} x2={barRight} y2={elbowY} />
      )}
      {/* Drop from bar to each visible child */}
      {visibleChildren.map(child => (
        <line key={child.data.id} {...props} x1={child.x} y1={elbowY} x2={child.x} y2={dropY} />
      ))}
    </g>
  )
}

/* ── Person Node ── */
const HALF_W = NODE_W / 2
const HALF_H = NODE_H / 2

type Theme = typeof DARK

function PersonNode({
  node, T, canEdit, isSelected, isFocused, animIndex, onClick,
}: {
  node: LayoutNode
  T: Theme
  canEdit: boolean
  isSelected: boolean
  isFocused: boolean
  animIndex: number
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const { data, depth } = node
  const genLabel = GEN_NAMES[depth] ?? `${depth + 1}世`

  const fill        = isSelected ? T.nodeFillSel : hovered ? T.nodeFillHover : T.nodeFill
  const borderColor = isSelected ? T.borderSel   : hovered ? T.borderHover   : T.border
  const filter      = isSelected ? 'url(#sel-glow)' : hovered ? 'url(#glow)' : 'url(#shadow)'

  return (
    <g transform={`translate(${node.x},${node.y})`}>
      <g
        className="node-group"
        style={{ animationDelay: `${0.05 + animIndex * 0.018}s`, cursor: canEdit ? 'pointer' : 'default' }}
        filter={filter}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Focus ring (search result) */}
        {isFocused && (
          <rect
            x={-HALF_W - 3} y={-HALF_H - 3}
            width={NODE_W + 6} height={NODE_H + 6}
            rx={9} ry={9}
            fill="none"
            stroke={T.accent}
            strokeWidth={2}
            strokeDasharray="5 3"
            opacity={0.9}
          />
        )}
        {/* Card */}
        <rect
          x={-HALF_W} y={-HALF_H}
          width={NODE_W} height={NODE_H}
          rx={6} ry={6}
          fill={fill}
          stroke={borderColor}
          strokeWidth={isSelected ? 1.5 : 1}
        />
        {/* Top accent bar */}
        <rect
          x={-HALF_W + 8} y={-HALF_H + 5}
          width={NODE_W - 16} height={2.5}
          rx={1.5}
          fill={isSelected ? T.accent : T.accentBar}
        />
        {/* Bottom separator */}
        <line
          x1={-HALF_W + 8} y1={HALF_H - 17}
          x2={HALF_W - 8}  y2={HALF_H - 17}
          stroke={T.separator} strokeWidth={1}
        />

        <NodeText data={data} T={T} />

        {/* Notes tooltip on hover */}
        {hovered && data.notes && (
          <NotesTooltip notes={data.notes} T={T} />
        )}

        {/* Generation label (auto-computed from depth) */}
        <text
          x={0} y={HALF_H - 5}
          textAnchor="middle" fontSize={8}
          fill={isSelected ? T.genLabelSel : T.genLabel}
          fontFamily="Inter, sans-serif"
          letterSpacing="0.8"
        >
          {genLabel}
        </text>
      </g>
    </g>
  )
}

/** Split text at first `(` so dates appear on a new line */
function splitAtParen(text: string): [string, string | null] {
  const idx = text.indexOf('(')
  if (idx === -1) return [text, null]
  return [text.slice(0, idx).trimEnd(), text.slice(idx)]
}

function NodeText({ data, T }: { data: FamilyMember; T: Theme }) {
  type Row = { text: string; fill: string; size: number; weight: string }

  function makeRows(raw: string | null, fill: string, dateColor: string, mainWeight: string): Row[] {
    if (!raw) return []
    const [main, paren] = splitAtParen(raw)
    const rows: Row[] = [{ text: clip(main, 13), fill, size: adaptSize(main, 14), weight: mainWeight }]
    if (paren) rows.push({ text: clip(paren, 15), fill: dateColor, size: 11, weight: '400' })
    return rows
  }

  const rows: Row[] = [
    ...makeRows(data.line1, data.line1 === '-' ? `${T.text1}33` : T.text1, T.textDate, '700'),
    ...makeRows(data.line2, T.text2, T.textDate, '700'),
    ...makeRows(data.line3, T.text3, T.textDate, '700'),
  ]

  const GAP = 2
  let y = -HALF_H + 16 + (rows[0]?.size ?? 14)

  return (
    <>
      {rows.map((row, i) => {
        const baseline = i === 0 ? y : (y += GAP + row.size, y)
        return (
          <text
            key={i}
            x={0} y={baseline}
            textAnchor="middle"
            fontSize={row.size}
            fill={row.fill}
            fontFamily="Noto Serif SC, Inter, sans-serif"
            fontWeight={row.weight}
          >
            {row.text}
          </text>
        )
      })}
    </>
  )
}

function NotesTooltip({ notes, T }: { notes: string; T: Theme }) {
  const MAX_CHARS = 24
  const raw = notes.split('\n').flatMap(l => {
    const chunks: string[] = []
    for (let i = 0; i < l.length; i += MAX_CHARS) chunks.push(l.slice(i, i + MAX_CHARS))
    return chunks.length ? chunks : ['']
  }).slice(0, 5)

  const lineH = 14
  const pad = 8
  const h = raw.length * lineH + pad * 2
  const w = 160

  return (
    <g transform={`translate(0, ${-HALF_H - h - 6})`} style={{ pointerEvents: 'none' }}>
      <rect
        x={-w / 2} y={0} width={w} height={h} rx={6}
        fill={T.nodeFill} stroke={T.borderSel} strokeWidth={1}
        style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.35))' }}
      />
      {/* Arrow pointing down */}
      <polygon
        points={`-5,${h} 5,${h} 0,${h + 6}`}
        fill={T.nodeFill} stroke={T.borderSel} strokeWidth={1}
        strokeLinejoin="round"
      />
      <polygon points={`-4,${h - 1} 4,${h - 1} 0,${h + 5}`} fill={T.nodeFill} />
      {raw.map((line, i) => (
        <text
          key={i}
          x={0} y={pad + lineH * (i + 1) - 3}
          textAnchor="middle" fontSize={10}
          fill={T.text2}
          fontFamily="Noto Serif SC, Inter, sans-serif"
        >
          {line}
        </text>
      ))}
    </g>
  )
}

function clip(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

function adaptSize(text: string, base: number): number {
  const est = text.split('').reduce((w, c) =>
    w + (/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(c) ? base : base * 0.6), 0)
  const maxW = NODE_W - 16
  if (est <= maxW) return base
  return Math.max(7, Math.floor(base * maxW / est))
}
