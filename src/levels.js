export const LEVELS = [
  { id: 'nursery', color: '#B5691A', tint: '#F3D9A8' },
  { id: 'kg1', color: '#0E5C55', tint: '#A9D6CD' },
  { id: 'kg2', color: '#1E4E7A', tint: '#B4CEE6' },
  { id: 'kg3', color: '#6B3E78', tint: '#D6C0DE' },
]

export const DEFAULT_LEVEL_NAMES = {
  nursery: 'حضانة', kg1: 'روضة أول', kg2: 'روضة ثاني', kg3: 'روضة ثالث',
}

export const LEVEL_PROMOTION = { nursery: 'kg1', kg1: 'kg2', kg2: 'kg3', kg3: 'kg3' }

export function levelInfo(id, levelNames = {}) {
  const base = LEVELS.find((l) => l.id === id) || LEVELS[0]
  return { ...base, name: levelNames[base.id] || DEFAULT_LEVEL_NAMES[base.id] }
}

export function allLevels(levelNames = {}) {
  return LEVELS.map((l) => ({ ...l, name: levelNames[l.id] || DEFAULT_LEVEL_NAMES[l.id] }))
}

export const todayISO = () => new Date().toISOString().slice(0, 10)
export const thisMonth = () => todayISO().slice(0, 7)
