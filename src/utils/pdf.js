import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
export async function exportNodeToPdf(node, filename) {
  if (!node) return
  const canvas = await html2canvas(node, { scale: 2.4, backgroundColor: '#ffffff', useCORS: true, logging: false })
  const img = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const w = pdf.internal.pageSize.getWidth()
  const h = pdf.internal.pageSize.getHeight()
  const margin = 8
  const usable = w - margin * 2
  const imgH = canvas.height * usable / canvas.width
  if (imgH <= h - margin * 2) pdf.addImage(img, 'PNG', margin, margin, usable, imgH)
  else {
    let left = imgH, pos = margin
    pdf.addImage(img, 'PNG', margin, pos, usable, imgH)
    left -= h - margin * 2
    while (left > 0) {
      pos = left - imgH + margin
      pdf.addPage()
      pdf.addImage(img, 'PNG', margin, pos, usable, imgH)
      left -= h - margin * 2
    }
  }
  pdf.save(filename)
}
export function watermark() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><g opacity=".08"><circle cx="450" cy="450" r="300" fill="#1e5b72"/><text x="450" y="430" text-anchor="middle" font-family="Arial" font-size="88" font-weight="700" fill="#12384a">DETAILING</text><text x="450" y="530" text-anchor="middle" font-family="Arial" font-size="88" font-weight="700" fill="#12384a">DISTRICT</text></g></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
