'use client'

import { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import * as d3 from 'd3'
import type { FamilyMember, FamilyMemberUpdate, FamilyMemberInsert } from '@/lib/types'
import { computeLayout, type LayoutNode, type LayoutLink, NODE_W, NODE_H, GAP_Y } from '@/lib/treeUtils'
import { EditModal } from './EditModal'

interface Props {
  members: FamilyMember[]
  canEdit: boolean
}

export function FamilyTreeCanvas({ members: initialMembers, canEdit }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const { nodes, links } = useMemo(() => computeLayout(members), [members])

  // Set up D3 zoom once
  useEffect(() => {
    const svg = svgRef.current
    const g = gRef.current
    if (!svg || !g) return

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.04, 4])
      .on('zoom', event => {
        d3.select(g).attr('transform', event.transform.toString())
      })

    zoomRef.current = zoom
    d3.select(svg).call(zoom)

    // Centre root node at top of viewport
    const { clientWidth: w, clientHeight: h } = svg
    d3.select(svg).call(
      zoom.transform,
      d3.zoomIdentity.translate(w / 2, h * 0.08).scale(0.55)
    )

    return () => { d3.select(svg).on('.zoom', null) }
  }, [])

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
      // Create the new member
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      })
      if (!res.ok) throw new Error(await res.text())
      const created: FamilyMember = await res.json()

      // Update parent's refs
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

  const selectedMember = members.find(m => m.id === selectedId) ?? null

  function zoomIn() {
    const svg = svgRef.current
    if (!svg || !zoomRef.current) return
    d3.select(svg).transition().duration(300).call(zoomRef.current.scaleBy, 1.4)
  }
  function zoomOut() {
    const svg = svgRef.current
    if (!svg || !zoomRef.current) return
    d3.select(svg).transition().duration(300).call(zoomRef.current.scaleBy, 1 / 1.4)
  }
  function zoomFit() {
    const svg = svgRef.current
    if (!svg || !zoomRef.current || !nodes.length) return
    const { clientWidth: w, clientHeight: h } = svg
    const xs = nodes.map(n => n.x)
    const ys = nodes.map(n => n.y)
    const minX = Math.min(...xs) - NODE_W / 2 - 20
    const maxX = Math.max(...xs) + NODE_W / 2 + 20
    const minY = Math.min(...ys) - NODE_H / 2 - 20
    const maxY = Math.max(...ys) + NODE_H / 2 + 20
    const scale = Math.min(w / (maxX - minX), h / (maxY - minY), 1) * 0.92
    const tx = w / 2 - scale * ((minX + maxX) / 2)
    const ty = h / 2 - scale * ((minY + maxY) / 2)
    d3.select(svg).transition().duration(600).call(
      zoomRef.current.transform,
      d3.zoomIdentity.translate(tx, ty).scale(scale)
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Parchment bg */}
      <div className="absolute inset-0 parchment-bg pointer-events-none" />

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        onClick={e => { if (e.target === svgRef.current) setSelectedId(null) }}
      >
        <defs>
          {/* Gold glow filter */}
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Hover gold filter */}
          <filter id="hover-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feFlood floodColor="#C9A84C" floodOpacity="0.4" result="color"/>
            <feComposite in="color" in2="blur" operator="in" result="glow"/>
            <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Drop shadow */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.5)"/>
          </filter>
        </defs>
        <g ref={gRef}>
          {/* Links — rendered first (behind nodes) */}
          {links.map((link, i) => (
            <TreeLink key={`link-${link.source.data.id}-${link.target.data.id}`} link={link} index={i} />
          ))}
          {/* Nodes */}
          {nodes.map((node, i) => (
            <PersonNode
              key={node.data.id}
              node={node}
              canEdit={canEdit}
              isSelected={selectedId === node.data.id}
              animIndex={i}
              onClick={() => { if (canEdit) setSelectedId(node.data.id) }}
            />
          ))}
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
        <button className="zoom-btn" onClick={zoomIn} title="Zoom in">＋</button>
        <button className="zoom-btn" onClick={zoomFit} title="Fit" style={{ fontSize: 13 }}>⊞</button>
        <button className="zoom-btn" onClick={zoomOut} title="Zoom out">－</button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 text-xs font-chinese opacity-60 space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded" style={{ background: '#1A0800', border: '1px solid #C9A84C' }}/>
          <span className="text-ink">在世 Living</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded" style={{ background: '#2A1A2A', border: '1px solid #8B6914', opacity: 0.8 }}/>
          <span className="text-ink">已故 Deceased</span>
        </div>
        {canEdit && (
          <p className="text-ink/70 mt-1 italic text-[10px]">Click node to edit</p>
        )}
      </div>

      {/* Save spinner */}
      {saving && (
        <div className="absolute top-4 right-4 bg-wood-dark/80 text-gold text-xs px-3 py-2 rounded font-chinese border border-gold/30">
          儲存中… Saving…
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded text-sm font-chinese border transition-all
          ${toast.ok
            ? 'bg-wood-dark/90 text-gold border-gold/40'
            : 'bg-red-trad/80 text-white border-red-900'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Edit modal */}
      {selectedMember && canEdit && (
        <EditModal
          member={selectedMember}
          onClose={() => setSelectedId(null)}
          onUpdate={handleUpdate}
          onAddChild={handleAddChild}
        />
      )}
    </div>
  )
}

