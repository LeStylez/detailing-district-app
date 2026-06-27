export const today = () => new Date().toISOString().slice(0, 10)
export const uid = () => crypto.randomUUID()
export const money = (value) => `£${Number(value || 0).toFixed(2)}`
export function monthLabel(date) { try { return new Date(date).toLocaleString('en-GB', { month: 'short' }).toUpperCase() } catch { return 'MAY' } }
export function dayLabel(date) { try { return new Date(date).getDate() } catch { return '31' } }
