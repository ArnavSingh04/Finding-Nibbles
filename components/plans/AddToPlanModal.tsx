"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { toast } from "react-toastify";
import { CreatePlanModalForm } from "./CreatePlanModalForm";
import { api } from "@/lib/api-client";
import { GradientButton } from "@/components/ui/GradientButton";

interface Restaurant {
  displayName?: { text: string };
  [key: string]: any;
}

interface Plan {
  _id?: string;
  title: string;
  restaurants: Restaurant[];
}

interface AddToPlanModalProps {
  open: boolean;
  onClose: () => void;
  userPlans: Plan[];
  selectedRestaurant: Restaurant | null;
  onPlansChanged?: () => void;
}

const restaurantName = (r?: Restaurant | null) =>
  r?.displayName?.text || r?.name || "Unnamed restaurant";

export const AddToPlanModal: React.FC<AddToPlanModalProps> = ({
  open,
  onClose,
  userPlans,
  selectedRestaurant,
  onPlansChanged,
}) => {
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [addingToPlanId, setAddingToPlanId] = useState<string | null>(null);

  const handleClose = () => {
    onClose();
    setIsCreatingPlan(false);
  };

  const isAlreadyInPlan = (plan: Plan) =>
    !!selectedRestaurant &&
    plan.restaurants.some(
      (r) => restaurantName(r) === restaurantName(selectedRestaurant)
    );

  const handleAddToPlan = async (plan: Plan) => {
    if (!selectedRestaurant || !plan._id || isAlreadyInPlan(plan)) return;
    setAddingToPlanId(plan._id);
    try {
      await api.plans.addRestaurant(plan._id, selectedRestaurant);
      toast.success(`Added to "${plan.title}"`);
      onPlansChanged?.();
    } catch (err: any) {
      toast.error(err?.message || "Couldn't add to that trip");
    } finally {
      setAddingToPlanId(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      aria-labelledby="add-to-plan-modal-title"
    >
      <DialogTitle id="add-to-plan-modal-title" sx={{ fontWeight: 800 }}>
        Add to a trip
        {selectedRestaurant && (
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            {restaurantName(selectedRestaurant)}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {isCreatingPlan ? (
          <CreatePlanModalForm
            setIsCreatingPlan={setIsCreatingPlan}
            selectedRestaurant={selectedRestaurant}
            onCreated={() => {
              setIsCreatingPlan(false);
              onPlansChanged?.();
            }}
          />
        ) : (
          <GradientButton
            fullWidth
            startIcon={<AddRoundedIcon />}
            onClick={() => setIsCreatingPlan(true)}
          >
            Create a new trip
          </GradientButton>
        )}

        <div>
          {userPlans.length === 0 ? (
            <Typography sx={{ color: "text.secondary", fontStyle: "italic", py: 1 }}>
              No trips yet - create your first one above.
            </Typography>
          ) : (
            userPlans.map((plan, idx) => {
              const added = isAlreadyInPlan(plan);
              const busy = addingToPlanId === plan._id;
              return (
                <Accordion
                  key={plan._id ?? idx}
                  disableGutters
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    border: "1px solid var(--border)",
                    "&:before": { display: "none" },
                    boxShadow: "none",
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                    <div className="flex w-full items-center justify-between gap-2 pr-2">
                      <span className="min-w-0 truncate font-semibold">
                        {plan.title?.trim() || "Untitled trip"}
                      </span>
                      {added ? (
                        <Chip
                          size="small"
                          color="success"
                          icon={<CheckRoundedIcon />}
                          label="Added"
                        />
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          disabled={!selectedRestaurant || busy}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToPlan(plan);
                          }}
                          sx={{ textTransform: "none", borderRadius: 2 }}
                        >
                          {busy ? "Adding…" : "Add"}
                        </Button>
                      )}
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    {plan.restaurants.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {plan.restaurants.map((r, ridx) => (
                          <li key={ridx} style={{ fontSize: 14 }}>
                            {restaurantName(r)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                        No restaurants in this trip yet.
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
