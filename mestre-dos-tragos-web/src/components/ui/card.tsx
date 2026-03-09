interface CardProps {
  children:  React.ReactNode;
  className?: string;
  hover?:     boolean; // ativa efeito de elevacao e borda amarela ao passar o mouse
  padding?:   'sm' | 'md' | 'lg';
}

const paddings = { sm: 'p-4', md: 'p-5', lg: 'p-6' };

export function Card({ children, className = '', hover = false, padding = 'md' }: CardProps) {
  return (
    <div className={`
      bg-white rounded-2xl border border-gray-100 shadow-sm
      ${paddings[padding]}
      ${hover ? 'hover:shadow-md hover:border-yellow-200 transition-all cursor-pointer' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}