import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app-container">
      <header className="mobile-header">
        <button type="button" className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          Menu
        </button>
        <h2>NDP Affinities</h2>
      </header>

      {menuOpen && <button type="button" className="sidebar-overlay" onClick={closeMenu} aria-label="Close menu" />}

      <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <h2>NDP Affinities</h2>
        <ul>
          <li><NavLink to="/" onClick={closeMenu} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Dashboard</NavLink></li>
          <li><NavLink to="/endpoints" onClick={closeMenu} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Endpoints</NavLink></li>
          <li><NavLink to="/datasets" onClick={closeMenu} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Datasets</NavLink></li>
          <li><NavLink to="/services" onClick={closeMenu} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Services</NavLink></li>
          <li><NavLink to="/dataset-endpoints" onClick={closeMenu} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Dataset-Endpoints</NavLink></li>
          <li><NavLink to="/dataset-services" onClick={closeMenu} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Dataset-Services</NavLink></li>
          <li><NavLink to="/service-endpoints" onClick={closeMenu} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Service-Endpoints</NavLink></li>
          <li><NavLink to="/affinities" onClick={closeMenu} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Affinities</NavLink></li>
          <li><NavLink to="/graph-connectivity" onClick={closeMenu} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Graph Connectivity</NavLink></li>
        </ul>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
