import type React from 'react';

type CheckboxProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
};

export function Checkbox({ checked = false, onCheckedChange, className }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={className}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      style={{ width: 16, height: 16 }}
    />
  );
}
