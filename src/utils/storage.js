const KEY = 'dd_pro_foundation'
export function loadState() { try { return JSON.parse(localStorage.getItem(KEY) || localStorage.getItem('dd_pro_v22') || '{}') } catch { return {} } }
export function saveState(state) { localStorage.setItem(KEY, JSON.stringify({ ...state, savedAt: new Date().toISOString() })) }
export function downloadBackup(state) {
  const blob = new Blob([JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'detailing-district-pro-backup.json'
  a.click()
  URL.revokeObjectURL(url)
}
