import type React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = '', type = 'text', ...props }: InputProps) {
  return (
    <input
      {...props}
      type={type}
      className={[
        'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300',
        className,
      ].join(' ')}
    />
  );
}
