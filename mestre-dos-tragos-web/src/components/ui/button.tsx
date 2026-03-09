type Variant = 'primary' | 'danger' | 'ghost' | 'outline';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean; // exibe spinner e desabilita o botao durante operacoes async
  icon?: string;     // emoji ou caractere exibido antes do texto
}

// Estilos visuais por variante
const variants: Record<Variant, string> = {
  primary: 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold',
  danger:  'bg-red-500 hover:bg-red-600 text-white font-bold',
  ghost:   'bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold',
  outline: 'border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold',
};

// Tamanhos de padding, fonte e borda
const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
};

export function Button({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 transition-all
        ${variants[variant]}
        ${sizes[size]}
        ${disabled || loading ? 'opacity-60 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {/* Loading: spinner animado | Icone: caractere simples | Nenhum: so texto */}
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span>{icon}</span>
      ) : null}
      {children}
    </button>
  );
}