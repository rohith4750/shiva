"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Divider,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export interface FormFieldConfig {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "select" | "checkbox";
  placeholder?: string;
  required?: boolean;
  options?: { value: string | number; label: string }[];
  defaultValue?: string | number | boolean;
  startIcon?: React.ReactNode;
  helperText?: string;
  autoComplete?: string;
  matchField?: string; // used for confirmPassword checking
}

export interface QuickFillOption {
  label: string;
  values: Record<string, any>;
  color?: "primary" | "secondary" | "info";
}

export interface FormActionLink {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  align?: "left" | "right" | "center";
}

export interface ConfigurableFormProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accentGradient?: string;
  fields: FormFieldConfig[];
  submitLabel: string;
  submitIcon?: React.ReactNode;
  loading?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  quickFillOptions?: QuickFillOption[];
  links?: FormActionLink[];
  secondaryButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  cardWidth?: number | string;
  initialValues?: Record<string, any>;
  asCard?: boolean;
}

export default function ConfigurableForm({
  title,
  subtitle,
  icon,
  accentGradient = "linear-gradient(90deg, #06B6D4, #3B82F6, #8B5CF6)",
  fields,
  submitLabel,
  submitIcon,
  loading = false,
  errorMessage = null,
  successMessage = null,
  onSubmit,
  quickFillOptions,
  links,
  secondaryButton,
  cardWidth = 480,
  initialValues = {},
  asCard = true,
}: ConfigurableFormProps) {
  // Initialize values
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = {};
    fields.forEach((field) => {
      defaults[field.name] =
        initialValues[field.name] !== undefined
          ? initialValues[field.name]
          : field.defaultValue !== undefined
          ? field.defaultValue
          : field.type === "checkbox"
          ? false
          : "";
    });
    return defaults;
  });

  // Track show/hide for password fields individually
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [localError, setLocalError] = useState<string | null>(null);

  // Re-sync with initialValues when provided
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData((prev) => ({ ...prev, ...initialValues }));
    }
  }, [initialValues]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError(null);
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const handleQuickFill = (values: Record<string, any>) => {
    setFormData((prev) => ({ ...prev, ...values }));
    setLocalError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validate required fields
    for (const field of fields) {
      if (field.required && !formData[field.name] && formData[field.name] !== 0) {
        setLocalError(`${field.label} is required`);
        return;
      }
      if (field.type === "email" && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          setLocalError("Please enter a valid email address");
          return;
        }
      }
      if (field.matchField && formData[field.name] !== formData[field.matchField]) {
        setLocalError(`${field.label} does not match`);
        return;
      }
    }

    onSubmit(formData);
  };

  const formBody = (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: "100%" }}>
      {/* Title & Icon Header */}
      {title && (
        <Box sx={{ textAlign: "center", mb: 3 }}>
          {icon && (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "6px",
                background: "linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.2,
                boxShadow: "0 4px 16px rgba(59, 130, 246, 0.2)",
              }}
            >
              {icon}
            </Box>
          )}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontSize: "1.25rem",
              letterSpacing: "-0.01em",
              color: "#F8FAFC",
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ color: "#94A3B8", mt: 0.4, fontSize: "0.82rem" }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      )}

      {/* Errors & Success Messages */}
      {(localError || errorMessage) && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "6px", py: 0.5, fontSize: "0.82rem" }} onClose={() => setLocalError(null)}>
          {localError || errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: "6px", py: 0.5, fontSize: "0.82rem" }}>
          {successMessage}
        </Alert>
      )}

      {/* Form Fields - Decreased Spacing */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {fields.map((field) => {
          if (field.type === "select") {
            return (
              <FormControl key={field.name} fullWidth size="small" margin="dense">
                <InputLabel id={`label-${field.name}`}>{field.label}</InputLabel>
                <Select
                  labelId={`label-${field.name}`}
                  value={formData[field.name] || ""}
                  label={field.label}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  sx={{ borderRadius: "6px" }}
                >
                  {field.options?.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value} sx={{ borderRadius: "6px", fontSize: "0.85rem" }}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          }

          if (field.type === "checkbox") {
            return (
              <FormControlLabel
                key={field.name}
                control={
                  <Checkbox
                    checked={Boolean(formData[field.name])}
                    onChange={(e) => handleChange(field.name, e.target.checked)}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: "#CBD5E1", fontSize: "0.82rem" }}>
                    {field.label}
                  </Typography>
                }
              />
            );
          }

          const isPassword = field.type === "password";
          const showPass = showPasswordMap[field.name];

          return (
            <TextField
              key={field.name}
              label={field.label}
              fullWidth
              size="small"
              type={isPassword ? (showPass ? "text" : "password") : field.type || "text"}
              value={formData[field.name] !== undefined ? formData[field.name] : ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              helperText={field.helperText}
              autoComplete={field.autoComplete}
              slotProps={{
                input: {
                  sx: { borderRadius: "6px", fontSize: "0.88rem" },
                  startAdornment: field.startIcon ? (
                    <InputAdornment position="start">
                      <Box sx={{ color: "#94A3B8", display: "flex", alignItems: "center" }}>
                        {field.startIcon}
                      </Box>
                    </InputAdornment>
                  ) : undefined,
                  endAdornment: isPassword ? (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility(field.name)}
                        edge="end"
                        size="small"
                        sx={{ color: "#94A3B8" }}
                      >
                        {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                },
              }}
            />
          );
        })}
      </Box>

      {/* Submit Button */}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={loading}
        startIcon={!loading ? submitIcon : undefined}
        sx={{
          mt: 2.2,
          py: 1,
          borderRadius: "6px",
          fontSize: "0.9rem",
          fontWeight: 700,
          background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
          boxShadow: "0 2px 12px rgba(59, 130, 246, 0.35)",
          "&:hover": {
            background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)",
          },
        }}
      >
        {loading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : submitLabel}
      </Button>

      {/* Secondary Button */}
      {secondaryButton && (
        <Button
          fullWidth
          variant="outlined"
          size="small"
          onClick={secondaryButton.onClick}
          startIcon={secondaryButton.icon}
          sx={{
            mt: 1.2,
            borderRadius: "6px",
            borderColor: "rgba(59, 130, 246, 0.3)",
            color: "#94A3B8",
            fontSize: "0.82rem",
            "&:hover": {
              borderColor: "#3B82F6",
              color: "#F8FAFC",
            },
          }}
        >
          {secondaryButton.label}
        </Button>
      )}

      {/* Action Links */}
      {links && links.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 2,
            pt: 1.5,
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          {links.map((link, idx) => (
            <Button
              key={idx}
              size="small"
              startIcon={link.icon}
              onClick={link.onClick}
              sx={{
                color: "#94A3B8",
                fontSize: "0.78rem",
                borderRadius: "6px",
                p: "4px 8px",
                "&:hover": { color: "#38BDF8" },
              }}
            >
              {link.label}
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );

  if (!asCard) {
    return formBody;
  }

  return (
    <Box sx={{ maxWidth: cardWidth, width: "100%", mx: "auto", my: { xs: 1.5, md: 2 } }}>
      <Card
        elevation={8}
        sx={{
          borderRadius: "6px", // 6px fixed
          backgroundColor: "#111A2E",
          border: "1px solid rgba(59, 130, 246, 0.22)",
          boxShadow: "0 16px 36px rgba(0, 0, 0, 0.55), 0 0 20px rgba(59, 130, 246, 0.08)",
          overflow: "hidden",
        }}
      >
        {/* Top Gradient Ribbon Accent */}
        <Box
          sx={{
            height: 3,
            width: "100%",
            background: accentGradient,
          }}
        />
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>{formBody}</CardContent>
      </Card>
    </Box>
  );
}
