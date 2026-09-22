import React from "react";
import { Car } from "lucide-react";
import { Input } from "../ui/Input";
import styles from "./VehicleInfoFieldGroup.module.css";

export interface VehicleInfoFieldGroupProps {
  make: string;
  model: string;
  year: string;
  regOrVin?: string;
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
  className?: string;
}

export const VehicleInfoFieldGroup: React.FC<VehicleInfoFieldGroupProps> = ({
  make,
  model,
  year,
  regOrVin = "",
  onChange,
  errors = {},
  className = "",
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <Car size={16} className={styles.icon} />
        <span className={styles.title}>VEHICLE SPECIFICATION & IDENTIFICATION</span>
      </div>

      <div className={styles.grid}>
        <Input
          label="Vehicle Make"
          placeholder="e.g. Toyota, Mercedes-Benz, Honda"
          value={make}
          onChange={(e) => onChange("make", e.target.value)}
          error={errors.make}
          required
        />
        <Input
          label="Vehicle Model"
          placeholder="e.g. Camry, C300, Accord, Hilux"
          value={model}
          onChange={(e) => onChange("model", e.target.value)}
          error={errors.model}
          required
        />
        <Input
          label="Model Year"
          placeholder="e.g. 2018"
          value={year}
          onChange={(e) => onChange("year", e.target.value)}
          error={errors.year}
          isMonospace
          required
        />
        <Input
          label="Registration No. / VIN (Optional)"
          placeholder="e.g. ABC-123-XY or 17-digit VIN"
          value={regOrVin}
          onChange={(e) => onChange("regOrVin", e.target.value)}
          error={errors.regOrVin}
          isMonospace
          helperText="Assists technicians in verifying ECU and harness versions."
        />
      </div>
    </div>
  );
};
