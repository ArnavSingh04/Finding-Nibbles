"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

interface ConfirmOptions {
  title?: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

/**
 * Promise-based confirm dialog - a real replacement for window.confirm().
 * Usage:
 *   const { confirm, dialog } = useConfirm();
 *   ...
 *   if (await confirm({ title: "Delete plan?", destructive: true })) { ... }
 *   return <>{dialog}...</>;
 */
export function useConfirm() {
  const [state, setState] = React.useState<ConfirmOptions | null>(null);
  const resolver = React.useRef<(v: boolean) => void>();

  const confirm = React.useCallback((options: ConfirmOptions = {}) => {
    setState(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (value: boolean) => {
    resolver.current?.(value);
    setState(null);
  };

  const dialog = (
    <Dialog open={!!state} onClose={() => close(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>{state?.title ?? "Are you sure?"}</DialogTitle>
      {state?.message && (
        <DialogContent>
          <DialogContentText>{state.message}</DialogContentText>
        </DialogContent>
      )}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => close(false)} color="inherit">
          {state?.cancelLabel ?? "Cancel"}
        </Button>
        <Button
          onClick={() => close(true)}
          variant="contained"
          color={state?.destructive ? "error" : "primary"}
          autoFocus
        >
          {state?.confirmLabel ?? "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return { confirm, dialog };
}
