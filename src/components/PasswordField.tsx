import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordField({
  id,
  value,
  onChange,
  autoComplete = "current-password",
  disabled,
  invalid,
  minLength,
  required,
  className,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  disabled?: boolean;
  invalid?: boolean;
  minLength?: number;
  required?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        disabled={disabled}
        minLength={minLength}
        required={required}
        placeholder={placeholder}
        className={className ?? "mt-1 w-full rounded-lg border-2 border-ink bg-white px-3 py-2 pr-11 text-sm"}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        title={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 rounded-md border-2 border-ink/20 bg-white/70 p-1 text-ink/70 transition hover:border-ink hover:text-ink"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
