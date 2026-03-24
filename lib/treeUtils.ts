import * as d3 from 'd3'
import type { FamilyMember } from './types'
import { NODE_W, NODE_H, GAP_X, GAP_Y } from './constants'

interface TreeMember extends FamilyMember {
  _children: TreeMember[]
}

export interface LayoutNode {
  x: number
  y: number
  data: FamilyMember
  depth: number
  parent: LayoutNode | null
  children: LayoutNode[]
}

export interface LayoutLink {
  source: LayoutNode
  target: LayoutNode
}

export function computeLayout(members: FamilyMember[]): {
  nodes: LayoutNode[]
  links: LayoutLink[]
} {
  if (!members.length) return { nodes: [], links: [] }

  // Build a lookup map with mutable children array
  const map = new Map<number, TreeMember>()
  members.forEach(m => map.set(m.id, { ...m, _children: [] }))

  // Wire up parent → children
  const childIds = new Set<number>()
  members.forEach(m => {
    const refs = m.refs ?? []
    refs.forEach(childId => {
      childIds.add(childId)
      const parent = map.get(m.id)
      const child = map.get(childId)
      if (parent && child) parent._children.push(child)
    })
  })

  // Find root (node not listed as anyone's child)
  const rootMember = members.find(m => !childIds.has(m.id))
  if (!rootMember) return { nodes: [], links: [] }

  // Build D3 hierarchy — deduplicate so a child with two parents is only placed once
  const visitedInHierarchy = new Set<number>([rootMember.id])
  const root = d3.hierarchy<TreeMember>(
    map.get(rootMember.id)!,
    d => {
      const unique = d._children.filter(c => {
        if (visitedInHierarchy.has(c.id)) return false
        visitedInHierarchy.add(c.id)
        return true
      })
      return unique.length > 0 ? unique : null
    }
  )

  // Apply tree layout
  const treeLayout = d3.tree<TreeMember>()
    .nodeSize([NODE_W + GAP_X, NODE_H + GAP_Y])

  treeLayout(root)

  const nodes: LayoutNode[] = []
  const links: LayoutLink[] = []

  root.each(n => {
    const node = n as unknown as d3.HierarchyPointNode<TreeMember>
    nodes.push({
      x: node.x,
      y: node.y,
      data: n.data as FamilyMember,
      depth: n.depth,
      parent: null,
      children: [],
    })
  })

  // Build parent/child refs for LayoutNode
  const nodeById = new Map(nodes.map(n => [n.data.id, n]))
  nodes.forEach(n => {
    const refs = n.data.refs ?? []
    refs.forEach(childId => {
      const child = nodeById.get(childId)
      if (child) {
        child.parent = n
        n.children.push(child)
        links.push({ source: n, target: child })
      }
    })
  })

  // Handle orphan nodes: members not reachable from the main root
  // but whose children ARE in the tree (e.g. second parent with no ancestors)
  const visitedIds = new Set(nodes.map(n => n.data.id))
  members.filter(m => !visitedIds.has(m.id)).forEach(orphan => {
    const presentChildren = (orphan.refs ?? [])
      .map(id => nodeById.get(id))
      .filter((n): n is LayoutNode => n !== undefined)

    if (presentChildren.length === 0) return // completely isolated, skip

    const firstChild = presentChildren[0]
    const orphanDepth = firstChild.depth - 1
    const orphanY = firstChild.y - (NODE_H + GAP_Y)

    // Place to the right of all nodes at the same depth level
    const nodesAtDepth = nodes.filter(n => n.depth === orphanDepth)
    const maxX = nodesAtDepth.length > 0
      ? Math.max(...nodesAtDepth.map(n => n.x))
      : firstChild.x
    const orphanX = maxX + NODE_W + GAP_X * 4

    const orphanNode: LayoutNode = {
      x: orphanX,
      y: orphanY,
      data: orphan as FamilyMember,
      depth: orphanDepth,
      parent: null,
      children: [],
    }

    nodes.push(orphanNode)
    nodeById.set(orphan.id, orphanNode)

    presentChildren.forEach(child => {
      orphanNode.children.push(child)
      links.push({ source: orphanNode, target: child })
    })
  })

  return { nodes, links }
}

/** Chinese generation names → index */
export const GEN_NAMES = [
  '一世','二世','三世','四世','五世','六世','七世','八世','九世','十世',
  '十一世','十二世','十三世','十四世','十五世','十六世','十七世','十八世',
  '十九世','二十世','二十一世','二十二世','二十三世','二十四世','二十五世',
]

export function nextGenerationName(current: string | null): string {
  const idx = GEN_NAMES.indexOf(current ?? '')
  return GEN_NAMES[idx + 1] ?? `${(idx + 2)}世`
}

export { NODE_W, NODE_H, GAP_Y }
