import React from "react";
import { StockStatus } from "@/types";
import { Badge } from "../ui/Badge";

export interface StockBadgeProps {
  status: StockStatus;
  quantity?: number;
  size?: "sm" | "md";
  className?: string;
}

export const StockBadge: React.FC<StockBadgeProps> = ({
  status,
  quantity,
  size = "sm",
  className = "",
}) => {
  switch (status) {
    case "IN_STOCK":
      return (
        <Badge variant="green" size={size} dot className={className}>
          In Stock {quantity !== undefined && `(${quantity})`}
        </Badge>
      );
    case "LOW_STOCK":
      return (
        <Badge variant="amber" size={size} dot className={className}>
          Low Stock {quantity !== undefined && `(${quantity} left)`}
        </Badge>
      );
    case "OUT_OF_STOCK":
      return (
        <Badge variant="red" size={size} dot className={className}>
          Out of Stock
        </Badge>
      );
    case "BACKORDER":
      return (
        <Badge variant="blue" size={size} dot className={className}>
          Backorder Available
        </Badge>
      );
    default:
      return null;
  }
};
