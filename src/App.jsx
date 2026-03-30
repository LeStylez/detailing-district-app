
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Trash2, Plus, Download, Save, FileText, Users, Settings, Search, Copy, CheckCircle2, Receipt, MessageCircle, DownloadCloud } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const logoPath = '/logo.png';
const brand = { dark: '#12384a', mid: '#1e5b72', light: '#dce9ef', text: '#0f172a' };
const defaultItems = [
  { description: 'Premium Full Detail', qty: 1, rate: 300 },
  { description: '', qty: 1, rate: 0 },
  { description: '', qty: 1, rate: 0 },
];
const packageTemplates = [
  { name: 'Bronze Detail', items: [{ description: 'Bronze Detail Package', qty: 1, rate: 120 }] },
  { name: 'Silver Detail', items: [{ description: 'Silver Detail Package', qty: 1, rate: 200 }] },
  { name: 'Gold Detail', items: [{ description: 'Gold Detail Package', qty: 1, rate: 300 }] },
  { name: 'New Car Protection', items: [{ description: 'Paint Decontamination & Preparation', qty: 1, rate: 150 }, { description: 'Ceramic Coating Application', qty: 1, rate: 350 }] },
];
const statusOptions = ['Draft', 'Sent', 'Due', 'Paid', 'Overdue'];
const defaultCompany = {
  name: 'DETAILING DISTRICT',
  tagline: 'Mobile Car Detailing',
  phone: '00000 000000',
  email: 'lewis@detailingdistrict.co.uk',
  website: 'www.detailingdistrict.co.uk',
  address: 'Add your business address here',
  payment: 'Bank Transfer / Cash / Card\nSort Code: XX-XX-XX\nAccount No: XXXXXXXX',
  notes: 'Thank you for choosing Detailing District. Payment is due within 24 hours unless otherwise agreed.',
  terms: '1. Payment is due by the due date shown on this invoice unless otherwise agreed in writing.\n2. Vehicle condition should be checked at the time of handover and any concerns raised promptly.\n3. Service times are estimates and may vary depending on vehicle size, condition, and weather.\n4. Deposits paid are non-refundable once work has been scheduled unless agreed otherwise.\n5. By accepting the service, the customer agrees to these terms and conditions.',
  vatRegistered: false,
  vatNumber: '',
  vatRate: 20,
};

function createFreshInvoice(invoiceNo = 'DD-1001') {
  const today = new Date().toISOString().slice(0, 10);
  return { invoiceNo, invoiceDate: today, dueDate: today, serviceDate: today, serviceLocation: '', billToName: '', billToCompany: '', billToAddress: '', billToPhone: '', billToEmail: '', vehicle: '', registration: '', discount: 0, travelFee: 0, depositPaid: 0, status: 'Draft' };
}
function money(n) { return `£${Number(n || 0).toFixed(2)}`; }
function nextInvoiceNumber(current) {
  const match = String(current || 'DD-1001').match(/(.*?)(\d+)$/);
  if (!match) return 'DD-1001';
  const [, prefix, number] = match;
  return `${prefix}${String(Number(number) + 1).padStart(number.length, '0')}`;
}
function nextReceiptNumber(currentCount) { return `R-${String(currentCount + 1).padStart(4, '0')}`; }
function calcTotals(items, invoice, company) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.rate || 0), 0);
  const discount = Number(invoice.discount || 0);
  const travelFee = Number(invoice.travelFee || 0);
  const afterDiscount = Math.max(subtotal - discount, 0);
  const beforeVat = afterDiscount + travelFee;
  const vat = company.vatRegistered ? beforeVat * (Number(company.vatRate || 0) / 100) : 0;
  const total = beforeVat + vat;
  const balance = Math.max(total - Number(invoice.depositPaid || 0), 0);
  return { subtotal, discount, travelFee, beforeVat, vat, total, balance };
}
function statusClass(status) {
  const map = { Draft:'chip chip-draft', Sent:'chip chip-sent', Due:'chip chip-due', Paid:'chip chip-paid', Overdue:'chip chip-overdue' };
  return map[status] || map.Draft;
}
function buildInvoiceEmailText(company, invoice, totals) {
  return `Hi ${invoice.billToName || 'there'},\n\nPlease find your invoice from ${company.name}.\n\nInvoice number: ${invoice.invoiceNo}\nInvoice date: ${invoice.invoiceDate}\nDue date: ${invoice.dueDate}\nTotal: ${money(totals.total)}\nBalance due: ${money(totals.balance)}\n\nIf you have any questions, please reply or contact ${company.phone || company.email}.\n\nThank you,\n${company.name}`;
}
function buildWhatsAppText(company, invoice, totals) {
  return `Hi ${invoice.billToName || ''}, here is your invoice from ${company.name}.\nInvoice: ${invoice.invoiceNo}\nTotal: ${money(totals.total)}\nBalance due: ${money(totals.balance)}\n${company.phone ? `Questions: ${company.phone}` : ''}\nPlease attach the PDF from this app before sending.`;
}
function createWatermarkDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900"><g opacity="0.08"><circle cx="450" cy="450" r="300" fill="#1e5b72" /><text x="450" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="88" font-weight="700" fill="#12384a">DETAILING</text><text x="450" y="530" text-anchor="middle" font-family="Arial, sans-serif" font-size="88" font-weight="700" fill="#12384a">DISTRICT</text></g></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
const watermarkDataUrl = createWatermarkDataUrl();

