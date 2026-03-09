import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/authContext';
import Splash           from './pages/splash';
import Login            from './pages/login';
import AdminLayout      from './pages/admin/adminLayout';
import Dashboard        from './pages/admin/Dashboard';
import Cardapio         from './pages/admin/cardapio/index';
import Funcionarios     from './pages/admin/funcionarios';
import HistoricoPedidos from './pages/admin/pedidos/index';
import Cozinha          from './pages/cozinha/index';
import Atendente        from './pages/atendente/index';

// 
// PROTECTED ROUTE
// Verifica autenticacao e role antes de renderizar a pagina.
// Aceita tanto o estado do contexto quanto o localStorage como fonte de verdade
// — necessario para o caso de refresh de pagina antes do contexto hidratar.
// 
function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: ('ADMIN' | 'ATENDENTE' | 'COZINHA')[];
}) {
  const { isAuthenticated, funcionario } = useAuth();
  const token            = localStorage.getItem('token');
  const raw              = localStorage.getItem('funcionario');
  const localFuncionario = raw ? JSON.parse(raw) : null;
  const autenticado      = isAuthenticated || !!token;
  const funcionarioAtual = funcionario ?? localFuncionario;

  if (!autenticado)                                              return <Navigate to="/login" replace />;
  if (roles && !funcionarioAtual)                                return null;
  if (roles && funcionarioAtual && !roles.includes(funcionarioAtual.role)) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* PUBLICAS */}
          <Route path="/"      element={<Splash />} />
          <Route path="/login" element={<Login />} />

          {/* ADMIN — layout com sidebar + nested routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index               element={<Dashboard />}        />
            <Route path="cardapio"     element={<Cardapio />}         />
            <Route path="funcionarios" element={<Funcionarios />}     />
            <Route path="pedidos"      element={<HistoricoPedidos />} />
          </Route>

          {/* ATENDENTE — acessivel por ATENDENTE e ADMIN */}
          <Route path="/atendente" element={
            <ProtectedRoute roles={['ATENDENTE', 'ADMIN']}>
              <Atendente />
            </ProtectedRoute>
          } />

          {/* COZINHA — acessivel por COZINHA e ADMIN */}
          <Route path="/cozinha" element={
            <ProtectedRoute roles={['COZINHA', 'ADMIN']}>
              <Cozinha />
            </ProtectedRoute>
          } />

          {/* FALLBACK — qualquer rota desconhecida volta para splash */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}