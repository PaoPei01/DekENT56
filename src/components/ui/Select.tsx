import type { SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Array<string | { value: string; label: string }>;
  placeholder?: string;
};

export function Select({ label, options, placeholder = 'ทั้งหมด', id, className = '', ...props }: SelectProps) {
  const selectId = id ?? props.name ?? label;
  return (
    <label className={`field ${className}`} htmlFor={selectId}>
      <span>{label}</span>
      <select id={selectId} {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
          <option key={value} value={value}>
            {optionLabel}
          </option>
          );
        })}
      </select>
    </label>
  );
}
