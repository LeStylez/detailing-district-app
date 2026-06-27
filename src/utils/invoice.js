import { today, uid } from './format.js'

export function createInvoice(no = 'INV-1001') {
  return {
    id: uid(), invoiceNo: no, status: 'Draft',
    invoiceDate: today(), dueDate: today(), serviceDate: today(),
    customerId: '', customerName: '', customerEmail: '', customerPhone: '', customerAddress: '',
    vehicleId: '', vehicle: '', registration: '', serviceLocation: '',
    items: [{ id: uid(), description: 'Premium Full Detail', qty: 1, rate: 300 }],
    discount: 0, travelFee: 0, depositPaid: 0, internalNotes: '', beforePhotos: [], afterPhotos: [],
  }
}
export function calcInvoice(invoice, settings) {
  const subtotal = invoice.items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.rate || 0), 0)
  const beforeVat = Math.max(subtotal - Number(invoice.discount || 0), 0) + Number(invoice.travelFee || 0)
  const vat = settings.vat ? beforeVat * (Number(settings.vatRate || 0) / 100) : 0
  const total = beforeVat + vat
  const balance = Math.max(total - Number(invoice.depositPaid || 0), 0)
  return { subtotal, beforeVat, vat, total, balance }
}
export function nextNumber(prefix, array, field) {
  const nums = array.map((x) => String(x[field] || '').replace(prefix, '')).map((x) => parseInt(x, 10)).filter(Boolean)
  return `${prefix}${(nums.length ? Math.max(...nums) : 1000) + 1}`
}
export function chipClass(status) { return `chip chip-${String(status || 'Draft').toLowerCase()}` }
