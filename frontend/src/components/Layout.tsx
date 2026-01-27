import { Link, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="app-container">
      <nav className="sidebar">
        <h2>NDP Affinities</h2>
        <ul>
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/endpoints">Endpoints</Link></li>
          <li><Link to="/datasets">Datasets</Link></li>
          <li><Link to="/services">Services</Link></li>
          <li><Link to="/dataset-endpoints">Dataset-Endpoints</Link></li>
          <li><Link to="/dataset-services">Dataset-Services</Link></li>
          <li><Link to="/service-endpoints">Service-Endpoints</Link></li>
          <li><Link to="/affinities">Affinities</Link></li>
        </ul>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
