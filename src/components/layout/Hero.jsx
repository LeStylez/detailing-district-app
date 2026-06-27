const logo = '/logo.png'
export default function Hero() { return <header className="hero no-print"><div><h1>DETAILING DISTRICT <span>PRO</span></h1><p>DATABASE CONNECTED BUSINESS SUITE</p></div><img src={logo} onError={e=>e.currentTarget.style.display='none'} /></header> }