const Card = ({ children }) => <div className="card">{children}</div>;
const CardHeader = ({ children }) => <div className="card-header">{children}</div>;
const CardTitle = ({ children }) => <div className="card-title">{children}</div>;
const CardContent = ({ children }) => <div className="card-content">{children}</div>;
const Label = ({ children, htmlFor }) => <label htmlFor={htmlFor} className="label">{children}</label>;
const Input = ({ className = '', ...props }) => <input className={`input ${className}`.trim()} {...props} />;
const Textarea = ({ className = '', ...props }) => <textarea className={`textarea ${className}`.trim()} {...props} />;
const Button = ({ children, variant = 'primary', size, className = '', ...props }) => (
  <button className={`btn ${variant === 'outline' ? 'btn-outline' : 'btn-primary'} ${size === 'icon' ? 'btn-icon' : ''} ${className}`.trim()} {...props}>{children}</button>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('invoice');
  const [company, setCompany] = useState(defaultCompany);
  const [invoice, setInvoice] = useState(createFreshInvoice());
  const [items, setItems] = useState(defaultItems);
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [selectedReceiptId, setSelectedReceiptId] = useState('');
  const [search, setSearch] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [emailCopyText, setEmailCopyText] = useState('');
  const invoiceRef = useRef(null);
  const receiptRef = useRef(null);

  useEffect(() => {
    try {
      const savedCompany = localStorage.getItem('dd_company');
      const savedInvoicesRaw = localStorage.getItem('dd_invoices');
      const savedCustomersRaw = localStorage.getItem('dd_customers');
      const savedReceiptsRaw = localStorage.getItem('dd_receipts');
      const currentDraftRaw = localStorage.getItem('dd_current_draft');
      if (savedCompany) setCompany(JSON.parse(savedCompany));
      if (savedInvoicesRaw) setSavedInvoices(JSON.parse(savedInvoicesRaw));
      if (savedCustomersRaw) setCustomers(JSON.parse(savedCustomersRaw));
      if (savedReceiptsRaw) setReceipts(JSON.parse(savedReceiptsRaw));
      if (currentDraftRaw) {
        const draft = JSON.parse(currentDraftRaw);
        if (draft.invoice) setInvoice(draft.invoice);
        if (draft.items) setItems(draft.items);
      }
    } catch (e) { console.error('Failed to load saved data', e); }
  }, []);
  useEffect(() => { localStorage.setItem('dd_company', JSON.stringify(company)); }, [company]);
  useEffect(() => { localStorage.setItem('dd_invoices', JSON.stringify(savedInvoices)); }, [savedInvoices]);
  useEffect(() => { localStorage.setItem('dd_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('dd_receipts', JSON.stringify(receipts)); }, [receipts]);
  useEffect(() => { localStorage.setItem('dd_current_draft', JSON.stringify({ invoice, items })); }, [invoice, items]);

  const totals = useMemo(() => calcTotals(items, invoice, company), [items, invoice, company]);
  useEffect(() => { setEmailCopyText(buildInvoiceEmailText(company, invoice, totals)); }, [company, invoice, totals]);

  const selectedReceipt = receipts.find((r) => r.id === selectedReceiptId) || receipts[0] || null;
  const flash = (message) => { setSaveMessage(message); setTimeout(() => setSaveMessage(''), 1800); };
  const updateInvoice = (key, value) => setInvoice((p) => ({ ...p, [key]: value }));
  const updateCompany = (key, value) => setCompany((p) => ({ ...p, [key]: value }));
  const updateItem = (idx, key, value) => { const next = [...items]; next[idx] = { ...next[idx], [key]: value }; setItems(next); };
  const addItem = () => setItems((p) => [...p, { description: '', qty: 1, rate: 0 }]);
  const removeItem = (idx) => setItems((p) => p.filter((_, i) => i !== idx));

  const exportNodeToPdf = async (node, filename) => {
    if (!node) return;
    setPdfBusy(true);
    try {
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * usableWidth) / canvas.width;
      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, 'PNG', margin, margin, usableWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = margin;
        pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
          heightLeft -= pageHeight - margin * 2;
        }
      }
      pdf.save(filename);
    } finally { setPdfBusy(false); }
  };

  const downloadInvoicePdf = async () => { await exportNodeToPdf(invoiceRef.current, `${invoice.invoiceNo || 'invoice'}.pdf`); };
  const downloadReceiptPdf = async () => { await exportNodeToPdf(receiptRef.current, `${selectedReceipt?.id || 'receipt'}.pdf`); };
  const downloadJson = () => {
    const payload = { company, invoice, items, totals, savedInvoices, customers, receipts };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `detailing-district-data.json`; a.click(); URL.revokeObjectURL(url);
  };

  const saveCurrentInvoice = () => {
    const payload = { id: invoice.invoiceNo, invoice, items, totals, updatedAt: new Date().toISOString() };
    setSavedInvoices((prev) => {
      const existing = prev.findIndex((x) => x.id === payload.id);
      if (existing >= 0) { const next = [...prev]; next[existing] = payload; return next; }
      return [payload, ...prev];
    });
    const candidate = { name: invoice.billToName, company: invoice.billToCompany, email: invoice.billToEmail, phone: invoice.billToPhone, address: invoice.billToAddress };
    const hasCustomer = [candidate.name, candidate.company, candidate.email, candidate.phone, candidate.address].some(Boolean);
    if (hasCustomer) {
      setCustomers((prev) => {
        const key = `${candidate.name}|${candidate.email}|${candidate.phone}`;
        const exists = prev.some((c) => `${c.name}|${c.email}|${c.phone}` === key);
        if (exists) return prev;
        return [candidate, ...prev];
      });
    }
    flash('Invoice saved');
  };

  const markAsPaid = () => { setInvoice((prev) => ({ ...prev, status: 'Paid', depositPaid: totals.total })); flash('Invoice marked as paid'); };
  const generateReceipt = () => {
    const receipt = { id: nextReceiptNumber(receipts.length), createdAt: new Date().toISOString().slice(0, 10), invoiceNo: invoice.invoiceNo, customer: { name: invoice.billToName, company: invoice.billToCompany, email: invoice.billToEmail, phone: invoice.billToPhone, address: invoice.billToAddress }, vehicle: invoice.vehicle, registration: invoice.registration, items, totals, paidAmount: totals.total, serviceDate: invoice.serviceDate, serviceLocation: invoice.serviceLocation };
    setReceipts((prev) => [receipt, ...prev]);
    setSelectedReceiptId(receipt.id);
    setInvoice((prev) => ({ ...prev, status: 'Paid', depositPaid: totals.total }));
    setActiveTab('receipts');
    flash('Receipt generated');
  };
  const createNewInvoice = () => { const nextNo = nextInvoiceNumber(invoice.invoiceNo); setInvoice(createFreshInvoice(nextNo)); setItems(defaultItems); setActiveTab('invoice'); };
  const loadInvoice = (saved) => { setInvoice(saved.invoice); setItems(saved.items); setActiveTab('invoice'); };
  const duplicateInvoice = (saved) => {
    const nextNo = nextInvoiceNumber(saved.invoice.invoiceNo);
    setInvoice({ ...saved.invoice, invoiceNo: nextNo, invoiceDate: new Date().toISOString().slice(0, 10), dueDate: new Date().toISOString().slice(0, 10), status: 'Draft' });
    setItems(saved.items); setActiveTab('invoice');
  };
  const deleteInvoice = (id) => { setSavedInvoices((prev) => prev.filter((x) => x.id !== id)); flash('Invoice deleted'); };
  const deleteCustomer = (idx) => { setCustomers((prev) => prev.filter((_, i) => i !== idx)); flash('Customer deleted'); };
  const deleteReceipt = (id) => { setReceipts((prev) => prev.filter((r) => r.id !== id)); if (selectedReceiptId === id) setSelectedReceiptId(''); flash('Receipt deleted'); };
  const applyPackage = (pkg) => { setItems(pkg.items); setActiveTab('invoice'); };
  const loadCustomer = (customer) => { setInvoice((prev) => ({ ...prev, billToName: customer.name || '', billToCompany: customer.company || '', billToEmail: customer.email || '', billToPhone: customer.phone || '', billToAddress: customer.address || '' })); setActiveTab('invoice'); };
  const copyEmailText = async () => { try { await navigator.clipboard.writeText(emailCopyText); flash('Invoice email text copied'); } catch { flash('Could not copy email text'); } };
  const sendWhatsApp = () => {
    const body = buildWhatsAppText(company, invoice, totals);
    const rawPhone = (invoice.billToPhone || '').replace(/[^\d+]/g, '');
    const hasPhone = rawPhone.length >= 8;
    const url = hasPhone ? `https://wa.me/${rawPhone.replace(/^\+/, '')}?text=${encodeURIComponent(body)}` : `https://wa.me/?text=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  const filteredInvoices = savedInvoices.filter((x) => {
    const q = search.toLowerCase();
    return !q || x.invoice.invoiceNo.toLowerCase().includes(q) || (x.invoice.billToName || '').toLowerCase().includes(q) || (x.invoice.vehicle || '').toLowerCase().includes(q);
  });
  const filteredReceipts = receipts.filter((x) => {
    const q = search.toLowerCase();
    return !q || x.id.toLowerCase().includes(q) || (x.invoiceNo || '').toLowerCase().includes(q) || (x.customer?.name || '').toLowerCase().includes(q);
  });
  const totalRevenue = savedInvoices.reduce((sum, x) => sum + Number(x.totals.total || 0), 0);
  const totalOutstanding = savedInvoices.reduce((sum, x) => sum + Number(x.totals.balance || 0), 0);

  return (
    <div className="app-shell">
      <style>{`@page{size:A4;margin:8mm;}@media print{html,body{background:white!important;}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.no-print{display:none!important;}.print-wrap{padding:0!important;}.invoice-sheet,.receipt-sheet{box-shadow:none!important;border:none!important;border-radius:0!important;width:190mm!important;margin:0 auto!important;overflow:visible!important;}}`}</style>
      <div className="container print-wrap">
        <div className="topbar no-print">
          <div>
            <h1 className="page-title">Detailing District App</h1>
            <p className="page-subtitle">Premium invoice system with receipts, WhatsApp sharing, payment status chips, watermark, and high-fidelity PDF export.</p>
          </div>
          <div className="actions">
            <Button onClick={createNewInvoice}><Plus size={16} /> New Invoice</Button>
            <Button onClick={saveCurrentInvoice} variant="outline"><Save size={16} /> Save Invoice</Button>
            <Button onClick={markAsPaid} variant="outline"><CheckCircle2 size={16} /> Mark as Paid</Button>
            <Button onClick={downloadInvoicePdf} variant="outline" disabled={pdfBusy}><DownloadCloud size={16} /> {pdfBusy ? 'Building PDF...' : 'Premium PDF'}</Button>
            <Button onClick={downloadJson} variant="outline"><Download size={16} /> Backup Data</Button>
          </div>
        </div>

        <div className="tabs tabs-5 no-print">
          {[
            ['invoice', 'Invoice', FileText],
            ['customers', 'Customers', Users],
            ['history', 'Invoices', Search],
            ['receipts', 'Receipts', Receipt],
            ['settings', 'Settings', Settings],
          ].map(([key, label, Icon]) => (
            <button key={key} onClick={() => setActiveTab(key)} className={`tab ${activeTab === key ? 'tab-active' : ''}`}>
              <Icon size={18} />
              <div>{label}</div>
            </button>
          ))}
        </div>

        <div className="stats no-print">
          <Card><CardContent><div className="stat-label">Saved invoices</div><div className="stat-value">{savedInvoices.length}</div></CardContent></Card>
          <Card><CardContent><div className="stat-label">Revenue tracked</div><div className="stat-value">{money(totalRevenue)}</div></CardContent></Card>
          <Card><CardContent><div className="stat-label">Outstanding balance</div><div className="stat-value">{money(totalOutstanding)}</div></CardContent></Card>
        </div>

        <div className="page-grid">
          <div className="sidebar no-print">
            {activeTab === 'invoice' && (
              <>
                <Card><CardHeader><CardTitle>Invoice details</CardTitle></CardHeader><CardContent>
                  <div className="grid-2">
                    <div><Label>Invoice no.</Label><Input value={invoice.invoiceNo} onChange={(e) => updateInvoice('invoiceNo', e.target.value)} /></div>
                    <div><Label>Status</Label><select className="input" value={invoice.status} onChange={(e) => updateInvoice('status', e.target.value)}>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
                    <div><Label>Invoice date</Label><Input type="date" value={invoice.invoiceDate} onChange={(e) => updateInvoice('invoiceDate', e.target.value)} /></div>
                    <div><Label>Due date</Label><Input type="date" value={invoice.dueDate} onChange={(e) => updateInvoice('dueDate', e.target.value)} /></div>
                    <div className="span-2"><Label>Service date</Label><Input type="date" value={invoice.serviceDate} onChange={(e) => updateInvoice('serviceDate', e.target.value)} /></div>
                  </div>
                  <div className="field"><Label>Service location</Label><Textarea value={invoice.serviceLocation} onChange={(e) => updateInvoice('serviceLocation', e.target.value)} rows={3} /></div>
                  <div className="grid-2">
                    <div><Label>Client name</Label><Input value={invoice.billToName} onChange={(e) => updateInvoice('billToName', e.target.value)} /></div>
                    <div><Label>Client company</Label><Input value={invoice.billToCompany} onChange={(e) => updateInvoice('billToCompany', e.target.value)} /></div>
                    <div><Label>Client phone</Label><Input value={invoice.billToPhone} onChange={(e) => updateInvoice('billToPhone', e.target.value)} /></div>
                    <div><Label>Client email</Label><Input value={invoice.billToEmail} onChange={(e) => updateInvoice('billToEmail', e.target.value)} /></div>
                  </div>
                  <div className="field"><Label>Billing address</Label><Textarea value={invoice.billToAddress} onChange={(e) => updateInvoice('billToAddress', e.target.value)} rows={3} /></div>
                  <div className="grid-2">
                    <div><Label>Vehicle</Label><Input value={invoice.vehicle} onChange={(e) => updateInvoice('vehicle', e.target.value)} placeholder="e.g. BMW M4" /></div>
                    <div><Label>Registration</Label><Input value={invoice.registration} onChange={(e) => updateInvoice('registration', e.target.value)} placeholder="Optional" /></div>
                  </div>
                </CardContent></Card>

                <Card><CardHeader><CardTitle>Service rows</CardTitle></CardHeader><CardContent>
                  {items.map((item, idx) => (
                    <div key={idx} className="service-row-editor">
                      <div className="service-desc"><Label>Description</Label><Input value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} /></div>
                      <div><Label>Qty</Label><Input type="number" value={item.qty} onChange={(e) => updateItem(idx, 'qty', e.target.value)} /></div>
                      <div><Label>Rate</Label><Input type="number" value={item.rate} onChange={(e) => updateItem(idx, 'rate', e.target.value)} /></div>
                      <div className="service-delete"><Button variant="outline" size="icon" onClick={() => removeItem(idx)}><Trash2 size={16} /></Button></div>
                    </div>
                  ))}
                  <div className="actions wrap">
                    <Button onClick={addItem}><Plus size={16} /> Add row</Button>
                    {packageTemplates.map((pkg) => <Button key={pkg.name} variant="outline" onClick={() => applyPackage(pkg)}>{pkg.name}</Button>)}
                  </div>
                  <div className="separator" />
                  <div className="grid-3">
                    <div><Label>Discount (£)</Label><Input type="number" value={invoice.discount} onChange={(e) => updateInvoice('discount', e.target.value)} /></div>
                    <div><Label>Travel fee (£)</Label><Input type="number" value={invoice.travelFee} onChange={(e) => updateInvoice('travelFee', e.target.value)} /></div>
                    <div><Label>Deposit paid (£)</Label><Input type="number" value={invoice.depositPaid} onChange={(e) => updateInvoice('depositPaid', e.target.value)} /></div>
                  </div>
                </CardContent></Card>
              </>
            )}

            {activeTab === 'customers' && (
              <Card><CardHeader><CardTitle>Customer database</CardTitle></CardHeader><CardContent>
                {customers.length === 0 && <div className="muted">Save an invoice with customer details and they will appear here for reuse.</div>}
                {customers.map((customer, idx) => (
                  <div key={idx} className="list-card">
                    <div className="list-title">{customer.name || 'Unnamed customer'}</div>
                    {customer.company && <div className="muted">{customer.company}</div>}
                    <div className="small-text">{customer.email}</div>
                    <div className="small-text">{customer.phone}</div>
                    <div className="small-text pre">{customer.address}</div>
                    <div className="actions wrap" style={{marginTop:12}}>
                      <Button onClick={() => loadCustomer(customer)} variant="outline">Use for invoice</Button>
                      <Button onClick={() => deleteCustomer(idx)} variant="outline"><Trash2 size={16} /> Delete</Button>
                    </div>
                  </div>
                ))}
              </CardContent></Card>
            )}

            {activeTab === 'history' && (
              <Card><CardHeader><CardTitle>Saved invoices</CardTitle></CardHeader><CardContent>
                <div className="search-wrap"><Search size={16} className="search-icon" /><Input className="search-input" placeholder="Search invoice, customer, vehicle" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                {filteredInvoices.length === 0 && <div className="muted">No saved invoices yet.</div>}
                {filteredInvoices.map((saved) => (
                  <div key={saved.id} className="list-card">
                    <div className="list-top">
                      <div>
                        <div className="list-title">{saved.invoice.invoiceNo}</div>
                        <div className="muted">{saved.invoice.billToName || 'No client'} • {saved.invoice.vehicle || 'No vehicle'}</div>
                        <div className="small-text">{saved.invoice.invoiceDate}</div>
                      </div>
                      <div className="align-right">
                        <div className={statusClass(saved.invoice.status)}>{saved.invoice.status}</div>
                        <div className="list-title" style={{marginTop:8}}>{money(saved.totals.total)}</div>
                        <div className="small-text">Due {money(saved.totals.balance)}</div>
                      </div>
                    </div>
                    <div className="actions wrap">
                      <Button variant="outline" onClick={() => loadInvoice(saved)}>Open</Button>
                      <Button variant="outline" onClick={() => duplicateInvoice(saved)}><Copy size={16} /> Duplicate</Button>
                      <Button variant="outline" onClick={() => deleteInvoice(saved.id)}><Trash2 size={16} /> Delete</Button>
                    </div>
                  </div>
                ))}
              </CardContent></Card>
            )}

            {activeTab === 'receipts' && (
              <Card><CardHeader><CardTitle>Customer receipts</CardTitle></CardHeader><CardContent>
                <div className="search-wrap"><Search size={16} className="search-icon" /><Input className="search-input" placeholder="Search receipt, invoice, customer" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                {filteredReceipts.length === 0 && <div className="muted">No receipts yet. Generate one from the invoice tab when a job is paid.</div>}
                {filteredReceipts.map((receipt) => (
                  <div key={receipt.id} className="list-card">
                    <div className="list-top">
                      <div><div className="list-title">{receipt.id}</div><div className="muted">Invoice {receipt.invoiceNo}</div><div className="small-text">{receipt.customer?.name || 'No customer'} • {receipt.createdAt}</div></div>
                      <div className="align-right"><div className="list-title">{money(receipt.paidAmount)}</div></div>
                    </div>
                    <div className="actions wrap">
                      <Button variant="outline" onClick={() => setSelectedReceiptId(receipt.id)}>View</Button>
                      <Button variant="outline" onClick={downloadReceiptPdf}><DownloadCloud size={16} /> PDF</Button>
                      <Button variant="outline" onClick={() => deleteReceipt(receipt.id)}><Trash2 size={16} /> Delete</Button>
                    </div>
                  </div>
                ))}
              </CardContent></Card>
            )}

            {activeTab === 'settings' && (
              <Card><CardHeader><CardTitle>Business settings</CardTitle></CardHeader><CardContent>
                <div className="grid-2">
                  <div><Label>Business name</Label><Input value={company.name} onChange={(e) => updateCompany('name', e.target.value)} /></div>
                  <div><Label>Tagline</Label><Input value={company.tagline} onChange={(e) => updateCompany('tagline', e.target.value)} /></div>
                  <div><Label>Phone</Label><Input value={company.phone} onChange={(e) => updateCompany('phone', e.target.value)} /></div>
                  <div><Label>Email</Label><Input value={company.email} onChange={(e) => updateCompany('email', e.target.value)} /></div>
                  <div><Label>Website</Label><Input value={company.website} onChange={(e) => updateCompany('website', e.target.value)} /></div>
                  <div><Label>VAT number</Label><Input value={company.vatNumber} onChange={(e) => updateCompany('vatNumber', e.target.value)} placeholder="Optional" /></div>
                </div>
                <div className="field"><Label>Business address</Label><Textarea value={company.address} onChange={(e) => updateCompany('address', e.target.value)} rows={3} /></div>
                <div className="field"><Label>Payment details</Label><Textarea value={company.payment} onChange={(e) => updateCompany('payment', e.target.value)} rows={4} /></div>
                <div className="field"><Label>Default notes</Label><Textarea value={company.notes} onChange={(e) => updateCompany('notes', e.target.value)} rows={4} /></div>
                <div className="field"><Label>Terms & conditions</Label><Textarea value={company.terms} onChange={(e) => updateCompany('terms', e.target.value)} rows={6} /></div>
                <div className="checkbox-row">
                  <input id="vatRegistered" type="checkbox" checked={company.vatRegistered} onChange={(e) => updateCompany('vatRegistered', e.target.checked)} />
                  <Label htmlFor="vatRegistered">VAT registered</Label>
                  <div className="vat-box"><Input type="number" value={company.vatRate} onChange={(e) => updateCompany('vatRate', e.target.value)} /></div>
                  <span className="muted">VAT %</span>
                </div>
              </CardContent></Card>
            )}

            {saveMessage && <div className="save-message"><CheckCircle2 size={16} /> {saveMessage}</div>}

            <Card><CardHeader><CardTitle>Invoice email copy</CardTitle></CardHeader><CardContent>
              <Textarea value={emailCopyText} onChange={(e) => setEmailCopyText(e.target.value)} rows={10} />
              <div className="actions wrap" style={{marginTop:12}}>
                <Button onClick={copyEmailText} variant="outline"><FileText size={16} /> Copy Text</Button>
                <Button onClick={sendWhatsApp} variant="outline"><MessageCircle size={16} /> Use for WhatsApp</Button>
              </div>
            </CardContent></Card>

            <div className="actions no-print">
              <Button onClick={downloadInvoicePdf} disabled={pdfBusy}><DownloadCloud size={16} /> {pdfBusy ? 'Building PDF...' : 'Premium PDF'}</Button>
              <Button onClick={sendWhatsApp} variant="outline"><MessageCircle size={16} /> Send via WhatsApp</Button>
              <Button onClick={markAsPaid} variant="outline"><CheckCircle2 size={16} /> Mark as Paid</Button>
              <Button onClick={generateReceipt} variant="outline"><Receipt size={16} /> Generate Receipt</Button>
              <Button onClick={saveCurrentInvoice} variant="outline"><Save size={16} /> Save Invoice</Button>
            </div>
          </div>

          <div className="preview-pane">
            <div ref={invoiceRef} className="invoice-sheet invoice-shell">
              <img src={watermarkDataUrl} alt="" aria-hidden="true" className="watermark" />
              <div className="invoice-header">
                <div className="header-left">
                  <div className="logo-wrap"><img src={logoPath} alt="Detailing District logo" className="logo rounded-logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} /></div>
                  <div><div className="company-name">{company.name}</div><div className="company-tagline">{company.tagline}</div></div>
                  <div className="company-meta"><div className="pre">{company.address}</div><div>{company.email}</div><div>{company.website}</div><div>T: {company.phone}</div>{company.vatRegistered && company.vatNumber && <div>VAT No: {company.vatNumber}</div>}</div>
                </div>
                <div className="header-right">
                  <div className="invoice-title">INVOICE</div>
                  <div className="invoice-meta">
                    <div><span>Invoice No.:</span><span>{invoice.invoiceNo}</span></div>
                    <div><span>Status:</span><span className={statusClass(invoice.status)}>{invoice.status}</span></div>
                    <div><span>Invoice Date:</span><span>{invoice.invoiceDate}</span></div>
                    <div><span>Due Date:</span><span>{invoice.dueDate}</span></div>
                    <div><span>Service Date:</span><span>{invoice.serviceDate}</span></div>
                  </div>
                </div>
              </div>

              <div className="invoice-body">
                <div className="two-col">
                  <div>
                    <div className="section-title">BILL TO:</div>
                    <div className="detail-block">
                      <div className="strong">{invoice.billToName || 'Client name'}</div>
                      {invoice.billToCompany && <div>{invoice.billToCompany}</div>}
                      <div className="pre">{invoice.billToAddress || 'Client address'}</div>
                      {invoice.billToPhone && <div>{invoice.billToPhone}</div>}
                      {invoice.billToEmail && <div>{invoice.billToEmail}</div>}
                    </div>
                  </div>
                  <div>
                    <div className="section-title">SERVICE LOCATION:</div>
                    <div className="detail-block">
                      <div className="pre">{invoice.serviceLocation || 'Service address / site location'}</div>
                      {(invoice.vehicle || invoice.registration) && (
                        <div className="vehicle-meta">
                          {invoice.vehicle && <div><span className="strong">Vehicle:</span> {invoice.vehicle}</div>}
                          {invoice.registration && <div><span className="strong">Registration:</span> {invoice.registration}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="items-table">
                  <div className="table-head">
                    <div className="col-desc">DESCRIPTION</div>
                    <div className="col-qty">QTY</div>
                    <div className="col-rate">RATE</div>
                    <div className="col-amt">AMOUNT</div>
                  </div>
                  {items.map((item, idx) => {
                    const amount = Number(item.qty || 0) * Number(item.rate || 0);
                    return (
                      <div key={idx} className={`table-row ${idx % 2 === 0 ? 'row-light' : 'row-blue'}`}>
                        <div className="col-desc">{item.description || ' '}</div>
                        <div className="col-qty">{item.qty || ''}</div>
                        <div className="col-rate">{item.rate ? money(item.rate) : ''}</div>
                        <div className="col-amt">{amount ? money(amount) : ''}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="two-col totals-area">
                  <div>
                    <div className="section-title">PAYMENT DETAILS</div>
                    <div className="detail-block pre">{company.payment}</div>
                    <div className="section-title notes-title">NOTES</div>
                    <div className="detail-block">{company.notes}</div>
                    <div className="section-title notes-title">TERMS & CONDITIONS</div>
                    <div className="detail-block pre terms-copy">{company.terms}</div>
                  </div>
                  <div className="summary-box">
                    <div><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
                    <div><span>Discount</span><span>-{money(totals.discount)}</span></div>
                    <div><span>Travel Fee</span><span>{money(totals.travelFee)}</span></div>
                    {company.vatRegistered && <div><span>VAT ({company.vatRate}%)</span><span>{money(totals.vat)}</span></div>}
                    <div><span>Deposit Paid</span><span>-{money(invoice.depositPaid)}</span></div>
                    <div className="balance-row"><span>BALANCE DUE</span><span>{money(totals.balance)}</span></div>
                  </div>
                </div>
                <div className="thankyou">Thank you for your business.</div>
              </div>
            </div>

            {selectedReceipt && (
              <div ref={receiptRef} className="receipt-sheet">
                <div className="invoice-header">
                  <div className="header-left">
                    <div className="logo-wrap"><img src={logoPath} alt="Detailing District logo" className="logo rounded-logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} /></div>
                    <div className="company-name receipt-name">{company.name}</div>
                    <div className="company-meta pre">{company.address}</div>
                  </div>
                  <div className="header-right">
                    <div className="invoice-title">RECEIPT</div>
                    <div className="invoice-meta">
                      <div><span>Receipt No.:</span><span>{selectedReceipt.id}</span></div>
                      <div><span>Invoice No.:</span><span>{selectedReceipt.invoiceNo}</span></div>
                      <div><span>Date:</span><span>{selectedReceipt.createdAt}</span></div>
                    </div>
                  </div>
                </div>
                <div className="invoice-body">
                  <div className="two-col">
                    <div>
                      <div className="section-title">RECEIVED FROM:</div>
                      <div className="detail-block">
                        <div className="strong">{selectedReceipt.customer?.name || 'Customer'}</div>
                        {selectedReceipt.customer?.company && <div>{selectedReceipt.customer.company}</div>}
                        <div className="pre">{selectedReceipt.customer?.address || ''}</div>
                        {selectedReceipt.customer?.phone && <div>{selectedReceipt.customer.phone}</div>}
                        {selectedReceipt.customer?.email && <div>{selectedReceipt.customer.email}</div>}
                      </div>
                    </div>
                    <div>
                      <div className="section-title">SERVICE DETAILS:</div>
                      <div className="detail-block">
                        <div>{selectedReceipt.serviceDate}</div>
                        <div className="pre">{selectedReceipt.serviceLocation}</div>
                        {selectedReceipt.vehicle && <div><span className="strong">Vehicle:</span> {selectedReceipt.vehicle}</div>}
                        {selectedReceipt.registration && <div><span className="strong">Registration:</span> {selectedReceipt.registration}</div>}
                      </div>
                    </div>
                  </div>
                  <div className="items-table">
                    <div className="table-head">
                      <div className="col-desc">DESCRIPTION</div>
                      <div className="col-qty">QTY</div>
                      <div className="col-rate">RATE</div>
                      <div className="col-amt">AMOUNT</div>
                    </div>
                    {selectedReceipt.items.map((item, idx) => {
                      const amount = Number(item.qty || 0) * Number(item.rate || 0);
                      return (
                        <div key={idx} className={`table-row ${idx % 2 === 0 ? 'row-light' : 'row-blue'}`}>
                          <div className="col-desc">{item.description || ' '}</div>
                          <div className="col-qty">{item.qty || ''}</div>
                          <div className="col-rate">{item.rate ? money(item.rate) : ''}</div>
                          <div className="col-amt">{amount ? money(amount) : ''}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="summary-box" style={{marginTop:'32px', marginLeft:'auto'}}>
                    <div><span>Total paid</span><span>{money(selectedReceipt.paidAmount)}</span></div>
                    <div className="balance-row"><span>PAYMENT RECEIVED</span><span>{money(selectedReceipt.paidAmount)}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
