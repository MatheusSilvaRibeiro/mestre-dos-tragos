interface ModalProps {
  aberto:    boolean;          // controla se o modal esta visivel
  onFechar:  () => void;       // callback para fechar o modal
  titulo:    string;
  children:  React.ReactNode;  // corpo do modal
  footer?:   React.ReactNode;  // area inferior — botoes de acao
  tamanho?:  'sm' | 'md' | 'lg';
}

const tamanhos = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({ aberto, onFechar, titulo, children, footer, tamanho = 'md' }: ModalProps) {
  // Nao renderiza nada enquanto estiver fechado — evita elementos no DOM desnecessariamente
  if (!aberto) return null;

  return (
    // Overlay escuro que cobre toda a tela
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl w-full ${tamanhos[tamanho]} shadow-2xl max-h-[90vh] flex flex-col`}>

        {/* HEADER — titulo e botao de fechar */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-black text-gray-800 text-lg">{titulo}</h3>
          <button
            onClick={onFechar}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            x
          </button>
        </div>

        {/* BODY — conteudo scrollavel se ultrapassar a altura maxima */}
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>

        {/* FOOTER — opcional, renderiza so se for passado */}
        {footer && (
          <div className="p-5 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}