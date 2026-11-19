import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Entrar from "./pages/Entrar";
import Aulas from "./pages/Aulas";
import RedefinirSenha from "./pages/RedefinirSenha";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import Assinar from "./pages/Assinar";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/entrar" element={<Entrar />} />
        <Route path="/assinar/:plano" element={<Assinar />} />
        <Route path="/aulas" element={<Aulas />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;