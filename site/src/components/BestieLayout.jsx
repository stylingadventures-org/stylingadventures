import { Outlet } from 'react-router-dom'
import BestieSidebar from './BestieSidebar'
import '../styles/bestie-layout.css'

export default function BestieLayout() {
  return (
    <div className="bestie-layout">
      <BestieSidebar />
      <main className="bestie-main">
        <Outlet />
      </main>
    </div>
  )
}
