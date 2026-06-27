import { BarChart3, Users, FileText, Receipt, Settings, Search, CalendarDays, Car, Package, ClipboardList, Download, Upload, Database } from 'lucide-react'
const logo = '/logo.png'
export const navItems = [
  ['dashboard', BarChart3, 'Dashboard'], ['customers', Users, 'Customers'], ['vehicles', Car, 'Vehicles'], ['invoice', FileText, 'Invoice Designer'],
  ['invoices', Search, 'Invoices'], ['quotes', ClipboardList, 'Quotes'], ['bookings', CalendarDays, 'Bookings'], ['packages', Package, 'Packages'],
  ['reports', BarChart3, 'Reports'], ['receipts', Receipt, 'Receipts'], ['settings', Settings, 'Settings'],
]
export default function Sidebar({ tab, setTab, onExport, onImportClick, dbStatus }) {
  return <aside className="nav no-print">
    <div className="brand"><img src={logo} onError={e=>e.currentTarget.style.display='none'} /><div><b>Detailing District</b><span>Premium Car Care Services</span></div></div>
    <div className={`dbStatus ${dbStatus === 'connected' ? 'online' : 'offline'}`}><Database size={15}/>{dbStatus === 'connected' ? 'Database connected' : 'Local / setup mode'}</div>
    {navItems.map(([key, Icon, label]) => <button key={key} onClick={() => setTab(key)} className={tab === key ? 'active' : ''}><Icon size={18}/>{label}</button>)}
    <div className="navcard"><b>Supabase Cloud</b><span>Invoices now save online after setup</span><Car size={84}/></div>
    <div className="navfoot"><button onClick={onExport}><Download size={16}/>Export Backup</button><button onClick={onImportClick}><Upload size={16}/>Import Backup</button></div>
  </aside>
}
