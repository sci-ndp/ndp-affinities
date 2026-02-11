import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import {
  Dashboard,
  Endpoints,
  Datasets,
  Services,
  DatasetEndpoints,
  DatasetServices,
  ServiceEndpoints,
  Affinities,
  GraphConnectivity,
  GoldenRules
} from './pages';
import './App.css';

function App() {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const basename = baseUrl === '/' ? undefined : baseUrl.replace(/\/$/, '');

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="endpoints" element={<Endpoints />} />
          <Route path="datasets" element={<Datasets />} />
          <Route path="services" element={<Services />} />
          <Route path="dataset-endpoints" element={<DatasetEndpoints />} />
          <Route path="dataset-services" element={<DatasetServices />} />
          <Route path="service-endpoints" element={<ServiceEndpoints />} />
          <Route path="affinities" element={<Affinities />} />
          <Route path="graph-connectivity" element={<GraphConnectivity />} />
          <Route path="golden-rules" element={<GoldenRules />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
