"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Snackbar,
  Alert,
  Fade,
  Paper,
  Grid,
  Chip,
  Avatar,
  Divider,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Login as LoginIcon,
  LockReset as LockResetIcon,
  VpnKey as VpnKeyIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  WarningAmber as WarningIcon,
  Person as PersonIcon,
  BusinessCenter as ServicesIcon,
  Insights as AnalyticsIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon,
  RocketLaunch as RocketLaunchIcon,
  People as PeopleGroupIcon,
  SettingsSuggest as SettingsSuggestIcon,
  VerifiedUser as VerifiedUserIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from "@mui/icons-material";
import { useColorMode } from "@/components/ThemeRegistry";
import Navbar from "@/components/Navbar";
import AppLayout from "@/components/AppLayout";
import ConfigurableForm, { FormFieldConfig } from "@/components/ConfigurableForm";
import ConfigurableTable from "@/components/ConfigurableTable";
import RolesView from "@/components/RolesView";
import PermissionsView from "@/components/PermissionsView";
import CompanyDashboardView from "@/components/CompanyDashboardView";
import NexvantaLogo from "@/components/NexvantaLogo";
import { User, AuthSession } from "@/types/user";

export default function Home() {
  const { mode, toggleColorMode } = useColorMode();
  // Authentication session state
  const [currentUser, setCurrentUser] = useState<AuthSession | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>("");

  // When logged out: "login" | "forgot" | "reset"
  const [authMode, setAuthMode] = useState<"login" | "forgot" | "reset">("login");
  const [sharedEmail, setSharedEmail] = useState("");

  // When logged in: landing tabs (0: User Management CRUD, 1: Customer Services, 2: Analytics)
  const [landingTab, setLandingTab] = useState(0);

  // User CRUD data state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal dialog states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Global toast alerts
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (
    message: string,
    severity: "success" | "error" | "info" | "warning" = "success"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  // Fetch users from Prisma API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        showToast(data.error || "Failed to load users", "error");
      }
    } catch {
      showToast("Error connecting to App database API", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Initialize CSRF token and verify existing session cookie
  useEffect(() => {
    const initAuth = async () => {
      try {
        const csrfRes = await fetch("/api/auth/csrf");
        const csrfData = await csrfRes.json();
        if (csrfData.csrfToken) {
          setCsrfToken(csrfData.csrfToken);
        }
      } catch {
        // CSRF init silent
      }

      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated && meData.user) {
            setCurrentUser(meData.user);
            setLandingTab(0);
          }
        }
      } catch {
        // No active session
      }
    };

    initAuth();
  }, []);

  // --- 1. LOGIN SUBMIT ---
  const handleLoginSubmit = async (values: Record<string, any>) => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers,
        body: JSON.stringify({ email: values.email, password: values.password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCurrentUser(data.user);
        showToast(`Welcome, ${data.user.name}! Navigating to Customer Portal.`, "success");
        setLandingTab(0); // Navigate straight to Landing Page Dashboard
        fetchUsers();
      } else {
        showToast(data.error || "Invalid email or password", "error");
      }
    } catch {
      showToast("Server connection error during login", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGOUT SUBMIT (Revokes session in PostgreSQL & clears HttpOnly cookie) ---
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
      });
    } catch {
      // Ignored
    } finally {
      setCurrentUser(null);
      setAuthMode("login");
      showToast("Signed out successfully. Server session revoked.", "info");
    }
  };

  // --- 2. FORGOT PASSWORD SUBMIT ---
  const handleForgotPasswordSubmit = async (values: Record<string, any>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || "User verified in App database! Proceed to set new password.", "success");
        setSharedEmail(values.email);
        setAuthMode("reset"); // Switch to Reset view
      } else {
        showToast(data.error || "Email not found in database", "error");
      }
    } catch {
      showToast("Error processing forgot password", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. RESET PASSWORD SUBMIT ---
  const handleResetPasswordSubmit = async (values: Record<string, any>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          newpassword: values.newpassword,
          confirmPassword: values.confirmPassword,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast("Password updated in App.db successfully! Please sign in with your new credentials.", "success");
        fetchUsers();
        setAuthMode("login"); // Return to login
      } else {
        showToast(data.error || "Failed to reset password", "error");
      }
    } catch {
      showToast("Error updating password in database", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- 4. PROFILE CHANGE PASSWORD SUBMIT (Requested: Inside Profile) ---
  const handleChangePasswordSubmit = async (values: Record<string, any>) => {
    if (!currentUser) return;
    setFormSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          currentPassword: values.currentPassword,
          newpassword: values.newpassword,
          confirmPassword: values.confirmPassword,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast("Password changed successfully in App.db!", "success");
        setIsChangePasswordOpen(false);
        fetchUsers();
      } else {
        showToast(data.error || "Failed to change password", "error");
      }
    } catch {
      showToast("Error updating password", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  // --- 5. USER CRUD HANDLERS ---
  const handleCreateUser = async (values: Record<string, any>) => {
    setFormSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`User ${data.user.name} created in App.db!`, "success");
        setIsAddUserOpen(false);
        fetchUsers();
      } else {
        showToast(data.error || "Failed to create user", "error");
      }
    } catch {
      showToast("Error saving user to database", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateUser = async (values: Record<string, any>) => {
    if (!editingUser) return;
    setFormSubmitting(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`User #${editingUser.id} updated successfully!`, "success");
        setEditingUser(null);
        fetchUsers();
      } else {
        showToast(data.error || "Failed to update user", "error");
      }
    } catch {
      showToast("Error updating user in database", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`User "${deletingUser.name}" deleted from App.db.`, "info");
        setDeletingUser(null);
        fetchUsers();
      } else {
        showToast(data.error || "Failed to delete user", "error");
      }
    } catch {
      showToast("Error deleting user from database", "error");
    }
  };

  const handleResetSeed = async () => {
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast("App.db seeded with initial demo users!", "success");
        fetchUsers();
      }
    } catch {
      showToast("Error resetting demo database", "error");
    }
  };

  // --- FORM FIELD CONFIGURATIONS ---

  const loginFields: FormFieldConfig[] = [
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "name@company.com",
      required: true,
      autoComplete: "email",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "••••••••",
      required: true,
      autoComplete: "current-password",
    },
    {
      name: "rememberMe",
      label: "Remember this session",
      type: "checkbox",
      defaultValue: true,
    },
  ];

  const forgotPasswordFields: FormFieldConfig[] = [
    {
      name: "email",
      label: "Registered Email",
      type: "email",
      placeholder: "e.g. admin@app.com",
      required: true,
      defaultValue: sharedEmail,
    },
  ];

  const resetPasswordFields: FormFieldConfig[] = [
    {
      name: "email",
      label: "Registered Email",
      type: "email",
      placeholder: "e.g. admin@app.com",
      required: true,
      defaultValue: sharedEmail,
    },
    {
      name: "newpassword",
      label: "New Password",
      type: "password",
      placeholder: "Enter new password",
      required: true,
    },
    {
      name: "confirmPassword",
      label: "Confirm New Password",
      type: "password",
      placeholder: "Re-enter new password",
      required: true,
      matchField: "newpassword",
    },
  ];

  // In-Profile Change Password form config (requires current password verification)
  const profileChangePasswordFields: FormFieldConfig[] = [
    {
      name: "currentPassword",
      label: "Current Password",
      type: "password",
      placeholder: "Enter your existing password",
      required: true,
    },
    {
      name: "newpassword",
      label: "New Password",
      type: "password",
      placeholder: "Enter strong new password",
      required: true,
    },
    {
      name: "confirmPassword",
      label: "Confirm New Password",
      type: "password",
      placeholder: "Re-enter new password",
      required: true,
      matchField: "newpassword",
    },
  ];

  // User CRUD modal fields
  const userModalFields: FormFieldConfig[] = [
    {
      name: "name",
      label: "Full Name",
      placeholder: "e.g. Sarah Connor",
      required: true,
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "e.g. sarah@app.com",
      required: true,
    },
    {
      name: "role",
      label: "Role",
      type: "select",
      required: true,
      defaultValue: "USER",
      options: [
        { value: "USER", label: "USER" },
        { value: "ADMIN", label: "ADMIN" },
        { value: "SUPER_ADMIN", label: "SUPER_ADMIN" },
        { value: "MANAGER", label: "MANAGER" },
        { value: "DEVELOPER", label: "DEVELOPER" },
      ],
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "••••••••",
      required: true,
    },
  ];

  if (!currentUser) {
    return (
      <Fade in={!currentUser}>
        <Box
          className="app-shell"
          data-theme={mode}
          sx={{
            width: "100%",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            px: 2,
            py: 4,
            backgroundColor: mode === "dark" ? "#070A13" : "#F8FAFC",
            backgroundImage:
              mode === "dark"
                ? "radial-gradient(ellipse 85% 70% at 50% 25%, #0B172E 0%, #070B14 65%, #03060A 100%)"
                : "radial-gradient(ellipse 85% 70% at 50% 25%, #EFF6FF 0%, #F8FAFC 65%, #E2E8F0 100%)",
          }}
        >
          {/* Floating Theme Toggle on Login Screen */}
                <Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 100 }}>
                  <Tooltip title={mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                    <IconButton
                      onClick={toggleColorMode}
                      size="small"
                      aria-label="Toggle theme mode"
                      sx={{
                        color: mode === "dark" ? "#F59E0B" : "#2563EB",
                        backgroundColor:
                          mode === "dark" ? "rgba(245, 158, 11, 0.12)" : "rgba(37, 99, 235, 0.08)",
                        border:
                          mode === "dark"
                            ? "1px solid rgba(245, 158, 11, 0.28)"
                            : "1px solid rgba(37, 99, 235, 0.25)",
                        borderRadius: "6px",
                        width: 34,
                        height: 34,
                        boxShadow:
                          mode === "dark"
                            ? "0 2px 12px rgba(0, 0, 0, 0.4)"
                            : "0 2px 8px rgba(37, 99, 235, 0.15)",
                        "&:hover": {
                          backgroundColor:
                            mode === "dark" ? "rgba(245, 158, 11, 0.22)" : "rgba(37, 99, 235, 0.16)",
                        },
                      }}
                    >
                      {mode === "dark" ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </Tooltip>
                </Box>

                <Box
                  sx={{
                    maxWidth: 960,
                    width: "100%",
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    borderRadius: "6px",
                    overflow: "hidden",
                    backgroundColor: mode === "dark" ? "#0B1226" : "#FFFFFF",
                    border: mode === "dark" ? "1px solid rgba(59, 130, 246, 0.28)" : "1px solid #E2E8F0",
                    boxShadow:
                      mode === "dark"
                        ? "0 24px 64px rgba(0, 0, 0, 0.8), 0 0 32px rgba(59, 130, 246, 0.12)"
                        : "0 20px 48px rgba(15, 23, 42, 0.08), 0 4px 16px rgba(37, 99, 235, 0.04)",
                  }}
                >
                {/* LEFT SIDE: Information & Brand Showcase */}
                <Box
                  sx={{
                    flex: 1.15,
                    p: { xs: 3, md: 3.5 },
                    background:
                      mode === "dark"
                        ? "linear-gradient(145deg, #070B16 0%, #0E172E 100%)"
                        : "linear-gradient(145deg, #EFF6FF 0%, #DBEAFE 100%)",
                    borderRight: {
                      md: mode === "dark" ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #BFDBFE",
                    },
                    borderBottom: {
                      xs: mode === "dark" ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #BFDBFE",
                      md: "none",
                    },
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <NexvantaLogo size={36} showTagline={true} />
                    <Box sx={{ mt: 2.5 }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 900,
                          fontSize: { xs: "1.3rem", md: "1.55rem" },
                          color: mode === "dark" ? "#F8FAFC" : "#0F172A",
                          letterSpacing: "-0.02em",
                          lineHeight: 1.2,
                          mb: 0.8,
                        }}
                      >
                        Build Beyond Boundaries
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: mode === "dark" ? "#94A3B8" : "#475569",
                          fontSize: "0.82rem",
                          lineHeight: 1.45,
                          mb: 2.5,
                        }}
                      >
                        We design and build modern web applications, scalable enterprise systems, and client-centric digital products.
                      </Typography>

                      {/* Information Pillars from reference image */}
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                          <Box
                            sx={{
                              width: 30,
                              height: 30,
                              borderRadius: "6px",
                              bgcolor: mode === "dark" ? "rgba(59, 130, 246, 0.15)" : "#FFFFFF",
                              border: mode === "dark" ? "none" : "1px solid #BFDBFE",
                              color: "#2563EB",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <RocketLaunchIcon sx={{ fontSize: 16 }} />
                          </Box>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 700,
                                color: mode === "dark" ? "#F8FAFC" : "#0F172A",
                                fontSize: "0.82rem",
                              }}
                            >
                              Modern Solutions
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: mode === "dark" ? "#94A3B8" : "#475569",
                                fontSize: "0.72rem",
                              }}
                            >
                              For Today and Tomorrow
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                          <Box
                            sx={{
                              width: 30,
                              height: 30,
                              borderRadius: "6px",
                              bgcolor: mode === "dark" ? "rgba(6, 182, 212, 0.15)" : "#FFFFFF",
                              border: mode === "dark" ? "none" : "1px solid #BAE6FD",
                              color: mode === "dark" ? "#06B6D4" : "#0891B2",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <PeopleGroupIcon sx={{ fontSize: 16 }} />
                          </Box>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 700,
                                color: mode === "dark" ? "#F8FAFC" : "#0F172A",
                                fontSize: "0.82rem",
                              }}
                            >
                              Client Focused
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: mode === "dark" ? "#94A3B8" : "#475569",
                                fontSize: "0.72rem",
                              }}
                            >
                              Your Goals, Our Commitment
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                          <Box
                            sx={{
                              width: 30,
                              height: 30,
                              borderRadius: "6px",
                              bgcolor: mode === "dark" ? "rgba(139, 92, 246, 0.15)" : "#FFFFFF",
                              border: mode === "dark" ? "none" : "1px solid #DDD6FE",
                              color: mode === "dark" ? "#8B5CF6" : "#7C3AED",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <SettingsSuggestIcon sx={{ fontSize: 16 }} />
                          </Box>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 700,
                                color: mode === "dark" ? "#F8FAFC" : "#0F172A",
                                fontSize: "0.82rem",
                              }}
                            >
                              Scalable Architecture
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: mode === "dark" ? "#94A3B8" : "#475569",
                                fontSize: "0.72rem",
                              }}
                            >
                              Built for Growth
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                          <Box
                            sx={{
                              width: 30,
                              height: 30,
                              borderRadius: "6px",
                              bgcolor: mode === "dark" ? "rgba(16, 185, 129, 0.15)" : "#FFFFFF",
                              border: mode === "dark" ? "none" : "1px solid #A7F3D0",
                              color: "#10B981",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <VerifiedUserIcon sx={{ fontSize: 16 }} />
                          </Box>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 700,
                                color: mode === "dark" ? "#F8FAFC" : "#0F172A",
                                fontSize: "0.82rem",
                              }}
                            >
                              Reliable & Transparent
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: mode === "dark" ? "#94A3B8" : "#475569",
                                fontSize: "0.72rem",
                              }}
                            >
                              A Partner You Can Trust
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ pt: 2, display: "flex", alignItems: "center", gap: 0.8 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#10B981" }} />
                    <Typography
                      variant="caption"
                      sx={{ color: mode === "dark" ? "#64748B" : "#475569", fontSize: "0.7rem" }}
                    >
                      Nexvanta Technologies Portal • Secure Client Access
                    </Typography>
                  </Box>
                </Box>

                {/* RIGHT SIDE: Login / Forgot Password / Reset Password Form */}
                <Box
                  sx={{
                    flex: 1,
                    p: { xs: 2.5, md: 3.5 },
                    backgroundColor: mode === "dark" ? "#0E172E" : "#FFFFFF",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  {authMode === "login" && (
                    <ConfigurableForm
                      asCard={false}
                      forceDark={mode === "dark"}
                      title="Sign In"
                      subtitle="Enter your work email and password to continue"
                      icon={
                        <LoginIcon
                          sx={{ color: mode === "dark" ? "#38BDF8" : "#2563EB", fontSize: 22 }}
                        />
                      }
                      fields={loginFields}
                      submitLabel="Sign In"
                      submitIcon={<LoginIcon fontSize="small" />}
                      loading={loading}
                      onSubmit={handleLoginSubmit}
                      links={[
                        {
                          label: "Forgot Password?",
                          icon: <LockResetIcon fontSize="small" />,
                          onClick: () => setAuthMode("forgot"),
                        },
                        {
                          label: "Reset Password",
                          icon: <VpnKeyIcon fontSize="small" />,
                          onClick: () => setAuthMode("reset"),
                        },
                      ]}
                    />
                  )}

                  {authMode === "forgot" && (
                    <ConfigurableForm
                      asCard={false}
                      forceDark={mode === "dark"}
                      title="Forgot Password"
                      subtitle="Enter your registered email to receive password reset instructions"
                      icon={
                        <LockResetIcon
                          sx={{ color: mode === "dark" ? "#22D3EE" : "#0891B2", fontSize: 22 }}
                        />
                      }
                      fields={forgotPasswordFields}
                      submitLabel="Send Reset Link"
                      submitIcon={<LockResetIcon fontSize="small" />}
                      loading={loading}
                      initialValues={{ email: sharedEmail }}
                      onSubmit={handleForgotPasswordSubmit}
                      links={[
                        {
                          label: "← Back to Sign In",
                          onClick: () => setAuthMode("login"),
                        },
                        {
                          label: "Direct Reset Password →",
                          onClick: () => setAuthMode("reset"),
                        },
                      ]}
                    />
                  )}

                  {authMode === "reset" && (
                    <ConfigurableForm
                      asCard={false}
                      forceDark={mode === "dark"}
                      title="Reset Password"
                      subtitle="Set your new password to regain account access"
                      icon={
                        <VpnKeyIcon
                          sx={{ color: mode === "dark" ? "#A78BFA" : "#7C3AED", fontSize: 22 }}
                        />
                      }
                      fields={resetPasswordFields}
                      submitLabel="Update Password"
                      submitIcon={<VpnKeyIcon fontSize="small" />}
                      loading={loading}
                      initialValues={{ email: sharedEmail }}
                      onSubmit={handleResetPasswordSubmit}
                      links={[
                        {
                          label: "← Back to Sign In",
                          onClick: () => setAuthMode("login"),
                        },
                      ]}
                    />
                  )}
                </Box>
              </Box>
              {/* Login Toast Notification */}
            <Snackbar
              open={snackbar.open}
              autoHideDuration={4000}
              onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
              <Alert
                severity={snackbar.severity}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                sx={{
                  borderRadius: "6px",
                  fontWeight: 600,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {snackbar.message}
              </Alert>
            </Snackbar>
          </Box>
        </Fade>
      );
    }

    /* ======================================================== */
    /* FLOW B: LOGGED IN -> UNIFIED APP LAYOUT & OUTLET         */
    /* ======================================================== */
    return (
      <AppLayout
        currentUser={currentUser}
        currentTab={landingTab}
        onTabChange={(tab) => setLandingTab(tab)}
        onLogout={handleLogout}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      >
        <Fade in={Boolean(currentUser)}>
          <Box sx={{ width: "100%" }}>
                {/* Standardized compact session info bar */}
                <Box className="app-session-bar" sx={{ mb: 0.5, px: 0.2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.82rem" }}>
                      Authenticated as <Box component="strong" sx={{ color: "text.primary" }}>{currentUser.email}</Box>
                    </Typography>
                    <Chip
                      label={currentUser.role}
                      size="small"
                      sx={{
                        height: 20,
                        backgroundColor: mode === "dark" ? "rgba(6, 182, 212, 0.15)" : "#EFF6FF",
                        color: mode === "dark" ? "#22D3EE" : "#0891B2",
                        fontWeight: 700,
                        fontSize: "0.68rem",
                        borderRadius: "6px",
                        border: mode === "dark" ? "1px solid rgba(6, 182, 212, 0.3)" : "1px solid #BAE6FD",
                      }}
                    />
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<VpnKeyIcon sx={{ fontSize: "14px !important" }} />}
                      onClick={() => setIsChangePasswordOpen(true)}
                      sx={{
                        height: 26,
                        fontSize: "0.75rem",
                        borderRadius: "6px",
                        color: mode === "dark" ? "#C4B5FD" : "#7C3AED",
                        backgroundColor: mode === "dark" ? "transparent" : "rgba(124, 58, 237, 0.06)",
                        "&:hover": {
                          backgroundColor: mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(124, 58, 237, 0.12)",
                        },
                      }}
                    >
                      Change Password
                    </Button>
                    <Button
                      size="small"
                      startIcon={<PersonIcon sx={{ fontSize: "14px !important" }} />}
                      onClick={() => setIsProfileOpen(true)}
                      sx={{
                        height: 26,
                        fontSize: "0.75rem",
                        borderRadius: "6px",
                        color: mode === "dark" ? "#60A5FA" : "#2563EB",
                        backgroundColor: mode === "dark" ? "transparent" : "rgba(37, 99, 235, 0.06)",
                        "&:hover": {
                          backgroundColor: mode === "dark" ? "rgba(59, 130, 246, 0.1)" : "rgba(37, 99, 235, 0.12)",
                        },
                      }}
                    >
                      My Profile
                    </Button>
                  </Box>
                </Box>

                {/* TAB 0: COMPANY OVERVIEW & INFORMATION HOMEPAGE */}
                {landingTab === 0 && (
                  <CompanyDashboardView
                    onNavigateTab={(tab) => setLandingTab(tab)}
                  />
                )}

                {/* TAB 1: USER MANAGEMENT (CRUD Table + Stats) */}
                {landingTab === 1 && (
                  <ConfigurableTable
                    users={users}
                    loading={loading}
                    onRefresh={fetchUsers}
                    onAddUser={() => setIsAddUserOpen(true)}
                    onEditUser={(user) => setEditingUser(user)}
                    onDeleteUser={(user) => setDeletingUser(user)}
                    onResetSeed={handleResetSeed}
                  />
                )}

                {/* TAB 2: ROLES ARCHITECTURE */}
                {landingTab === 2 && (
                  <RolesView onShowToast={showToast} />
                )}

                {/* TAB 3: PERMISSIONS ARCHITECTURE (Separate Page) */}
                {landingTab === 3 && (
                  <PermissionsView onShowToast={showToast} />
                )}

                {/* TAB 4: CUSTOMER SERVICES */}
                {landingTab === 4 && (
                  <Box className="app-card">
                    <Box className="app-card-ribbon" />
                    <Box className="app-card-body" sx={{ textAlign: "center" }}>
                      <ServicesIcon
                        sx={{
                          fontSize: 40,
                          color: (theme) =>
                            theme.palette.mode === "dark" ? "#38BDF8" : "#2563EB",
                          mb: 1,
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 800, color: "text.primary", mb: 0.8 }}
                      >
                        Customer Services Hub
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", maxWidth: 640, mx: "auto", mb: 2 }}
                      >
                        This extensible customer hub connects your enterprise services, API integrations, and client management workflows seamlessly.
                      </Typography>
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Box
                            sx={{
                              p: 1.8,
                              borderRadius: "6px",
                              backgroundColor: (theme) =>
                                theme.palette.mode === "dark"
                                  ? "rgba(10, 15, 28, 0.6)"
                                  : "#EFF6FF",
                              border: (theme) =>
                                theme.palette.mode === "dark"
                                  ? "1px solid rgba(59,130,246,0.15)"
                                  : "1px solid #DBEAFE",
                              textAlign: "left",
                            }}
                          >
                            <CheckCircleIcon sx={{ color: "#10B981", mb: 0.5, fontSize: 20 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                              Database: App (PostgreSQL)
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              Direct connection to PostgreSQL App database via Prisma ORM client.
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Box
                            sx={{
                              p: 1.8,
                              borderRadius: "6px",
                              backgroundColor: (theme) =>
                                theme.palette.mode === "dark"
                                  ? "rgba(10, 15, 28, 0.6)"
                                  : "#EFF6FF",
                              border: (theme) =>
                                theme.palette.mode === "dark"
                                  ? "1px solid rgba(6,182,212,0.15)"
                                  : "1px solid #DBEAFE",
                              textAlign: "left",
                            }}
                          >
                            <SecurityIcon
                              sx={{
                                color: (theme) =>
                                  theme.palette.mode === "dark" ? "#06B6D4" : "#0891B2",
                                mb: 0.5,
                                fontSize: 20,
                              }}
                            />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                              Roles & Permissions
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              Normalized roles, permissions, and role_permissions relational architecture.
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Box
                            sx={{
                              p: 1.8,
                              borderRadius: "6px",
                              backgroundColor: (theme) =>
                                theme.palette.mode === "dark"
                                  ? "rgba(10, 15, 28, 0.6)"
                                  : "#EFF6FF",
                              border: (theme) =>
                                theme.palette.mode === "dark"
                                  ? "1px solid rgba(139,92,246,0.15)"
                                  : "1px solid #DBEAFE",
                              textAlign: "left",
                            }}
                          >
                            <VpnKeyIcon
                              sx={{
                                color: (theme) =>
                                  theme.palette.mode === "dark" ? "#8B5CF6" : "#7C3AED",
                                mb: 0.5,
                                fontSize: 20,
                              }}
                            />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                              Bcrypt Password Security
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              Secure password_hash hashing and newpassword synchronization.
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                )}

                {/* TAB 5: ANALYTICS & ACTIVITY */}
                {landingTab === 5 && (
                  <Box className="app-card">
                    <Box className="app-card-ribbon" />
                    <Box className="app-card-body" sx={{ textAlign: "center" }}>
                      <AnalyticsIcon
                        sx={{
                          fontSize: 40,
                          color: (theme) =>
                            theme.palette.mode === "dark" ? "#8B5CF6" : "#7C3AED",
                          mb: 1,
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 800, color: "text.primary", mb: 0.8 }}
                      >
                        Customer Analytics & Activity Logs
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", maxWidth: 640, mx: "auto", mb: 2 }}
                      >
                        Monitor active user sign-ins, password updates, and customer CRUD operations across the Nexvanta portal.
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => setLandingTab(1)}
                        sx={{ borderRadius: "6px", px: 2 }}
                      >
                        View User Records Table
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </Fade>

        {/* ======================================================== */}
        {/* MODAL: PROFILE DETAILS                                   */}
        {/* ======================================================== */}
        <Dialog
          open={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          maxWidth="xs"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "#0E162B" : "#FFFFFF",
                border: (theme) =>
                  theme.palette.mode === "dark"
                    ? "1px solid rgba(59, 130, 246, 0.25)"
                    : "1px solid #E2E8F0",
                borderRadius: "6px", // 6px fixed
                p: 2,
              },
            },
          }}
        >
          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
            <PersonIcon
              sx={{
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#38BDF8" : "#2563EB",
              }}
            />
            <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
              User Profile
            </Box>
          </DialogTitle>
          <DialogContent>
            {currentUser && (
              <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ textAlign: "center", py: 1 }}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: "primary.main",
                      fontSize: "1.3rem",
                      fontWeight: 700,
                      borderRadius: "6px", // 6px fixed
                      mx: "auto",
                      mb: 1.2,
                    }}
                  >
                    {currentUser.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.95rem" }}>
                    {currentUser.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                    {currentUser.email}
                  </Typography>
                  <Chip
                    label={`Role: ${currentUser.role}`}
                    color="primary"
                    size="small"
                    sx={{ mt: 1, fontWeight: 700, borderRadius: "6px" }}
                  />
                </Box>
                <Divider sx={{ borderColor: (theme) => theme.palette.divider }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>Account ID:</Typography>
                  <Typography variant="caption" sx={{ color: "text.primary", fontWeight: 700 }}>#{currentUser.id}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>Access Level:</Typography>
                  <Typography variant="caption" sx={{ color: "secondary.main", fontWeight: 700 }}>Verified User</Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 2.5, pb: 2, display: "flex", justifyContent: "space-between" }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<VpnKeyIcon />}
              onClick={() => {
                setIsProfileOpen(false);
                setIsChangePasswordOpen(true);
              }}
              sx={{
                borderColor: (theme) =>
                  theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.4)" : "#DDD6FE",
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#C4B5FD" : "#7C3AED",
                borderRadius: "6px",
              }}
            >
              Change Password
            </Button>
            <Button
              onClick={() => setIsProfileOpen(false)}
              sx={{ color: "text.secondary", borderRadius: "6px" }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* ======================================================== */}
        {/* MODAL: CHANGE PASSWORD (In Profile, User Request)         */}
        {/* ======================================================== */}
        <Dialog
          open={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "#0E162B" : "#FFFFFF",
                border: (theme) =>
                  theme.palette.mode === "dark"
                    ? "1px solid rgba(139, 92, 246, 0.3)"
                    : "1px solid #E2E8F0",
                borderRadius: "6px", // 6px fixed
                p: 2,
              },
            },
          }}
        >
          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
            <VpnKeyIcon
              sx={{
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#A78BFA" : "#7C3AED",
              }}
            />
            <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
              Change Password ({currentUser?.email})
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <ConfigurableForm
                asCard={false}
                forceDark={mode === "dark"}
                fields={profileChangePasswordFields}
                submitLabel="Update Password"
                loading={formSubmitting}
                onSubmit={handleChangePasswordSubmit}
                secondaryButton={{
                  label: "Cancel",
                  onClick: () => setIsChangePasswordOpen(false),
                }}
              />
            </Box>
          </DialogContent>
        </Dialog>

        {/* ======================================================== */}
        {/* MODAL: ADD USER DIALOG                                   */}
        {/* ======================================================== */}
        <Dialog
          open={isAddUserOpen}
          onClose={() => setIsAddUserOpen(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "#0E162B" : "#FFFFFF",
                border: (theme) =>
                  theme.palette.mode === "dark"
                    ? "1px solid rgba(59, 130, 246, 0.25)"
                    : "1px solid #E2E8F0",
                borderRadius: "6px", // 6px fixed
                p: 2,
              },
            },
          }}
        >
          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
            <PersonAddIcon
              sx={{
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#38BDF8" : "#2563EB",
              }}
            />
            <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
              Add New User
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <ConfigurableForm
                asCard={false}
                forceDark={mode === "dark"}
                fields={userModalFields}
                submitLabel="Create User"
                loading={formSubmitting}
                onSubmit={handleCreateUser}
                secondaryButton={{
                  label: "Cancel",
                  onClick: () => setIsAddUserOpen(false),
                }}
              />
            </Box>
          </DialogContent>
        </Dialog>

        {/* ======================================================== */}
        {/* MODAL: EDIT USER DIALOG                                  */}
        {/* ======================================================== */}
        <Dialog
          open={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "#0E162B" : "#FFFFFF",
                border: (theme) =>
                  theme.palette.mode === "dark"
                    ? "1px solid rgba(6, 182, 212, 0.25)"
                    : "1px solid #E2E8F0",
                borderRadius: "6px", // 6px fixed
                p: 2,
              },
            },
          }}
        >
          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
            <EditIcon
              sx={{
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#22D3EE" : "#0891B2",
              }}
            />
            <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
              Edit User #{editingUser?.id}
            </Box>
          </DialogTitle>
          <DialogContent>
            {editingUser && (
              <Box sx={{ pt: 1 }}>
                <ConfigurableForm
                  asCard={false}
                  forceDark={mode === "dark"}
                  fields={userModalFields}
                  submitLabel="Save Changes"
                  loading={formSubmitting}
                  initialValues={{
                    name: editingUser.name,
                    email: editingUser.email,
                    role: editingUser.role,
                    password: editingUser.password,
                  }}
                  onSubmit={handleUpdateUser}
                  secondaryButton={{
                    label: "Cancel",
                    onClick: () => setEditingUser(null),
                  }}
                />
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* ======================================================== */}
        {/* MODAL: DELETE CONFIRMATION DIALOG                        */}
        {/* ======================================================== */}
        <Dialog
          open={Boolean(deletingUser)}
          onClose={() => setDeletingUser(null)}
          maxWidth="xs"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "#0E162B" : "#FFFFFF",
                border: (theme) =>
                  theme.palette.mode === "dark"
                    ? "1px solid rgba(239, 68, 68, 0.3)"
                    : "1px solid #FCA5A5",
                borderRadius: "6px", // 6px fixed
                p: 2,
              },
            },
          }}
        >
          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "error.main" }}>
            <WarningIcon />
            <Box component="span" sx={{ fontWeight: 700 }}>Confirm Deletion</Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ color: "text.primary", fontSize: "0.9rem" }}>
              Are you sure you want to permanently delete user{" "}
              <strong>{deletingUser?.name}</strong> ({deletingUser?.email})?
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, pb: 2 }}>
            <Button onClick={() => setDeletingUser(null)} sx={{ color: "text.secondary", borderRadius: "6px" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteUser}
              sx={{ fontWeight: 700, borderRadius: "6px" }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          >
            <Alert
              severity={snackbar.severity}
              onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
              sx={{
                borderRadius: "6px", // 6px fixed
                fontWeight: 600,
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </AppLayout>
      );
    }
