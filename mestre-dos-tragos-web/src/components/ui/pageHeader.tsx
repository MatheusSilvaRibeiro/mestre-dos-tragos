interface PageHeaderProps {
  title:     string;
  subtitle?: string;          // descricao secundaria abaixo do titulo
  action?:   React.ReactNode; // botao ou elemento posicionado no lado direito
}

// CABECALHO PADRAO DE PAGINA
// Usado no topo de todas as paginas admin para manter consistencia visual.
// O 'action' normalmente recebe um botao de "Novo cadastro".

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-black text-gray-800">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}