import type { SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: string[];
  placeholder?: string;
};

export function Select({ label, options, placeholder = 'ทั้งหมด', id, className = '', ...props }: SelectProps) {
  const selectId = id ?? props.name ?? label;
  return (
    <label className={`field ${className}`} htmlFor={selectId}>
      <span>{label}</span>
      <select id={selectId} {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
