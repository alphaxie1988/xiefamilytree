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
      opacity={0.55}
      style={{ animationDelay: `${delay}s` }}
    />
  )
}

/* ── Person Node ── */
const HALF_W = NODE_W / 2
const HALF_H = NODE_H / 2
const CHAR_H = 18   // pixels per Chinese character at fontSize 16
const CHAR_H_SM = 14 // for smaller fontSize

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

  const delay = `${0.05 + animIndex * 0.02}s`
  const filter = isSelected ? 'url(#hover-glow)' : hovered ? 'url(#glow)' : 'url(#shadow)'
  const fill = isDeceased ? '#1E1025' : '#1A0800'
  const borderColor = isSelected ? '#E8C875' : hovered ? '#C9A84C' : '#7A5020'

  return (
    /* Outer g: SVG position only — no CSS transform so animation doesn't override it */
    <g transform={`translate(${node.x},${node.y})`}>
    {/* Inner g: CSS animation + interactivity */}
    <g
      className="node-group"
      style={{ animationDelay: delay, cursor: canEdit ? 'pointer' : 'default' }}
      filter={filter}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Outer card */}
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

      {/* Top decorative line */}
      <line
        x1={-HALF_W + 8} y1={-HALF_H + 12}
        x2={HALF_W - 8} y2={-HALF_H + 12}
        stroke="rgba(201,168,76,0.3)" strokeWidth={0.5}
      />
      {/* Bottom decorative line */}
      <line
        x1={-HALF_W + 8} y1={HALF_H - 18}
        x2={HALF_W - 8} y2={HALF_H - 18}
        stroke="rgba(201,168,76,0.3)" strokeWidth={0.5}
      />

      {/* Text columns */}
      <NodeText data={data} />

      {/* Deceased indicator */}
      {isDeceased && (
        <text
          x={HALF_W - 5} y={-HALF_H + 9}
          textAnchor="end"
          fontSize={7}
          fill="rgba(180,150,100,0.6)"
          fontFamily="Noto Serif SC, serif"
        >†</text>
      )}

      {/* Generation label (bottom) */}
      {data.position && (
        <text
          x={0} y={HALF_H - 6}
          textAnchor="middle"
          fontSize={8}
          fill="rgba(201,168,76,0.7)"
          fontFamily="Noto Serif SC, serif"
          letterSpacing="1"
        >
          {data.position}
        </text>
      )}
    </g>
    </g>
  )
}

/* Renders vertical Chinese text columns inside a node */
function NodeText({ data }: { data: FamilyMember }) {
  const hasSpouse1 = !!data.line2
  const hasSpouse2 = !!data.line3

  // Determine column x positions (right to left in traditional style)
  // Name always on the rightmost, spouse(s) to the left
  let nameX = 0
  let s1X = -20
  let s2X = -38

  if (hasSpouse1 && hasSpouse2) {
    nameX = 22; s1X = 2; s2X = -18
  } else if (hasSpouse1) {
    nameX = 16; s1X = -10
  } else {
    nameX = 4
  }

  const textTop = -HALF_H + 18
  const centerY = 0

  return (
    <>
      <VerticalChars
        text={data.line1}
        x={nameX}
        centerY={centerY - 6}
        fontSize={15}
        fill={data.line1 === '-' ? 'rgba(245,230,200,0.3)' : '#F5E6C8'}
        maxH={NODE_H - 36}
        topY={textTop}
      />
      {hasSpouse1 && (
        <VerticalChars
          text={data.line2!}
          x={s1X}
          centerY={centerY - 6}
          fontSize={12}
          fill="#DAA520"
          maxH={NODE_H - 36}
          topY={textTop}
        />
      )}
      {hasSpouse2 && (
        <VerticalChars
          text={data.line3!}
          x={s2X}
          centerY={centerY - 6}
          fontSize={11}
          fill="#B8860B"
          maxH={NODE_H - 36}
          topY={textTop}
        />
      )}
    </>
  )
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
