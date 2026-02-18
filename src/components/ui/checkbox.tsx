import type React from 'react';

type CheckboxProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
};

export function Checkbox({ checked = false, onCheckedChange, className = '' }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={['h-4 w-4 rounded border-gray-300 accent-amber-400', className].join(' ')}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  );
}
