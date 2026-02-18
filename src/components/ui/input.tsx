import type React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, style, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={className}
      style={{
        border: '1px solid #d1d5db',
        borderRadius: 8,
        padding: '8px 10px',
        width: '100%',
        ...style,
      }}
    />
  );
}
