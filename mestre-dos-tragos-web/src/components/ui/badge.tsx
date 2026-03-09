type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean; // exibe um bolinho colorido antes do texto
}

// Classes de cor para o fundo e texto de cada variante
const badgeVariants: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger:  'bg-red-100 text-red-700',
  info:    'bg-blue-100 text-blue-700',
  default: 'bg-gray-100 text-gray-600',
};

// Cor do ponto indicador — segue a mesma variante do badge
const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger:  'bg-red-500',
  info:    'bg-blue-500',
  default: 'bg-gray-400',
};

export function Badge({ variant = 'default', children, dot = false }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeVariants[variant]}`}>
      {/* Ponto indicador opcional — util para status de pedidos, disponibilidade etc */}
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}