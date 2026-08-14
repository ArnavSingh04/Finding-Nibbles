"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";

import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { GradientButton } from "@/components/ui/GradientButton";
import AddPreferenceModal from "@/components/profile/AddPreferenceModal";

const DEFAULT_IMAGE = "/images/default-profile-pic.png";

export default function ProfilePage() {
  const { user, isLoading, refetch } = useCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Profile details ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState<string>(DEFAULT_IMAGE);

  // --- Goals ---
  const [calorieGoal, setCalorieGoal] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fat, setFat] = useState<string>("");
  const [savingGoals, setSavingGoals] = useState(false);

  // --- Password ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Keep local form state in sync once the current user profile loads.
  useEffect(() => {
    if (!user) return;
    setName(user.profile?.name || "");
    setEmail(user.username || "");
    setPreferences(user.profile?.preferences || []);
    setProfileImage(user.profile?.profileImage || DEFAULT_IMAGE);
    setCalorieGoal(
      user.profile?.calorieGoal != null ? String(user.profile.calorieGoal) : ""
    );
    setProtein(
      user.profile?.macroGoals?.protein != null
        ? String(user.profile.macroGoals.protein)
        : ""
    );
    setCarbs(
      user.profile?.macroGoals?.carbs != null
        ? String(user.profile.macroGoals.carbs)
        : ""
    );
    setFat(
      user.profile?.macroGoals?.fat != null
        ? String(user.profile.macroGoals.fat)
        : ""
    );
  }, [user]);

  // --- Preferences ---
  const handleRemovePreference = (pref: string) => {
    setPreferences((prev) => prev.filter((p) => p !== pref));
  };

  const handleAddPreference = (newPref: string) => {
    const trimmed = newPref.trim();
    if (!trimmed) return;
    setPreferences((prev) =>
      prev.some((p) => p.toLowerCase() === trimmed.toLowerCase())
        ? prev
        : [...prev, trimmed]
    );
  };

  // --- Image upload ---
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      input.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      input.value = "";
      return;
    }

    setUploadingImage(true);
    const previousImage = profileImage;

    const reader = new FileReader();
    reader.onerror = () => {
      toast.error("Could not read that file. Please try another.");
      setUploadingImage(false);
      input.value = "";
    };
    reader.onload = async (e) => {
      const result = e.target?.result as string | undefined;
      const base64Data = result?.split(",")[1];
      if (!base64Data) {
        toast.error("Could not read that file. Please try another.");
        setUploadingImage(false);
        input.value = "";
        return;
      }
      try {
        await api.users.uploadProfileImage({
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64Data,
        });
        setProfileImage(`data:${file.type};base64,${base64Data}`);
        toast.success("Profile photo updated.");
        await refetch();
      } catch (err: any) {
        setProfileImage(previousImage); // revert preview on failure
        toast.error(err?.message || "Failed to upload photo.");
      } finally {
        setUploadingImage(false);
        input.value = ""; // allow re-selecting the same file
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageClick = () => {
    if (!uploadingImage) fileInputRef.current?.click();
  };

  // --- Save profile ---
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error("Please enter a display name.");
      return;
    }
    setSaving(true);
    try {
      await api.users.updateProfile(name.trim(), email.trim(), preferences);
      toast.success("Profile saved.");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  // --- Save goals ---
  const handleSaveGoals = async () => {
    const calorie = Number(calorieGoal);
    const p = Number(protein);
    const c = Number(carbs);
    const f = Number(fat);

    if (calorieGoal !== "" && (!Number.isFinite(calorie) || calorie < 0)) {
      toast.error("Calorie goal must be a positive number.");
      return;
    }
    if ([protein, carbs, fat].some((v) => v !== "" && Number(v) < 0)) {
      toast.error("Macro goals cannot be negative.");
      return;
    }

    setSavingGoals(true);
    try {
      if (calorieGoal !== "") {
        await api.users.updateCalorieGoal(calorie);
      }
      await api.users.updateMacroGoals({
        protein: Number.isFinite(p) ? p : 0,
        carbs: Number.isFinite(c) ? c : 0,
        fat: Number.isFinite(f) ? f : 0,
      });
      toast.success("Goals updated.");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update goals.");
    } finally {
      setSavingGoals(false);
    }
  };

  // --- Password ---
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasLength = newPassword.length >= 8;
  const isStrong = hasUppercase && hasNumber && hasLength;

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in every password field.");
      return;
    }
    if (!isStrong) {
      toast.error("New password does not meet the requirements.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setChangingPassword(true);
    try {
      await api.users.changePassword(currentPassword, newPassword);
      toast.success("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const clearPasswordFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const username = user?.username || "";

  if (isLoading && !user) {
    return (
      <PageContainer width="narrow">
        <LoadingState label="Loading your profile…" />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Your account"
        title="Profile"
        subtitle="Manage your details, taste preferences and goals."
      />

      {/* Profile header card */}
      <section className="card-surface animate-fade-in-up mb-6 p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={handleImageClick}
              disabled={uploadingImage}
              aria-label="Upload a new profile photo"
              className="relative block h-24 w-24 overflow-hidden rounded-full border-4 border-[var(--surface)] shadow-[var(--shadow-md)] ring-2 ring-[var(--terracotta)] transition hover:opacity-90 disabled:cursor-not-allowed"
            >
              <Image
                src={profileImage}
                alt="Profile photo"
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
              {uploadingImage && (
                <span className="absolute inset-0 grid place-items-center bg-black/40">
                  <CircularProgress size={28} sx={{ color: "#fff" }} />
                </span>
              )}
            </button>
            <span className="pointer-events-none absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-sunset text-white shadow-[var(--shadow-sm)]">
              <PhotoCameraRoundedIcon fontSize="small" />
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploadingImage}
            />
          </div>

          <div className="min-w-0 text-center sm:text-left">
            <h2 className="font-display text-2xl font-extrabold text-[var(--text)]">
              {name || "Your name"}
            </h2>
            {username && (
              <p className="text-[var(--text-muted)]">@{username}</p>
            )}
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Tap the photo to upload a new one · JPG, PNG or GIF up to 5 MB
            </p>
          </div>
        </div>
      </section>

      {/* Details card */}
      <section className="card-surface mb-6 p-6 sm:p-8">
        <h2 className="font-display mb-1 text-lg font-bold text-[var(--text)]">
          Details
        </h2>
        <p className="mb-5 text-sm text-[var(--text-muted)]">
          How you appear across Finding Nibbles.
        </p>

        <div className="grid gap-4">
          <TextField
            label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />

          <div>
            <p className="mb-2 text-sm font-semibold text-[var(--text)]">
              Food preferences
            </p>
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3">
              {preferences.length === 0 && (
                <span className="text-sm italic text-[var(--text-muted)]">
                  No preferences yet — add a few to sharpen your suggestions.
                </span>
              )}
              {preferences.map((pref) => (
                <Chip
                  key={pref}
                  label={pref}
                  onDelete={() => handleRemovePreference(pref)}
                  sx={{ fontWeight: 700 }}
                />
              ))}
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={() => setModalOpen(true)}
                sx={{ borderRadius: 999, borderStyle: "dashed" }}
              >
                Add preference
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <GradientButton onClick={handleSaveProfile} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </GradientButton>
        </div>
      </section>

      {/* Goals card */}
      <section className="card-surface mb-6 p-6 sm:p-8">
        <h2 className="font-display mb-1 text-lg font-bold text-[var(--text)]">
          Daily goals
        </h2>
        <p className="mb-5 text-sm text-[var(--text-muted)]">
          Set targets to track against your meals.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Calorie goal (kcal)"
            type="number"
            value={calorieGoal}
            onChange={(e) => setCalorieGoal(e.target.value)}
            inputProps={{ min: 0 }}
            fullWidth
          />
          <TextField
            label="Protein (g)"
            type="number"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            inputProps={{ min: 0 }}
            fullWidth
          />
          <TextField
            label="Carbs (g)"
            type="number"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            inputProps={{ min: 0 }}
            fullWidth
          />
          <TextField
            label="Fat (g)"
            type="number"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            inputProps={{ min: 0 }}
            fullWidth
          />
        </div>

        <div className="mt-6 flex justify-end">
          <GradientButton onClick={handleSaveGoals} disabled={savingGoals}>
            {savingGoals ? "Saving…" : "Save goals"}
          </GradientButton>
        </div>
      </section>

      {/* Change password card */}
      <section className="card-surface p-6 sm:p-8">
        <h2 className="font-display mb-1 text-lg font-bold text-[var(--text)]">
          Change password
        </h2>
        <p className="mb-5 text-sm text-[var(--text-muted)]">
          Use a strong password you don&apos;t reuse elsewhere.
        </p>

        <div className="grid gap-4">
          <TextField
            label="Current password"
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrent((v) => !v)}
                    edge="end"
                    tabIndex={-1}
                    aria-label="Toggle current password visibility"
                  >
                    {showCurrent ? (
                      <VisibilityOffRoundedIcon />
                    ) : (
                      <VisibilityRoundedIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="New password"
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNew((v) => !v)}
                    edge="end"
                    tabIndex={-1}
                    aria-label="Toggle new password visibility"
                  >
                    {showNew ? (
                      <VisibilityOffRoundedIcon />
                    ) : (
                      <VisibilityRoundedIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Confirm new password"
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            error={confirmPassword.length > 0 && confirmPassword !== newPassword}
            helperText={
              confirmPassword.length > 0 && confirmPassword !== newPassword
                ? "Passwords do not match."
                : " "
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirm((v) => !v)}
                    edge="end"
                    tabIndex={-1}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? (
                      <VisibilityOffRoundedIcon />
                    ) : (
                      <VisibilityRoundedIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <ul className="grid gap-1 text-sm">
            {[
              { ok: hasUppercase, label: "At least one uppercase letter" },
              { ok: hasNumber, label: "At least one number" },
              { ok: hasLength, label: "At least 8 characters" },
            ].map((req) => (
              <li
                key={req.label}
                className={`flex items-center gap-2 ${
                  req.ok ? "text-[var(--basil)]" : "text-[var(--text-muted)]"
                }`}
              >
                {req.ok ? (
                  <CheckCircleRoundedIcon fontSize="small" />
                ) : (
                  <RadioButtonUncheckedRoundedIcon fontSize="small" />
                )}
                {req.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="outlined"
            onClick={clearPasswordFields}
            disabled={changingPassword}
          >
            Clear
          </Button>
          <GradientButton
            onClick={handleChangePassword}
            disabled={changingPassword || !isStrong}
          >
            {changingPassword ? "Updating…" : "Update password"}
          </GradientButton>
        </div>
      </section>

      <AddPreferenceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddPreference}
        enableSelectList
        enableCustomInput
      />
    </PageContainer>
  );
}