/* ── Tree Link (orthogonal connector) ── */
function TreeLink({ link, index }: { link: LayoutLink; index: number }) {
  const { source: s, target: t } = link
  const sy = s.y + NODE_H / 2
  const ty = t.y - NODE_H / 2
  const my = (sy + ty) / 2

  const d = `M ${s.x},${sy} V ${my} H ${t.x} V ${ty}`
  const delay = 0.1 + index * 0.015

  return (
    <path
      className="tree-link"
      d={d}
      fill="none"
      stroke="var(--connector)"
      strokeWidth={1.5}
      style={{ animationDelay: `${delay}s` }}
    />
  )
}

/* ── Person Node ── */
const HALF_W = NODE_W / 2
const HALF_H = NODE_H / 2

function PersonNode({
  node, canEdit, isSelected, animIndex, onClick,
}: {
  node: LayoutNode
  canEdit: boolean
  isSelected: boolean
  animIndex: number
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const { data } = node
  const isDeceased = data.is_deceased

  const delay = `${0.05 + animIndex * 0.018}s`
  const filter = isSelected ? 'url(#hover-glow)' : hovered ? 'url(#glow)' : 'url(#shadow)'
  const fill = isDeceased ? '#1E1025' : '#1A0800'
  const borderColor = isSelected ? '#E8C875' : hovered ? '#C9A84C' : '#7A5020'

  return (
    /* Outer g: SVG position only — CSS animation must NOT be on this element */
    <g transform={`translate(${node.x},${node.y})`}>
      {/* Inner g: CSS fade-in + interactivity */}
      <g
        className="node-group"
        style={{ animationDelay: delay, cursor: canEdit ? 'pointer' : 'default' }}
        filter={filter}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Card background */}
        <rect
          x={-HALF_W} y={-HALF_H}
          width={NODE_W} height={NODE_H}
          rx={3} ry={3}
          fill={fill}
          stroke={borderColor}
          strokeWidth={isSelected ? 2 : 1.5}
        />
        {/* Inner fine border */}
        <rect
          x={-HALF_W + 4} y={-HALF_H + 4}
          width={NODE_W - 8} height={NODE_H - 8}
          rx={1}
          fill="none"
          stroke={isDeceased ? 'rgba(139,105,20,0.3)' : 'rgba(201,168,76,0.2)'}
          strokeWidth={0.6}
        />
        {/* Top decorative rule */}
        <line
          x1={-HALF_W + 8} y1={-HALF_H + 11}
          x2={HALF_W - 8}  y2={-HALF_H + 11}
          stroke="rgba(201,168,76,0.35)" strokeWidth={0.5}
        />
        {/* Bottom decorative rule (above generation label) */}
        <line
          x1={-HALF_W + 8} y1={HALF_H - 15}
          x2={HALF_W - 8}  y2={HALF_H - 15}
          stroke="rgba(201,168,76,0.35)" strokeWidth={0.5}
        />

        {/* Horizontal text */}
        <NodeText data={data} />

        {/* Deceased dagger */}
        {isDeceased && (
          <text
            x={HALF_W - 6} y={-HALF_H + 9}
            textAnchor="end" fontSize={7}
            fill="rgba(180,150,100,0.55)"
            fontFamily="Noto Serif SC, serif"
          >†</text>
        )}

        {/* Generation label */}
        {data.position && (
          <text
            x={0} y={HALF_H - 5}
            textAnchor="middle" fontSize={8}
            fill="rgba(201,168,76,0.65)"
            fontFamily="Noto Serif SC, serif"
            letterSpacing="0.5"
          >
            {data.position}
          </text>
        )}
      </g>
    </g>
  )
}

