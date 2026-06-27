import Card from './Card.jsx'
export default function Stat({ label, value, sub, icon: Icon, tone = 'blue' }) {
  return <Card className={`stat stat-${tone}`}><div><span>{label}</span><b>{value}</b><small>{sub}</small></div><div className="statIcon"><Icon size={20}/></div><div className="spark"></div></Card>
}
