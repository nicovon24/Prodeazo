"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import styles from "./ScoreInput.module.css";

interface ScoreInputProps {
  value: number | null;
  onChange: (newValue: number) => void;
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
    onChange(value === null ? 0 : value + 1);
  };

  const handleDecrement = () => {
    if (value !== null && value > 0) {
      onChange(value - 1);
    }
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
      
      <div className={styles.value}>
        {value === null ? "-" : value}
      </div>

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
