interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; // texto acima do campo
  error?: string; // mensagem de validacao — deixa o campo vermelho
  icon?:  string; // icone posicionado dentro do campo, no lado esquerdo
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Icone absoluto dentro do input — o padding-left do input aumenta para nao sobrepor */}
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {icon}
          </span>
        )}
        <input
          {...props}
          className={`
            w-full px-4 py-2.5 border rounded-xl text-sm text-gray-800
            placeholder-gray-400 bg-white
            focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent
            transition-all
            ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}
            ${icon ? 'pl-9' : ''}
            ${className}
          `}
        />
      </div>
      {/* Mensagem de erro — exibida abaixo do campo quando houver */}
      {error && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}