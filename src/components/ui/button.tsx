import type React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className, style, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={className}
      style={{
        border: '1px solid #d1d5db',
        borderRadius: 8,
        padding: '8px 12px',
        background: props.disabled ? '#f3f4f6' : '#fff',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    />
  );
}
