import { supabase, supabaseEnabled } from '../lib/supabase.js'

export const TABLES = ['customers', 'vehicles', 'invoices', 'receipts', 'quotes', 'bookings', 'packages']

export async function fetchTable(table) {
  if (!supabaseEnabled) return []
  const { data, error } = await supabase.from(table).select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return (data || []).map(row => ({ id: row.id, ...(row.data || {}) }))
}

export async function upsertRecord(table, record) {
  if (!supabaseEnabled) return record
  const id = record.id
  const payload = { id, data: record, updated_at: new Date().toISOString() }
  const { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' })
  if (error) throw error
  return record
}

export async function deleteRecord(table, id) {
  if (!supabaseEnabled) return
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

export async function fetchSettings() {
  if (!supabaseEnabled) return null
  const { data, error } = await supabase.from('settings').select('*').eq('id', 'business').maybeSingle()
  if (error) throw error
  return data?.data || null
}

export async function saveSettings(settings) {
  if (!supabaseEnabled) return settings
  const { error } = await supabase.from('settings').upsert({ id: 'business', data: settings, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) throw error
  return settings
}

export function downloadBackup(state) {
  const blob = new Blob([JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'detailing-district-pro-backup.json'
  a.click()
  URL.revokeObjectURL(url)
}
