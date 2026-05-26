"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import type { ChangeEvent } from "react";
import styles from "./ScoreInput.module.css";

interface ScoreInputProps {
  value: number | null;
  onChange: (newValue: number | null) => void;
  readonly?: boolean;
}

export function ScoreInput({ value, onChange, readonly = false }: ScoreInputProps) {
  if (readonly) {
    return (
      <div className={styles.readonly}>
        {value === null ? "-" : value}
      </div>
    );
  }

  const handleIncrement = () => {
    onChange(value === null ? 1 : Math.min(20, value + 1));
  };

  const handleDecrement = () => {
    if (value !== null && value > 0) {
      onChange(value - 1);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.trim();
    if (raw === "") {
      onChange(null);
      return;
    }

    const parsed = Number(raw.replace(/\D/g, ""));
    if (Number.isNaN(parsed)) return;
    onChange(Math.min(20, Math.max(0, parsed)));
  };

  return (
    <div className={styles.wrapper}>
      <button 
        type="button" 
        className={styles.btn} 
        onClick={handleIncrement}
        aria-label="Aumentar goles"
      >
        <ChevronUp className={styles.btnIcon} />
      </button>
      
      <input
        className={styles.value}
        value={value === null ? "" : value}
        onChange={handleInputChange}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        placeholder="-"
        aria-label="Goles"
      />

      <button 
        type="button" 
        className={styles.btn} 
        onClick={handleDecrement}
        disabled={value === null || value === 0}
        aria-label="Disminuir goles"
      >
        <ChevronDown className={styles.btnIcon} />
      </button>
    </div>
  );
}
