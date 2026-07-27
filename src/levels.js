export const LEVELS = [
  { id: 'nursery', color: '#E8A23D', tint: '#FBEBD3' },
  { id: 'kg1', color: '#4E9C8F', tint: '#DCEEEA' },
  { id: 'kg2', color: '#4C7FB0', tint: '#DCE7F2' },
  { id: 'kg3', color: '#9B6FA8', tint: '#EBE0EF' },
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
