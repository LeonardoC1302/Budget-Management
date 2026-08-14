"use client";

import Select from "@/components/atoms/Select";
import { SUPPORTED_CURRENCIES, currencyLabel } from "@/lib/utils/currencies";

interface CurrencySelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
}

// Two-option currency picker (USD / CRC). Kept as a thin wrapper around the
// shared Select so form callers don't have to know the currency list.
export default function CurrencySelect({
  label,
  value,
  onChange,
  disabled,
  id,
  name,
}: CurrencySelectProps) {
  return (
    <Select
      label={label}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      options={SUPPORTED_CURRENCIES.map((c) => ({
        value: c.code,
        label: currencyLabel(c.code),
      }))}
    />
  );
}
