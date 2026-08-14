"use client";

import React from "react";
import { PlanTableRow } from "./PlanTableRow";

/**
 * Grid of trip cards. Keeps the exported name and props for compatibility;
 * the empty/loading states are owned by the page.
 */
export const PlanTable = ({
  plans,
  onChanged,
}: {
  plans: any[];
  onChanged?: () => void;
}) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {plans.map((plan) => (
      <PlanTableRow key={plan._id} plan={plan} onChanged={onChanged} />
    ))}
  </div>
);
