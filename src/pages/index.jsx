import Layout from "./Layout.jsx";
import Dashboard from "./Dashboard";
import Pacientes from "./Pacientes";
import Terapias from "./Terapias";
import DetalhesPaciente from "./DetalhesPaciente";
import PraticasQuanticas from "./PraticasQuanticas";
import Relatorios from "./Relatorios";
import Welcome from "./Welcome";
import PortalPaciente from "./PortalPaciente";
import MinhaConta from "./MinhaConta";
import DetalhesTerapia from "./DetalhesTerapia";
import BibliotecaOleos from "./BibliotecaOleos";
import BibliotecaCristais from "./BibliotecaCristais";
import BibliotecaErvas from "./BibliotecaErvas";
import ManualTerapeuta from "./ManualTerapeuta";
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';

// Layout wrapper para rotas protegidas
function LayoutWrapper() {
    return (
        <Layout currentPageName="Dashboard">
            <Outlet />
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <Routes>
                {/* Rota pública */}
                <Route path="/" element={<Welcome />} />
                <Route path="/Welcome" element={<Welcome />} />
                
                {/* Rotas protegidas com Layout */}
                <Route element={<LayoutWrapper />}>
                    <Route path="/Dashboard" element={<Dashboard />} />
                    <Route path="/Pacientes" element={<Pacientes />} />
                    <Route path="/Terapias" element={<Terapias />} />
                    <Route path="/DetalhesPaciente" element={<DetalhesPaciente />} />
                    <Route path="/PraticasQuanticas" element={<PraticasQuanticas />} />
                    <Route path="/Relatorios" element={<Relatorios />} />
                    <Route path="/PortalPaciente" element={<PortalPaciente />} />
                    <Route path="/MinhaConta" element={<MinhaConta />} />
                    <Route path="/DetalhesTerapia" element={<DetalhesTerapia />} />
                    <Route path="/BibliotecaOleos" element={<BibliotecaOleos />} />
                    <Route path="/BibliotecaCristais" element={<BibliotecaCristais />} />
                    <Route path="/BibliotecaErvas" element={<BibliotecaErvas />} />
                    <Route path="/ManualTerapeuta" element={<ManualTerapeuta />} />
                </Route>
            </Routes>
        </Router>
    );
}