/* Horizontal text rows inside a node */
function NodeText({ data }: { data: FamilyMember }) {
  type Row = { text: string; fill: string; size: number }
  const rows: Row[] = [
    {
      text: clip(data.line1, 11),
      fill: data.line1 === '-' ? 'rgba(245,230,200,0.3)' : '#F5E6C8',
      size: adaptSize(data.line1, 13),
    },
    ...(data.line2 ? [{ text: clip(data.line2, 13), fill: '#DAA520', size: adaptSize(data.line2, 10) }] : []),
    ...(data.line3 ? [{ text: clip(data.line3, 13), fill: '#B8860B', size: adaptSize(data.line3, 9)  }] : []),
  ]

  // Stack rows top-down, centred in the node's text area
  const GAP = 3
  const totalH = rows.reduce((s, r) => s + r.size, 0) + GAP * (rows.length - 1)
  let y = -HALF_H + 14 + rows[0].size  // top-pad + first baseline

  return (
    <>
      {rows.map((row, i) => {
        const baseline = i === 0 ? y : (y += GAP + row.size, y)
        return (
          <text
            key={i}
            x={0}
            y={baseline}
            textAnchor="middle"
            fontSize={row.size}
            fill={row.fill}
            fontFamily="Noto Serif SC, serif"
            fontWeight={i === 0 ? '500' : '300'}
          >
            {row.text}
          </text>
        )
      })}
    </>
  )
}

/** Truncate with ellipsis */
function clip(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

/** Shrink font if text is too wide for the node */
function adaptSize(text: string, base: number): number {
  // rough px width: CJK char ≈ base, Latin/digit ≈ base * 0.6
  const est = text.split('').reduce((w, c) =>
    w + (/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(c) ? base : base * 0.6), 0)
  const maxW = NODE_W - 14
  if (est <= maxW) return base
  return Math.max(7, Math.floor(base * maxW / est))
}

function VerticalChars({
  text, x, centerY, fontSize, fill, maxH, topY,
}: {
  text: string; x: number; centerY: number; fontSize: number
  fill: string; maxH: number; topY: number
}) {
  // Split into characters (handle parenthetical groups)
  const chars = text.split('')
  const charH = fontSize + 2
  const maxChars = Math.floor(maxH / charH)
  const display = chars.slice(0, maxChars)
  const totalH = display.length * charH
  const startY = topY

  return (
    <>
      {display.map((char, i) => (
        <text
          key={i}
          x={x}
          y={startY + i * charH + fontSize}
          textAnchor="middle"
          fontSize={fontSize}
          fill={fill}
          fontFamily="Noto Serif SC, serif"
          fontWeight={i === 0 ? '400' : '300'}
        >
          {char}
        </text>
      ))}
    </>
  )
}
