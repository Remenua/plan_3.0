import type React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={[
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm transition-colors',
        'disabled:opacity-50 disabled:pointer-events-none',
        className,
      ].join(' ')}
    />
  );
}
