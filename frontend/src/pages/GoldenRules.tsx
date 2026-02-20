import { Link } from 'react-router-dom';

const RULES = [
  {
    title: 'Stable Global IDs',
    status: 'Partially implemented',
    note: 'UIDs are stable in the central DB and surfaced across nodes/edges, but URN policy governance is not fully enforced yet.',
    proof: ['Datasets / Endpoints / Services pages', 'Affinity Explorer detail panel'],
    route: '/datasets',
    cta: 'View nodes',
  },
  {
    title: 'Pairs + Hyperedge',
    status: 'Implemented',
    note: 'Pairwise links (D->E, D->S, S->E) and hyperedge triples are modeled and visualized together.',
    proof: ['Graph Connectivity lanes and edges', 'Affinity Explorer triples + versions'],
    route: '/graph-connectivity',
    cta: 'Open graph proof',
  },
  {
    title: 'Central Materialized View',
    status: 'Implemented',
    note: 'NDP-central dashboard consolidates global counts, coverage, hubs, and latest affinity updates.',
    proof: ['Dashboard readiness + connectivity cards', 'Cross-entity filtering in explorer'],
    route: '/',
    cta: 'Open dashboard',
  },
  {
    title: 'Ingest + Versioning Discipline',
    status: 'Partially implemented',
    note: 'Upsert-style CRUD and triple version fields exist. Full event-envelope ingest discipline can be added next.',
    proof: ['Affinity create/edit modal', 'Seeded versioned triples in demo data'],
    route: '/affinities',
    cta: 'Inspect versions',
  },
  {
    title: 'Governance + Reconciliation',
    status: 'Planned',
    note: 'UI now explains the rule and can host drift/reconciliation widgets once backend checks are added.',
    proof: ['Golden Rules governance summary', 'Demo script path for rollout'],
    route: '/',
    cta: 'See rollout plan',
  },
];

export function GoldenRules() {
  return (
    <div className="rules-page">
      <div className="page-header">
        <div>
          <h1>Golden Rules</h1>
          <p className="lead">
            Single-page proof matrix that maps each architectural rule to working UI evidence and demo entry points.
          </p>
        </div>
      </div>

      <section className="rules-grid">
        {RULES.map((rule) => (
          <article key={rule.title} className="card rule-card">
            <div className="rule-header">
              <h3>{rule.title}</h3>
              <span className={`rule-status ${rule.status.toLowerCase().replace(/\s+/g, '-')}`}>{rule.status}</span>
            </div>
            <p>{rule.note}</p>
            <h4>Proof Points</h4>
            <ul className="rule-proof-list">
              {rule.proof.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link className="btn-primary" to={rule.route}>{rule.cta}</Link>
          </article>
        ))}
      </section>

    </div>
  );
}
