import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Hero from './components/layout/Hero.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import TopBar from './components/layout/TopBar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Customers from './pages/Customers.jsx'
import Vehicles from './pages/Vehicles.jsx'
import InvoiceDesigner from './pages/InvoiceDesigner.jsx'
import Invoices from './pages/Invoices.jsx'
import Quotes from './pages/Quotes.jsx'
import Bookings from './pages/Bookings.jsx'
import Packages from './pages/Packages.jsx'
import Reports from './pages/Reports.jsx'
import Receipts from './pages/Receipts.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import { DEFAULT_PACKAGES, DEFAULT_SETTINGS } from './data/defaults.js'
import { today, uid } from './utils/format.js'
import { calcInvoice, createInvoice, nextNumber } from './utils/invoice.js'
import { downloadBackup, deleteRecord, fetchSettings, fetchTable, saveSettings, upsertRecord } from './utils/database.js'
import { exportNodeToPdf } from './utils/pdf.js'
import { openEmail, openWhatsapp } from './utils/messaging.js'
import { supabaseEnabled } from './lib/supabase.js'

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [invoices, setInvoices] = useState([])
  const [receipts, setReceipts] = useState([])
  const [quotes, setQuotes] = useState([])
  const [bookings, setBookings] = useState([])
  const [packages, setPackages] = useState(DEFAULT_PACKAGES)
  const [draft, setDraft] = useState(createInvoice())
  const [customerDraft, setCustomerDraft] = useState({ name:'', email:'', phone:'', address:'', notes:'' })
  const [vehicleDraft, setVehicleDraft] = useState({ customerId:'', makeModel:'', registration:'', colour:'', mileage:'', notes:'' })
  const [bookingDraft, setBookingDraft] = useState({ date: today(), time:'09:00', customerName:'', vehicle:'', service:'Maintenance Detail', status:'Confirmed', notes:'' })
  const [packageDraft, setPackageDraft] = useState({ name:'', description:'', price:0 })
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  const [dbStatus, setDbStatus] = useState(supabaseEnabled ? 'connecting' : 'offline')
  const invoiceRef = useRef(null)
  const fileRef = useRef(null)

  const state = { settings, customers, vehicles, invoices, receipts, quotes, bookings, packages, draft }
  const totals = useMemo(() => calcInvoice(draft, settings), [draft, settings])

  useEffect(() => { loadCloudData() }, [])

  async function loadCloudData() {
    if (!supabaseEnabled) return setDbStatus('offline')
    try {
      const [remoteSettings, c, v, i, r, q, b, p] = await Promise.all([
        fetchSettings(),
        fetchTable('customers'),
        fetchTable('vehicles'),
        fetchTable('invoices'),
        fetchTable('receipts'),
        fetchTable('quotes'),
        fetchTable('bookings'),
        fetchTable('packages'),
      ])
      if (remoteSettings) setSettings({ ...DEFAULT_SETTINGS, ...remoteSettings })
      setCustomers(c); setVehicles(v); setInvoices(i); setReceipts(r); setQuotes(q); setBookings(b)
      setPackages(p.length ? p : DEFAULT_PACKAGES)
      setDbStatus('connected')
    } catch (err) {
      console.error(err)
      setDbStatus('setup required')
      flash('Database needs schema/policies. Run supabase/schema.sql')
    }
  }

  const flash = (message) => { setToast(message); setTimeout(() => setToast(''), 2600) }
  const updateDraft = (key, value) => setDraft(prev => ({ ...prev, [key]: value }))

  const paidInvoices = invoices.filter(i => i.status === 'Paid')
  const outstandingInvoices = invoices.filter(i => i.status !== 'Paid')
  const revenue = paidInvoices.reduce((sum, i) => sum + calcInvoice(i, settings).total, 0)
  const outstanding = outstandingInvoices.reduce((sum, i) => sum + calcInvoice(i, settings).balance, 0)
  const avg = invoices.length ? invoices.reduce((sum, i) => sum + calcInvoice(i, settings).total, 0) / invoices.length : 0
  const thisMonth = new Date().toISOString().slice(0,7)
  const monthlyRevenue = paidInvoices.filter(i => String(i.invoiceDate || '').startsWith(thisMonth)).reduce((sum, i) => sum + calcInvoice(i, settings).total, 0)

  async function saveRecord(table, record, setter, message) {
    try {
      await upsertRecord(table, record)
      setter(prev => { const ix = prev.findIndex(x => x.id === record.id); if (ix >= 0) { const next = [...prev]; next[ix] = record; return next } return [record, ...prev] })
      setDbStatus(supabaseEnabled ? 'connected' : 'offline')
      flash(message)
    } catch (err) {
      console.error(err); flash(`Database save failed: ${err.message}`)
    }
  }

  async function addCustomer(){ if(!customerDraft.name.trim()) return flash('Add customer name first'); const rec={id:uid(),createdAt:today(),...customerDraft}; await saveRecord('customers',rec,setCustomers,'Customer saved to database'); setCustomerDraft({name:'',email:'',phone:'',address:'',notes:''}) }
  async function deleteCustomer(id){ if(!confirm('Delete customer?')) return; try{await deleteRecord('customers',id); setCustomers(prev=>prev.filter(c=>c.id!==id)); flash('Customer deleted')}catch(e){flash(e.message)} }
  function useCustomer(customer){ const firstVehicle=vehicles.find(v=>v.customerId===customer.id); setDraft(prev=>({...prev,customerId:customer.id,customerName:customer.name,customerEmail:customer.email,customerPhone:customer.phone,customerAddress:customer.address,vehicleId:firstVehicle?.id||'',vehicle:firstVehicle?.makeModel||'',registration:firstVehicle?.registration||''})); setTab('invoice') }
  async function addVehicle(){ if(!vehicleDraft.makeModel.trim()&&!vehicleDraft.registration.trim()) return flash('Add vehicle details first'); const rec={id:uid(),createdAt:today(),...vehicleDraft}; await saveRecord('vehicles',rec,setVehicles,'Vehicle saved to database'); setVehicleDraft({customerId:'',makeModel:'',registration:'',colour:'',mileage:'',notes:''})}
  async function deleteVehicle(id){ if(!confirm('Delete vehicle?')) return; try{await deleteRecord('vehicles',id); setVehicles(prev=>prev.filter(v=>v.id!==id)); flash('Vehicle deleted')}catch(e){flash(e.message)} }
  function useVehicle(vehicle){ const customer=customers.find(c=>c.id===vehicle.customerId); setDraft(prev=>({...prev,customerId:customer?.id||'',customerName:customer?.name||prev.customerName,customerEmail:customer?.email||prev.customerEmail,customerPhone:customer?.phone||prev.customerPhone,customerAddress:customer?.address||prev.customerAddress,vehicleId:vehicle.id,vehicle:vehicle.makeModel,registration:vehicle.registration})); setTab('invoice') }

  const addItem=()=>setDraft(prev=>({...prev,items:[...prev.items,{id:uid(),description:'',qty:1,rate:0}]}))
  const updateItem=(id,key,value)=>setDraft(prev=>({...prev,items:prev.items.map(item=>item.id===id?{...item,[key]:value}:item)}))
  const deleteItem=(id)=>setDraft(prev=>({...prev,items:prev.items.filter(item=>item.id!==id)}))
  const applyPackage=(pkg)=>setDraft(prev=>({...prev,items:[...prev.items,{id:uid(),description:pkg.description,qty:1,rate:pkg.price}]}))

  async function saveInvoice(){ await saveRecord('invoices',{...draft,updatedAt:new Date().toISOString()},setInvoices,'Invoice saved to database') }
  const newDraftInvoice=()=>{setDraft(createInvoice(nextNumber(settings.invoicePrefix,invoices,'invoiceNo'))); setTab('invoice')}
  const openInvoice=(invoice)=>{setDraft(invoice); setTab('invoice')}
  const duplicateInvoice=(invoice)=>{setDraft({...invoice,id:uid(),invoiceNo:nextNumber(settings.invoicePrefix,invoices,'invoiceNo'),status:'Draft',invoiceDate:today(),dueDate:today()}); setTab('invoice')}
  async function deleteInvoice(id){ if(!confirm('Delete invoice?')) return; try{await deleteRecord('invoices',id); setInvoices(prev=>prev.filter(i=>i.id!==id)); flash('Invoice deleted from database')}catch(e){flash(e.message)} }
  async function markPaid(){ const paid={...draft,status:'Paid',depositPaid:totals.total}; setDraft(paid); await saveRecord('invoices',paid,setInvoices,'Marked as paid') }
  async function generateReceipt(){ const receipt={id:uid(),receiptNo:nextNumber(settings.receiptPrefix,receipts,'receiptNo'),invoiceNo:draft.invoiceNo,date:today(),customerName:draft.customerName,customerEmail:draft.customerEmail,vehicle:draft.vehicle,registration:draft.registration,total:totals.total}; await saveRecord('receipts',receipt,setReceipts,'Receipt saved to database'); await markPaid(); setTab('receipts') }
  async function convertToQuote(){ const quote={...draft,id:uid(),quoteNo:nextNumber(settings.quotePrefix,quotes,'quoteNo'),quoteDate:today(),status:'Pending',total:totals.total}; await saveRecord('quotes',quote,setQuotes,'Quote saved to database'); setTab('quotes') }
  function convertQuoteToInvoice(quote){ setDraft({...quote,id:uid(),invoiceNo:nextNumber(settings.invoicePrefix,invoices,'invoiceNo'),status:'Draft',invoiceDate:today(),dueDate:today()}); setTab('invoice') }
  async function addBooking(){ const rec={id:uid(),createdAt:today(),...bookingDraft}; await saveRecord('bookings',rec,setBookings,'Booking saved to database'); setBookingDraft({date:today(),time:'09:00',customerName:'',vehicle:'',service:'Maintenance Detail',status:'Confirmed',notes:''}) }
  async function deleteBooking(id){ if(!confirm('Delete booking?')) return; try{await deleteRecord('bookings',id); setBookings(prev=>prev.filter(b=>b.id!==id)); flash('Booking deleted')}catch(e){flash(e.message)} }
  async function addPackage(){ if(!packageDraft.name.trim()) return flash('Add package name first'); const rec={id:uid(),...packageDraft,price:Number(packageDraft.price||0)}; await saveRecord('packages',rec,setPackages,'Package saved to database'); setPackageDraft({name:'',description:'',price:0}) }
  async function deletePackage(id){ if(!confirm('Delete package?')) return; try{await deleteRecord('packages',id); setPackages(prev=>prev.filter(p=>p.id!==id)); flash('Package deleted')}catch(e){flash(e.message)} }
  async function saveBusinessSettings(){ try{ await saveSettings(settings); flash('Settings saved to database') } catch(e){ flash(e.message) } }
  async function exportPdf(){ setBusy(true); try{ await exportNodeToPdf(invoiceRef.current, `${draft.invoiceNo}.pdf`) } finally{ setBusy(false) } }
  async function importBackup(event){ const file=event.target.files?.[0]; if(!file) return; const data=JSON.parse(await file.text()); if(data.settings)setSettings(data.settings); if(data.customers)setCustomers(data.customers); if(data.vehicles)setVehicles(data.vehicles); if(data.invoices)setInvoices(data.invoices); if(data.receipts)setReceipts(data.receipts); if(data.quotes)setQuotes(data.quotes); if(data.bookings)setBookings(data.bookings); if(data.packages)setPackages(data.packages); if(data.draft)setDraft(data.draft); event.target.value=''; flash('Backup imported locally. Save items to database as needed.') }

  const filteredCustomers=customers.filter(c=>[c.name,c.email,c.phone,c.address].join(' ').toLowerCase().includes(search.toLowerCase()))
  const filteredVehicles=vehicles.filter(v=>[v.makeModel,v.registration,v.colour,v.notes].join(' ').toLowerCase().includes(search.toLowerCase()))
  const filteredInvoices=invoices.filter(i=>[i.invoiceNo,i.customerName,i.vehicle,i.registration,i.status].join(' ').toLowerCase().includes(search.toLowerCase()))

  return <div className="appShell"><Hero/><div className="layout"><Sidebar tab={tab} setTab={setTab} onExport={()=>downloadBackup(state)} onImportClick={()=>fileRef.current?.click()} dbStatus={dbStatus}/><input ref={fileRef} type="file" accept="application/json" onChange={importBackup} hidden/><main><TopBar tab={tab} search={search} setSearch={setSearch} onNewInvoice={newDraftInvoice} onSave={saveInvoice} onPdf={exportPdf} onEmail={()=>openEmail(settings,draft,totals)} onWhatsapp={()=>openWhatsapp(settings,draft,totals)} busy={busy} dbStatus={dbStatus}/>{toast&&<div className="toast no-print"><CheckCircle2 size={16}/>{toast}</div>}{tab==='dashboard'&&<Dashboard revenue={revenue} monthlyRevenue={monthlyRevenue} outstanding={outstanding} invoices={invoices} paidInvoices={paidInvoices} avg={avg} outstandingInvoices={outstandingInvoices} bookings={bookings} setTab={setTab} newDraftInvoice={newDraftInvoice} settings={settings}/>} {tab==='customers'&&<Customers customers={filteredCustomers} vehicles={vehicles} customerDraft={customerDraft} setCustomerDraft={setCustomerDraft} addCustomer={addCustomer} deleteCustomer={deleteCustomer} useCustomer={useCustomer} invoices={invoices} settings={settings}/>} {tab==='vehicles'&&<Vehicles vehicles={filteredVehicles} customers={customers} vehicleDraft={vehicleDraft} setVehicleDraft={setVehicleDraft} addVehicle={addVehicle} deleteVehicle={deleteVehicle} useVehicle={useVehicle} invoices={invoices}/>} {tab==='invoice'&&<InvoiceDesigner draft={draft} updateDraft={(k,v)=>setDraft(prev=>({...prev,[k]:v}))} totals={totals} settings={settings} packages={packages} addItem={addItem} updateItem={updateItem} deleteItem={deleteItem} applyPackage={applyPackage} saveInvoice={saveInvoice} exportPdf={exportPdf} sendEmail={()=>openEmail(settings,draft,totals)} sendWhatsapp={()=>openWhatsapp(settings,draft,totals)} markPaid={markPaid} generateReceipt={generateReceipt} convertToQuote={convertToQuote} invoiceRef={invoiceRef}/>} {tab==='invoices'&&<Invoices invoices={filteredInvoices} settings={settings} openInvoice={openInvoice} duplicateInvoice={duplicateInvoice} deleteInvoice={deleteInvoice}/>} {tab==='quotes'&&<Quotes quotes={quotes} settings={settings} convertQuoteToInvoice={convertQuoteToInvoice}/>} {tab==='bookings'&&<Bookings bookings={bookings} bookingDraft={bookingDraft} setBookingDraft={setBookingDraft} addBooking={addBooking} deleteBooking={deleteBooking}/>} {tab==='packages'&&<Packages packages={packages} packageDraft={packageDraft} setPackageDraft={setPackageDraft} addPackage={addPackage} deletePackage={deletePackage}/>} {tab==='reports'&&<Reports invoices={invoices} customers={customers} vehicles={vehicles} settings={settings}/>} {tab==='receipts'&&<Receipts receipts={receipts}/>} {tab==='settings'&&<SettingsPage settings={settings} setSettings={setSettings} onSave={saveBusinessSettings}/>}</main></div></div>
}
