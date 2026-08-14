"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Stack,
  Divider,
  Typography,
} from "@mui/material";
import { GradientButton } from "@/components/ui/GradientButton";

const MOCK_PREFERENCES = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Halal",
  "Kosher",
  "Dairy-Free",
  "Nut-Free",
  "Pescatarian",
];

interface AddPreferenceModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (preference: string) => void;
  // Toggle to enable/disable select list and custom input
  enableSelectList?: boolean;
  enableCustomInput?: boolean;
}

export const AddPreferenceModal: React.FC<AddPreferenceModalProps> = ({
  open,
  onClose,
  onAdd,
  enableSelectList = true,
  enableCustomInput = true,
}) => {
  const [selectedPref, setSelectedPref] = useState<string | null>(null);
  const [customPref, setCustomPref] = useState("");

  const reset = () => {
    setSelectedPref(null);
    setCustomPref("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAdd = () => {
    // Prefer the custom input when the user has typed something.
    if (enableCustomInput && customPref.trim()) {
      onAdd(customPref.trim());
      reset();
      onClose();
      return;
    }
    if (enableSelectList && selectedPref) {
      onAdd(selectedPref);
      reset();
      onClose();
      return;
    }
  };

  const canAdd =
    (enableCustomInput && customPref.trim().length > 0) ||
    (enableSelectList && !!selectedPref);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>Add a food preference</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {enableSelectList && (
            <Autocomplete
              options={MOCK_PREFERENCES}
              value={selectedPref}
              onChange={(_, value) => setSelectedPref(value)}
              disabled={!!customPref.trim()}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pick a common preference"
                  variant="outlined"
                  fullWidth
                />
              )}
            />
          )}

          {enableSelectList && enableCustomInput && (
            <Divider>
              <Typography variant="caption" color="text.secondary">
                or
              </Typography>
            </Divider>
          )}

          {enableCustomInput && (
            <TextField
              label="Type your own"
              placeholder="e.g. Low-carb"
              value={customPref}
              onChange={(e) => setCustomPref(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAdd) {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              variant="outlined"
              fullWidth
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <GradientButton onClick={handleAdd} disabled={!canAdd}>
          Add preference
        </GradientButton>
      </DialogActions>
    </Dialog>
  );
};

export default AddPreferenceModal;
