export function Dashboard() {
  return (
    <div>
      <h1>NDP Affinities Dashboard</h1>
      <p>Welcome to the NDP Affinities management system.</p>
      <div className="dashboard-cards">
        <div className="card">
          <h3>Endpoints</h3>
          <p>Manage API endpoints and their configurations</p>
        </div>
        <div className="card">
          <h3>Datasets</h3>
          <p>Manage datasets and their metadata</p>
        </div>
        <div className="card">
          <h3>Services</h3>
          <p>Manage services and their types</p>
        </div>
        <div className="card">
          <h3>Relationships</h3>
          <p>Manage relationships between datasets, endpoints, and services</p>
        </div>
        <div className="card">
          <h3>Affinities</h3>
          <p>Manage affinity triples</p>
        </div>
      </div>
    </div>
  );
}
