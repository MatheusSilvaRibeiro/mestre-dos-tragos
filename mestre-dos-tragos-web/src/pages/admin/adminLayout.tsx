import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

interface NavItem {
  path:  string;
  label: string;
  emoji: string;
  end?:  boolean; // usado no NavLink para match exato de rota
}

// Itens do menu principal — rotas exclusivas de ADMIN
const navItems: NavItem[] = [
  { path: '/admin',              label: 'Dashboard',    emoji: '📊', end: true },
  { path: '/admin/cardapio',     label: 'Cardapio',     emoji: '🍔' },
  { path: '/admin/funcionarios', label: 'Funcionarios', emoji: '👥' },
  { path: '/admin/pedidos',      label: 'Pedidos',      emoji: '📋' },
];

// Itens de operacao — atalhos para as telas de atendente e cozinha
const opItems: NavItem[] = [
  { path: '/atendente', label: 'Atendente', emoji: '🧾' },
  { path: '/cozinha',   label: 'Cozinha',   emoji: '👨‍🍳' },
];

// Mapa de pathname para label legivel — usado no breadcrumb do topbar
const breadcrumbMap: Record<string, string> = {
  '/admin':              'Dashboard',
  '/admin/cardapio':     'Cardapio',
  '/admin/funcionarios': 'Funcionarios',
  '/admin/pedidos':      'Pedidos',
  '/atendente':          'Atendente',
  '/cozinha':            'Cozinha',
};

export default function AdminLayout() {
  const { funcionario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Controla abertura do menu lateral em telas mobile
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() { logout(); navigate('/login'); }

  // Fallback para rotas nao mapeadas
  const currentLabel = breadcrumbMap[location.pathname] ?? 'Painel';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* OVERLAY MOBILE — fecha o menu ao clicar fora da sidebar */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 40 }}
        />
      )}

      {/* SIDEBAR — fixa, com logo, navegacao e informacoes do usuario */}
      <aside className="sidebar" style={{ zIndex: 50 }}>

        {/* LOGO */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🍺</div>
          <div>
            <span className="sidebar-logo-name">Mestre dos Tragos</span>
            <span className="sidebar-logo-sub">Sistema de Gestao</span>
          </div>
        </div>

        <nav className="sidebar-nav">

          {/* SECAO PRINCIPAL — dashboard, cardapio, funcionarios, pedidos */}
          <div className="sidebar-section">
            <p className="sidebar-section-label">Principal</p>
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setMobileOpen(false)} // fecha menu ao navegar no mobile
                className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
              >
                <span className="sidebar-item-icon">{item.emoji}</span>
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* SECAO OPERACAO — atalhos para telas de atendente e cozinha */}
          <div className="sidebar-section">
            <p className="sidebar-section-label">Operacao</p>
            {opItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
              >
                <span className="sidebar-item-icon">{item.emoji}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* RODAPE DA SIDEBAR — avatar, nome, cargo e botao de logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            {/* Avatar gerado com a inicial do nome — sem necessidade de imagem */}
            <div className="sidebar-avatar">
              {funcionario?.nome?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {funcionario?.nome}
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                {funcionario?.role}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span>🚪</span> Sair
          </button>
        </div>
      </aside>

      {/* AREA DE CONTEUDO — topbar fixo + pagina renderizada pelo Outlet */}
      <div className="content-area">

        {/* TOPBAR — botao de menu mobile, breadcrumb e indicador de status */}
        <header className="topbar">
          <button onClick={() => setMobileOpen(true)} className="btn btn-icon btn-ghost">☰</button>
          <div className="topbar-breadcrumb">
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>🍺</span>
            <span className="topbar-breadcrumb-sep">/</span>
            <span className="topbar-breadcrumb-current">{currentLabel}</span>
          </div>
          <div className="topbar-status">
            <span className="topbar-status-dot" />
            Online
          </div>
        </header>

        {/* OUTLET — renderiza a pagina ativa da rota filha */}
        <main className="page-content animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}