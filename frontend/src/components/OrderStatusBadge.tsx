import React from "react";

interface OrderStatusBadgeProps {
  status: "scheduled" | "pending" | "accepted" | "preparing" | "ready" | "completed" | "cancelled" | string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const getBadgeClass = () => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return "badge-info";
      case "pending":
        return "badge-warning";
      case "accepted":
        return "badge-primary";
      case "preparing":
        return "badge-primary animate-pulse";
      case "ready":
        return "badge-success";
      case "completed":
        return "badge-muted";
      case "cancelled":
        return "badge-error";
      default:
        return "badge-muted";
    }
  };

  return (
    <span className={`badge ${getBadgeClass()}`}>
      {status || "Unknown"}
    </span>
  );
};
