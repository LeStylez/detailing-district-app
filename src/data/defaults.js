export const DEFAULT_SETTINGS = {
  businessName: 'DETAILING DISTRICT',
  tagline: 'Professional Business Suite',
  email: 'lewis@detailingdistrict.co.uk',
  phone: '00000 000000',
  website: 'www.detailingdistrict.co.uk',
  address: 'Add your business address here',
  paymentDetails: 'Bank Transfer / Cash / Card\nSort Code: XX-XX-XX\nAccount No: XXXXXXXX',
  terms: '1. Payment is due by the due date shown unless otherwise agreed.\n2. Vehicle condition should be checked at handover.\n3. Service times are estimates and may vary depending on vehicle size, condition and weather.\n4. Deposits are non-refundable once work has been scheduled unless agreed otherwise.\n5. By accepting the service, the customer agrees to these terms.',
  defaultEmailRecipient: 'mattconacher@gmail.com',
  vat: false,
  vatRate: 20,
  invoicePrefix: 'INV-',
  receiptPrefix: 'REC-',
  quotePrefix: 'Q-',
  whatsappFooter: 'Please attach the PDF from this app before sending.',
}

export const DEFAULT_PACKAGES = [
  { id: 'pkg-maintenance', name: 'Maintenance Detail', description: 'Maintenance Detail Package', price: 120 },
  { id: 'pkg-interior', name: 'Interior Detail', description: 'Interior deep clean, steam clean and protection', price: 200 },
  { id: 'pkg-gold', name: 'Gold Detail', description: 'Premium full detail package', price: 300 },
  { id: 'pkg-ceramic', name: 'Ceramic Coating', description: 'Paint prep and ceramic coating application', price: 500 },
  { id: 'pkg-correction', name: 'Paint Correction', description: 'Machine polish and paint enhancement', price: 350 },
]

export const STATUS_OPTIONS = ['Draft', 'Sent', 'Due', 'Paid', 'Overdue']
