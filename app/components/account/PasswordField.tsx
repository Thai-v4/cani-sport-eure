"use client";

import { useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/password";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  showRules?: boolean;
  invalid?: boolean;
  describedBy?: string;
};

// Champ mot de passe avec bouton afficher / masquer et, en création, la liste des règles
export default function PasswordField({ id, label, value, onChange, autoComplete, showRules = false, invalid, describedBy }: Props) {
  const [visible, setVisible] = useState(false);
  const rulesId = `${id}-regles`;

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          aria-invalid={invalid || undefined}
          aria-describedby={[showRules ? rulesId : null, describedBy].filter(Boolean).join(" ") || undefined}
          className="field pr-12"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-3 hover:text-ink"
        >
          {visible ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
        </button>
      </div>
      {showRules && (
        <ul id={rulesId} className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[0.8125rem]">
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(value);
            return (
              <li key={rule.id} className={`flex items-center gap-1.5 ${ok ? "text-success" : "text-ink-3"}`}>
                <Check aria-hidden className={`size-3.5 ${ok ? "opacity-100" : "opacity-30"}`} />
                {rule.label}
                <span className="sr-only">{ok ? " : respecté" : " : manquant"}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
