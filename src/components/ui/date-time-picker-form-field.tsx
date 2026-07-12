"use client";

import { useState } from "react";
import { DateTimePicker } from "@/components/ui/date-time-picker";

type DateTimePickerFormFieldProps = {
  name: string;
  initialValue?: string;
  required?: boolean;
  label?: string;
  className?: string;
  onValueChange?: (value: string) => void;
};

export function DateTimePickerFormField({
  name,
  initialValue = "",
  required,
  label,
  className,
  onValueChange,
}: DateTimePickerFormFieldProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className={className}>
      <DateTimePicker
        value={value}
        onChange={(nextValue) => {
          setValue(nextValue);
          onValueChange?.(nextValue);
        }}
        label={label}
      />
      <input type="hidden" name={name} value={value} required={required} />
    </div>
  );
}
