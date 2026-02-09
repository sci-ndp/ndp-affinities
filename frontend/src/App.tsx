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
  GraphConnectivity
} from './pages';
import './App.css';

function App() {
  return (
    <BrowserRouter>
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
