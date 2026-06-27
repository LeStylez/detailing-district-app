import { money } from './format.js'

export function buildEmail(settings, invoice, totals, type = 'invoice') {
  const title = type === 'receipt' ? 'receipt' : type === 'quote' ? 'quote' : 'invoice'
  return `Hi ${invoice.customerName || 'there'},

Please find your ${title} from ${settings.businessName}.

${title[0].toUpperCase() + title.slice(1)} number: ${invoice.invoiceNo || invoice.quoteNo || invoice.receiptNo}
Date: ${invoice.invoiceDate || invoice.date || new Date().toISOString().slice(0, 10)}
Total: ${money(totals.total || invoice.total)}
Balance due: ${money(totals.balance ?? 0)}

If you have any questions, please reply or contact ${settings.phone || settings.email}.

Thank you,
${settings.businessName}`
}
export function buildWhatsapp(settings, invoice, totals) {
  return `Hi ${invoice.customerName || ''}, here is your invoice from ${settings.businessName}.
Invoice: ${invoice.invoiceNo}
Total: ${money(totals.total)}
Balance due: ${money(totals.balance)}
${settings.phone ? `Questions: ${settings.phone}` : ''}
${settings.whatsappFooter}`
}
export function openEmail(settings, invoice, totals) {
  const to = invoice.customerEmail || settings.defaultEmailRecipient || ''
  const subject = `Invoice ${invoice.invoiceNo} from ${settings.businessName}`
  window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildEmail(settings, invoice, totals))}`
}
export function openWhatsapp(settings, invoice, totals) {
  const raw = (invoice.customerPhone || '').replace(/[^\d+]/g, '')
  const url = raw.length > 7
    ? `https://wa.me/${raw.replace(/^\+/, '')}?text=${encodeURIComponent(buildWhatsapp(settings, invoice, totals))}`
    : `https://wa.me/?text=${encodeURIComponent(buildWhatsapp(settings, invoice, totals))}`
  window.open(url, '_blank')
}
