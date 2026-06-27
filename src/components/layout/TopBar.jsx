import { Bell, DownloadCloud, Mail, MessageCircle, Plus, Save, Search } from 'lucide-react'
import Button from '../ui/Button.jsx'
export default function TopBar({ tab, search, setSearch, onNewInvoice, onSave, onPdf, onEmail, onWhatsapp, busy }) {
  const titles = { dashboard:'Welcome back, Lewis! 👋', customers:'Customers', vehicles:'Vehicles', invoice:'Invoice Designer', invoices:'Invoices', quotes:'Quotes', bookings:'Bookings', packages:'Packages', reports:'Reports', receipts:'Receipts', settings:'Business Settings' }
  return <>
    <div className="bar no-print"><div className="back">‹  ←</div><div className="searchbox"><Search size={16}/><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} /><kbd>Ctrl K</kbd></div><button className="bell"><Bell size={18}/><span>3</span></button><div className="avatar">LD</div></div>
    <header className="top no-print"><div><h2>{titles[tab] || 'Dashboard'}</h2><p>{tab === 'dashboard' ? "Here's what's happening with your business today." : 'Manage your Detailing District workflow.'}</p></div><div className="actions"><Button onClick={onNewInvoice}><Plus size={16}/>New Invoice</Button><Button variant="outline" onClick={onSave}><Save size={16}/>Save</Button><Button variant="outline" onClick={onPdf} disabled={busy}><DownloadCloud size={16}/>{busy ? 'Building...' : 'PDF'}</Button><Button variant="outline" onClick={onEmail}><Mail size={16}/>Email</Button><Button variant="outline" onClick={onWhatsapp}><MessageCircle size={16}/>WhatsApp</Button></div></header>
  </>
}
