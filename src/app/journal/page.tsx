"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  CircularProgress,
  Snackbar,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  Rating,
  Switch,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  AddCircle as AddTradeIcon,
  History as HistoryIcon,
  CalendarMonth as CalendarIcon,
  QueryStats as AnalyticsIcon,
  Psychology as PsychologyIcon,
  AccountBalanceWallet as AccountsIcon,
  Download as ExportIcon,
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
  EmojiEmotions as EmotionIcon,
  Search as SearchIcon,
  MenuBook as BookIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { useColorMode } from "@/components/ThemeRegistry";
import { TradeRecord, AnalyticsSummary } from "@/lib/tradingAnalytics";

export default function TradingJournalPage() {
  const { mode } = useColorMode();
  const isDark = mode === "dark";

  // Navigation State: 0 = Overview, 1 = Add Trade, 2 = History, 3 = Calendar, 4 = Analytics, 5 = Journal, 6 = Accounts
  const [activeTab, setActiveTab] = useState<number>(0);

  // Selected Account Filter
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");

  // Server Data
  const [loading, setLoading] = useState<boolean>(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  // Detail Modal
  const [selectedTrade, setSelectedTrade] = useState<TradeRecord | null>(null);

  // Toast
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (message: string, severity: "success" | "error" | "info" = "success") => {
    setToast({ open: true, message, severity });
  };

  // --- Fetch Overview Data ---
  const fetchJournalData = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/journal/overview?accountId=${selectedAccountId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts || []);
        setStrategies(data.strategies || []);
        setTags(data.tags || []);
        setTrades(data.trades || []);
        setReviews(data.reviews || []);
        setAnalytics(data.analytics || null);
      } else {
        showToast(data.error || "Failed to load trading journal data", "error");
      }
    } catch {
      showToast("Error connecting to trade database", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchJournalData();
    const nowIso = new Date().toISOString().slice(0, 16);
    setTradeForm((prev) => ({
      ...prev,
      openedAt: prev.openedAt || nowIso,
      closedAt: prev.closedAt || nowIso,
    }));
  }, [fetchJournalData]);

  // --- ADD TRADE FORM STATE (Three-Stage Workflow) ---
  const [tradeForm, setTradeForm] = useState({
    accountId: "",
    symbol: "EURUSD",
    direction: "BUY",
    status: "CLOSED",
    openedAt: "",
    closedAt: "",
    entryPrice: "",
    exitPrice: "",
    volume: "1.00",
    pnlMode: "net", // "net" | "calculate"
    netPnl: "",
    stopLoss: "",
    takeProfit: "",
    plannedRiskAmount: "250",
    plannedRewardAmount: "750",
    commission: "7.00",
    swap: "0.00",
    fees: "0.00",
    strategyId: "",
    notes: "",
    // Step C: Journal
    entryReason: "",
    exitReason: "",
    emotionBefore: "Calm",
    emotionAfter: "Satisfied",
    disciplineRating: 5,
    ruleAdherence: true,
    mistakes: "None",
    lessonsLearned: "",
  });

  const [submittingTrade, setSubmittingTrade] = useState(false);

  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeForm.accountId) {
      showToast("Please select a trading account", "error");
      return;
    }
    if (!tradeForm.symbol || !tradeForm.entryPrice) {
      showToast("Symbol and Entry Price are required", "error");
      return;
    }

    setSubmittingTrade(true);
    try {
      let finalNetPnl: number | null = null;
      if (tradeForm.status === "CLOSED") {
        if (tradeForm.pnlMode === "net") {
          finalNetPnl = tradeForm.netPnl !== "" ? Number(tradeForm.netPnl) : 0;
        } else {
          // Approximate calculation from prices if user chose calculate mode
          const diff = Number(tradeForm.exitPrice || tradeForm.entryPrice) - Number(tradeForm.entryPrice);
          const mult = tradeForm.direction === "BUY" ? 1 : -1;
          const gross = diff * mult * Number(tradeForm.volume || 1) * 100000; // EURUSD standard lot
          finalNetPnl = gross - Number(tradeForm.commission || 0) - Number(tradeForm.fees || 0);
        }
      }

      const payload = {
        ...tradeForm,
        netPnl: finalNetPnl,
        entryPrice: Number(tradeForm.entryPrice),
        exitPrice: tradeForm.exitPrice ? Number(tradeForm.exitPrice) : null,
      };

      const res = await fetch("/api/journal/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Trade recorded in PostgreSQL 'trade' database!", "success");
        fetchJournalData();
        setActiveTab(2); // Navigate to Trade History
      } else {
        showToast(data.error || "Failed to record trade", "error");
      }
    } catch {
      showToast("Server error recording trade", "error");
    } finally {
      setSubmittingTrade(false);
    }
  };

  // --- Trade History Filters ---
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState("ALL");
  const [historyDirection, setHistoryDirection] = useState("ALL");

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      const q = historySearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.symbol.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        (t.strategy_name && t.strategy_name.toLowerCase().includes(q));

      const matchesStatus = historyStatus === "ALL" || t.status === historyStatus;
      const matchesDir = historyDirection === "ALL" || t.direction === historyDirection;

      return matchesSearch && matchesStatus && matchesDir;
    });
  }, [trades, historySearch, historyStatus, historyDirection]);

  // CSV Export handler
  const handleExportCSV = () => {
    if (trades.length === 0) {
      showToast("No trade records to export", "info");
      return;
    }

    const headers = [
      "ID",
      "Account",
      "Symbol",
      "Direction",
      "Status",
      "Opened At",
      "Closed At",
      "Entry Price",
      "Exit Price",
      "Volume",
      "Planned Risk",
      "Actual R",
      "Net PnL",
      "Commission",
      "Strategy",
      "Notes",
    ];

    const rows = trades.map((t) => [
      t.id,
      t.account_id,
      t.symbol,
      t.direction,
      t.status,
      t.opened_at,
      t.closed_at || "",
      t.entry_price,
      t.exit_price ?? "",
      t.volume ?? "",
      t.planned_risk_amount ?? "",
      t.actual_r ?? "",
      t.net_pnl ?? "",
      t.commission,
      t.strategy_name ?? "",
      `"${(t.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trading_journal_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Trade records exported to CSV successfully!", "success");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: isDark ? "#070A13" : "#F8FAFC",
        color: isDark ? "#F8FAFC" : "#0F172A",
        pb: 8,
      }}
    >
      {/* ============================================================== */}
      {/* TOP HEADER: Breadcrumb, Account Filter, Live Status, Add Trade */}
      {/* ============================================================== */}
      <Box
        sx={{
          py: 2,
          px: { xs: 2, md: 4 },
          bgcolor: isDark ? "#0B1226" : "#FFFFFF",
          borderBottom: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Button
              size="small"
              startIcon={<ArrowBackIcon />}
              sx={{
                color: isDark ? "#94A3B8" : "#64748B",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.82rem",
              }}
            >
              Auth & User Portal
            </Button>
          </Link>
          <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.01em" }}>
                Manual Trading Journal
              </Typography>
              <Chip
                label="PostgreSQL: trade"
                size="small"
                sx={{
                  bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5",
                  color: isDark ? "#34D399" : "#059669",
                  border: isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #A7F3D0",
                  fontWeight: 700,
                  fontSize: "0.68rem",
                  height: 20,
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B" }}>
              Independent multi-user trading platform. Zero MT5 or broker dependency.
            </Typography>
          </Box>
        </Box>

        {/* Account Selector, Refresh & Primary Add Trade Action */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel sx={{ fontSize: "0.82rem" }}>Active Account</InputLabel>
            <Select
              value={selectedAccountId}
              label="Active Account"
              onChange={(e) => setSelectedAccountId(e.target.value)}
              sx={{ fontSize: "0.82rem", height: 36, bgcolor: isDark ? "#0E162B" : "#FFFFFF" }}
            >
              <MenuItem value="all">All Accounts ({accounts.length})</MenuItem>
              {accounts.map((acc) => (
                <MenuItem key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tooltip title="Refresh Data">
            <IconButton
              size="small"
              onClick={fetchJournalData}
              disabled={loading}
              sx={{
                border: isDark ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid #CBD5E1",
                borderRadius: "6px",
                width: 36,
                height: 36,
              }}
            >
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            size="small"
            startIcon={<AddTradeIcon />}
            onClick={() => {
              if (accounts.length > 0 && !tradeForm.accountId) {
                setTradeForm((prev) => ({ ...prev, accountId: accounts[0].id }));
              }
              setActiveTab(1);
            }}
            sx={{
              bgcolor: "#2563EB",
              fontWeight: 700,
              fontSize: "0.82rem",
              borderRadius: "6px",
              height: 36,
              px: 2,
              "&:hover": { bgcolor: "#1D4ED8" },
            }}
          >
            Add Trade
          </Button>
        </Box>
      </Box>

      {/* ============================================================== */}
      {/* NAVIGATION TABS                                                */}
      {/* ============================================================== */}
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          bgcolor: isDark ? "#0A0F1D" : "#F1F5F9",
          borderBottom: isDark ? "1px solid rgba(59, 130, 246, 0.15)" : "1px solid #E2E8F0",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 46,
            "& .MuiTab-root": {
              minHeight: 46,
              fontSize: "0.82rem",
              fontWeight: 700,
              textTransform: "none",
              color: isDark ? "#94A3B8" : "#64748B",
              "&.Mui-selected": {
                color: isDark ? "#38BDF8" : "#2563EB",
              },
            },
            "& .MuiTabs-indicator": {
              bgcolor: isDark ? "#38BDF8" : "#2563EB",
              height: 3,
            },
          }}
        >
          <Tab icon={<DashboardIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Overview" />
          <Tab icon={<AddTradeIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Add Trade Workflow" />
          <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Trade History (${trades.length})`} />
          <Tab icon={<CalendarIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Trading Calendar" />
          <Tab icon={<AnalyticsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Analytics & Algorithms" />
          <Tab icon={<PsychologyIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Journal & Psychology" />
          <Tab icon={<AccountsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Accounts (${accounts.length})`} />
        </Tabs>
      </Box>

      {/* ============================================================== */}
      {/* MAIN VIEW CONTAINER                                            */}
      {/* ============================================================== */}
      <Container maxWidth="xl" sx={{ mt: 3, px: { xs: 2, md: 4 } }}>
        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        {/* ============================================================ */}
        {/* TAB 0: OVERVIEW (DASHBOARD)                                  */}
        {/* ============================================================ */}
        {activeTab === 0 && analytics && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Top 6 KPI Performance Cards */}
            <Grid container spacing={2}>
              {/* Card 1: Net Realized P&L */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card sx={{ p: 2, borderRadius: "6px", bgcolor: isDark ? "#0E162B" : "#FFFFFF", border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                    Net Realized P&L
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      mt: 0.5,
                      color: analytics.netPnl >= 0 ? "#10B981" : "#EF4444",
                    }}
                  >
                    {analytics.netPnl >= 0 ? `+$${analytics.netPnl.toLocaleString()}` : `-$${Math.abs(analytics.netPnl).toLocaleString()}`}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? "#64748B" : "#94A3B8", display: "block", mt: 0.5 }}>
                    Closed Trades Only
                  </Typography>
                </Card>
              </Grid>

              {/* Card 2: Win Rate */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card sx={{ p: 2, borderRadius: "6px", bgcolor: isDark ? "#0E162B" : "#FFFFFF", border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                    Win Rate
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: isDark ? "#F8FAFC" : "#0F172A" }}>
                    {analytics.winRate !== null ? `${analytics.winRate}%` : "N/A"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? "#64748B" : "#94A3B8", display: "block", mt: 0.5 }}>
                    {analytics.winningTrades}W / {analytics.losingTrades}L ({analytics.breakEvenTrades} BE)
                  </Typography>
                </Card>
              </Grid>

              {/* Card 3: Profit Factor */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card sx={{ p: 2, borderRadius: "6px", bgcolor: isDark ? "#0E162B" : "#FFFFFF", border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                    Profit Factor
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: "#3B82F6" }}>
                    {analytics.profitFactor !== null ? analytics.profitFactor : (analytics.grossProfit > 0 ? "∞" : "N/A")}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? "#64748B" : "#94A3B8", display: "block", mt: 0.5 }}>
                    ${analytics.grossProfit} / ${analytics.grossLoss}
                  </Typography>
                </Card>
              </Grid>

              {/* Card 4: Total Closed Trades */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card sx={{ p: 2, borderRadius: "6px", bgcolor: isDark ? "#0E162B" : "#FFFFFF", border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                    Closed Trades
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: isDark ? "#F8FAFC" : "#0F172A" }}>
                    {analytics.totalClosedTrades}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#F59E0B", display: "block", mt: 0.5, fontWeight: 600 }}>
                    {analytics.openTradesCount} Active Open
                  </Typography>
                </Card>
              </Grid>

              {/* Card 5: Average Actual R */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card sx={{ p: 2, borderRadius: "6px", bgcolor: isDark ? "#0E162B" : "#FFFFFF", border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                    Average R
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: "#8B5CF6" }}>
                    {analytics.avgActualR !== null ? `${analytics.avgActualR}R` : "N/A"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? "#64748B" : "#94A3B8", display: "block", mt: 0.5 }}>
                    Risk-Adjusted Return
                  </Typography>
                </Card>
              </Grid>

              {/* Card 6: Maximum Drawdown */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card sx={{ p: 2, borderRadius: "6px", bgcolor: isDark ? "#0E162B" : "#FFFFFF", border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                    Max Drawdown
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: analytics.maxDrawdown > 0 ? "#EF4444" : "#10B981" }}>
                    {analytics.maxDrawdownPercent}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? "#64748B" : "#94A3B8", display: "block", mt: 0.5 }}>
                    -${analytics.maxDrawdown} from Peak
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Closed-Trade Equity Curve & Breakdown */}
            <Grid container spacing={2.5}>
              {/* Equity Growth Progress */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Card sx={{ p: 2.5, borderRadius: "6px", bgcolor: isDark ? "#0E162B" : "#FFFFFF", border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        Closed-Trade Equity Curve
                      </Typography>
                      <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                        Chronological progression: Initial Capital (${analytics.startingBalance}) + Cumulative Realized P&L
                      </Typography>
                    </Box>
                    <Chip
                      icon={<TimelineIcon sx={{ fontSize: 16 }} />}
                      label={`Ending Balance: $${analytics.endingBalance.toLocaleString()}`}
                      size="small"
                      sx={{ fontWeight: 700, bgcolor: "rgba(37, 99, 235, 0.15)", color: "#3B82F6" }}
                    />
                  </Box>

                  {/* Equity Curve Visual Table / Stepper */}
                  <Box sx={{ overflowX: "auto" }}>
                    <Box sx={{ display: "flex", gap: 1.5, py: 1 }}>
                      {analytics.equityCurve.map((pt) => (
                        <Box
                          key={pt.index}
                          sx={{
                            minWidth: 120,
                            p: 1.5,
                            borderRadius: "6px",
                            bgcolor: isDark ? "#070B16" : "#F8FAFC",
                            border: isDark ? "1px solid rgba(59, 130, 246, 0.12)" : "1px solid #E2E8F0",
                            textAlign: "center",
                          }}
                        >
                          <Typography variant="caption" sx={{ color: isDark ? "#64748B" : "#94A3B8", display: "block" }}>
                            {pt.date}
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, my: 0.3 }}>
                            {pt.symbol}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: pt.pnl > 0 ? "#10B981" : pt.pnl < 0 ? "#EF4444" : "#94A3B8",
                              display: "block",
                            }}
                          >
                            {pt.pnl > 0 ? `+$${pt.pnl}` : pt.pnl < 0 ? `-$${Math.abs(pt.pnl)}` : "$0.00"}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "#3B82F6", display: "block", mt: 0.5 }}>
                            ${pt.equity.toLocaleString()}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Card>
              </Grid>

              {/* Strategy & Symbol Breakdown */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ p: 2.5, borderRadius: "6px", bgcolor: isDark ? "#0E162B" : "#FFFFFF", border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0", height: "100%" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
                    Performance by Strategy
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {analytics.byStrategy.map((s, idx) => (
                      <Box key={idx} sx={{ p: 1.2, borderRadius: "6px", bgcolor: isDark ? "#070B16" : "#F8FAFC", border: isDark ? "1px solid rgba(59, 130, 246, 0.1)" : "1px solid #E2E8F0" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.82rem" }}>
                            {s.strategyName}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: s.netPnl >= 0 ? "#10B981" : "#EF4444" }}>
                            {s.netPnl >= 0 ? `+$${s.netPnl}` : `-$${Math.abs(s.netPnl)}`}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                          <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                            {s.count} trades (Win Rate: {s.winRate !== null ? `${s.winRate}%` : "N/A"})
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#3B82F6", fontWeight: 600 }}>
                            PF: {s.profitFactor ?? "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ============================================================ */}
        {/* TAB 1: ADD TRADE (THREE-STAGE WORKFLOW)                      */}
        {/* ============================================================ */}
        {activeTab === 1 && (
          <Card
            sx={{
              maxWidth: 900,
              mx: "auto",
              borderRadius: "6px",
              bgcolor: isDark ? "#0B1226" : "#FFFFFF",
              border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>
                  Record Trade
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                  Three-stage manual entry: Step A (Essential), Step B (Exit & Risk), Step C (Journal & Psychology).
                </Typography>
              </Box>

              <form onSubmit={handleCreateTrade}>
                {/* STEP A: ESSENTIAL DETAILS */}
                <Box sx={{ mb: 3.5, p: 2, borderRadius: "6px", bgcolor: isDark ? "#070B16" : "#F8FAFC", border: isDark ? "1px solid rgba(59, 130, 246, 0.15)" : "1px solid #E2E8F0" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#38BDF8", mb: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Step A — Essential Details (Required)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth size="small" required>
                        <InputLabel>Trading Account</InputLabel>
                        <Select
                          value={tradeForm.accountId}
                          label="Trading Account"
                          onChange={(e) => setTradeForm({ ...tradeForm, accountId: e.target.value })}
                        >
                          {accounts.map((a) => (
                            <MenuItem key={a.id} value={a.id}>
                              {a.name} ({a.account_type.toUpperCase()} - {a.currency})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Instrument / Symbol"
                        required
                        value={tradeForm.symbol}
                        onChange={(e) => setTradeForm({ ...tradeForm, symbol: e.target.value })}
                        placeholder="e.g. EURUSD, BTCUSD, AAPL"
                      />
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Direction</InputLabel>
                        <Select
                          value={tradeForm.direction}
                          label="Direction"
                          onChange={(e) => setTradeForm({ ...tradeForm, direction: e.target.value })}
                        >
                          <MenuItem value="BUY">BUY / LONG</MenuItem>
                          <MenuItem value="SELL">SELL / SHORT</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={tradeForm.status}
                          label="Status"
                          onChange={(e) => setTradeForm({ ...tradeForm, status: e.target.value })}
                        >
                          <MenuItem value="CLOSED">CLOSED (Completed)</MenuItem>
                          <MenuItem value="OPEN">OPEN (Active Trade)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Entry Price"
                        type="number"
                        required
                        value={tradeForm.entryPrice}
                        onChange={(e) => setTradeForm({ ...tradeForm, entryPrice: e.target.value })}
                        placeholder="e.g. 1.0825"
                      />
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Volume / Lot Size"
                        type="number"
                        value={tradeForm.volume}
                        onChange={(e) => setTradeForm({ ...tradeForm, volume: e.target.value })}
                        placeholder="e.g. 1.0"
                      />
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Entry Date & Time"
                        type="datetime-local"
                        value={tradeForm.openedAt}
                        onChange={(e) => setTradeForm({ ...tradeForm, openedAt: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* STEP B: EXIT AND RISK */}
                {tradeForm.status === "CLOSED" && (
                  <Box sx={{ mb: 3.5, p: 2, borderRadius: "6px", bgcolor: isDark ? "#070B16" : "#F8FAFC", border: isDark ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid #E2E8F0" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#10B981", mb: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Step B — Exit & Risk Realization
                    </Typography>

                    <RadioGroup
                      row
                      value={tradeForm.pnlMode}
                      onChange={(e) => setTradeForm({ ...tradeForm, pnlMode: e.target.value })}
                      sx={{ mb: 2 }}
                    >
                      <FormControlLabel value="net" control={<Radio size="small" />} label="Direct Net P&L Entry (Recommended)" />
                      <FormControlLabel value="calculate" control={<Radio size="small" />} label="Calculate from Exit Price" />
                    </RadioGroup>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Exit Price"
                          type="number"
                          value={tradeForm.exitPrice}
                          onChange={(e) => setTradeForm({ ...tradeForm, exitPrice: e.target.value })}
                          placeholder="e.g. 1.0875"
                        />
                      </Grid>

                      {tradeForm.pnlMode === "net" && (
                        <Grid size={{ xs: 6, md: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Net Realized P&L ($)"
                            type="number"
                            required
                            value={tradeForm.netPnl}
                            onChange={(e) => setTradeForm({ ...tradeForm, netPnl: e.target.value })}
                            placeholder="e.g. 980 or -350"
                            helperText="Positive for win, negative for loss"
                          />
                        </Grid>
                      )}

                      <Grid size={{ xs: 6, md: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Planned Monetary Risk ($)"
                          type="number"
                          value={tradeForm.plannedRiskAmount}
                          onChange={(e) => setTradeForm({ ...tradeForm, plannedRiskAmount: e.target.value })}
                          placeholder="e.g. 250"
                          helperText="Used to compute Actual R"
                        />
                      </Grid>

                      <Grid size={{ xs: 6, md: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Stop Loss Price"
                          type="number"
                          value={tradeForm.stopLoss}
                          onChange={(e) => setTradeForm({ ...tradeForm, stopLoss: e.target.value })}
                        />
                      </Grid>

                      <Grid size={{ xs: 6, md: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Take Profit Price"
                          type="number"
                          value={tradeForm.takeProfit}
                          onChange={(e) => setTradeForm({ ...tradeForm, takeProfit: e.target.value })}
                        />
                      </Grid>

                      <Grid size={{ xs: 6, md: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Commission & Fees ($)"
                          type="number"
                          value={tradeForm.commission}
                          onChange={(e) => setTradeForm({ ...tradeForm, commission: e.target.value })}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* STEP C: JOURNAL AND PSYCHOLOGY */}
                <Box sx={{ mb: 3.5, p: 2, borderRadius: "6px", bgcolor: isDark ? "#070B16" : "#F8FAFC", border: isDark ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid #E2E8F0" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#8B5CF6", mb: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Step C — Journal & Psychology (Optional)
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Strategy</InputLabel>
                        <Select
                          value={tradeForm.strategyId}
                          label="Strategy"
                          onChange={(e) => setTradeForm({ ...tradeForm, strategyId: e.target.value })}
                        >
                          <MenuItem value="">None / Discretionary</MenuItem>
                          {strategies.map((s) => (
                            <MenuItem key={s.id} value={s.id}>
                              {s.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Emotion Before</InputLabel>
                        <Select
                          value={tradeForm.emotionBefore}
                          label="Emotion Before"
                          onChange={(e) => setTradeForm({ ...tradeForm, emotionBefore: e.target.value })}
                        >
                          <MenuItem value="Calm">Calm & Patient</MenuItem>
                          <MenuItem value="Confident">Confident</MenuItem>
                          <MenuItem value="Anxious">Anxious</MenuItem>
                          <MenuItem value="FOMO">FOMO / Hurried</MenuItem>
                          <MenuItem value="Bored">Bored</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Emotion After</InputLabel>
                        <Select
                          value={tradeForm.emotionAfter}
                          label="Emotion After"
                          onChange={(e) => setTradeForm({ ...tradeForm, emotionAfter: e.target.value })}
                        >
                          <MenuItem value="Satisfied">Satisfied</MenuItem>
                          <MenuItem value="Relieved">Relieved</MenuItem>
                          <MenuItem value="Regretful">Regretful</MenuItem>
                          <MenuItem value="Frustrated">Frustrated</MenuItem>
                          <MenuItem value="Neutral">Neutral</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Entry Rationale / Setup"
                        multiline
                        rows={2}
                        value={tradeForm.entryReason}
                        onChange={(e) => setTradeForm({ ...tradeForm, entryReason: e.target.value })}
                        placeholder="What technical criteria or market structure triggered this trade?"
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Mistakes / Lessons Learned"
                        multiline
                        rows={2}
                        value={tradeForm.lessonsLearned}
                        onChange={(e) => setTradeForm({ ...tradeForm, lessonsLearned: e.target.value })}
                        placeholder="What did you learn? Did you follow your rules?"
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Discipline Rating:
                        </Typography>
                        <Rating
                          value={tradeForm.disciplineRating}
                          onChange={(_, val) => setTradeForm({ ...tradeForm, disciplineRating: val || 5 })}
                        />
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={tradeForm.ruleAdherence}
                            onChange={(e) => setTradeForm({ ...tradeForm, ruleAdherence: e.target.checked })}
                          />
                        }
                        label="Followed Trading Rules strictly"
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setActiveTab(0)}
                    sx={{ borderRadius: "6px" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submittingTrade}
                    sx={{
                      bgcolor: "#2563EB",
                      borderRadius: "6px",
                      px: 3,
                      fontWeight: 700,
                      "&:hover": { bgcolor: "#1D4ED8" },
                    }}
                  >
                    {submittingTrade ? "Saving to PostgreSQL..." : "Save Trade Record"}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ============================================================ */}
        {/* TAB 2: TRADE HISTORY                                         */}
        {/* ============================================================ */}
        {activeTab === 2 && (
          <Card
            sx={{
              borderRadius: "6px",
              bgcolor: isDark ? "#0B1226" : "#FFFFFF",
              border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0",
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              {/* Filter Controls & Search */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="Filter by symbol, notes, strategy..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 18, color: "#3B82F6" }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ minWidth: 260 }}
                />

                <Box sx={{ display: "flex", gap: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={historyStatus}
                      label="Status"
                      onChange={(e) => setHistoryStatus(e.target.value)}
                    >
                      <MenuItem value="ALL">All Statuses</MenuItem>
                      <MenuItem value="CLOSED">CLOSED</MenuItem>
                      <MenuItem value="OPEN">OPEN</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Direction</InputLabel>
                    <Select
                      value={historyDirection}
                      label="Direction"
                      onChange={(e) => setHistoryDirection(e.target.value)}
                    >
                      <MenuItem value="ALL">All Directions</MenuItem>
                      <MenuItem value="BUY">BUY / LONG</MenuItem>
                      <MenuItem value="SELL">SELL / SHORT</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ExportIcon />}
                    onClick={handleExportCSV}
                    sx={{ borderRadius: "6px", fontSize: "0.8rem" }}
                  >
                    Export CSV
                  </Button>
                </Box>
              </Box>

              {/* Table */}
              <Paper elevation={0} sx={{ overflowX: "auto", border: isDark ? "1px solid rgba(59, 130, 246, 0.15)" : "1px solid #E2E8F0", borderRadius: "6px" }}>
                <Box
                  component="table"
                  sx={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    fontSize: "0.82rem",
                    "& th": {
                      py: 1.2,
                      px: 1.5,
                      bgcolor: isDark ? "#0E162B" : "#F1F5F9",
                      color: isDark ? "#94A3B8" : "#475569",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontSize: "0.72rem",
                      borderBottom: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0",
                    },
                    "& td": {
                      py: 1.2,
                      px: 1.5,
                      borderBottom: isDark ? "1px solid rgba(59, 130, 246, 0.08)" : "1px solid #F1F5F9",
                    },
                    "& tr:hover": {
                      bgcolor: isDark ? "rgba(59, 130, 246, 0.06)" : "rgba(37, 99, 235, 0.04)",
                    },
                  }}
                >
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Symbol</th>
                      <th>Direction</th>
                      <th>Status</th>
                      <th>Entry Price</th>
                      <th>Exit Price</th>
                      <th>Volume</th>
                      <th>Net Realized P&L</th>
                      <th>Actual R</th>
                      <th>Strategy</th>
                      <th>Journal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrades.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ textAlign: "center", padding: "32px" }}>
                          <Typography variant="body2" sx={{ color: isDark ? "#64748B" : "#94A3B8" }}>
                            No trades matching current filters
                          </Typography>
                        </td>
                      </tr>
                    ) : (
                      filteredTrades.map((t) => (
                        <tr key={t.id}>
                          <td>{new Date(t.opened_at).toLocaleDateString()}</td>
                          <td>
                            <strong>{t.symbol}</strong>
                          </td>
                          <td>
                            <Chip
                              label={t.direction}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                bgcolor: t.direction === "BUY" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                color: t.direction === "BUY" ? "#34D399" : "#F87171",
                              }}
                            />
                          </td>
                          <td>
                            <Chip
                              label={t.status}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 600,
                                bgcolor: t.status === "CLOSED" ? "rgba(59, 130, 246, 0.12)" : "rgba(245, 158, 11, 0.15)",
                                color: t.status === "CLOSED" ? "#60A5FA" : "#FBBF24",
                              }}
                            />
                          </td>
                          <td>{t.entry_price}</td>
                          <td>{t.exit_price ?? "-"}</td>
                          <td>{t.volume ?? "-"}</td>
                          <td>
                            {t.status === "CLOSED" && t.net_pnl !== null && t.net_pnl !== undefined ? (
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 800,
                                  color: t.net_pnl >= 0 ? "#10B981" : "#EF4444",
                                }}
                              >
                                {t.net_pnl >= 0 ? `+$${t.net_pnl}` : `-$${Math.abs(t.net_pnl)}`}
                              </Typography>
                            ) : (
                              <Chip label="OPEN" size="small" sx={{ height: 18, fontSize: "0.65rem", bgcolor: "rgba(245, 158, 11, 0.15)", color: "#FBBF24" }} />
                            )}
                          </td>
                          <td>
                            {t.actual_r !== null ? (
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "#8B5CF6" }}>
                                {t.actual_r}R
                              </Typography>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td>
                            <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                              {t.strategy_name || "Discretionary"}
                            </Typography>
                          </td>
                          <td>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => setSelectedTrade(t)}
                              sx={{ fontSize: "0.74rem", textTransform: "none", p: 0.5 }}
                            >
                              View Notes
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Box>
              </Paper>
            </CardContent>
          </Card>
        )}

        {/* ============================================================ */}
        {/* TAB 3: TRADING CALENDAR                                      */}
        {/* ============================================================ */}
        {activeTab === 3 && (
          <Card
            sx={{
              borderRadius: "6px",
              bgcolor: isDark ? "#0B1226" : "#FFFFFF",
              border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0",
              p: 2.5,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Trading Performance Calendar
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? "#94A3B8" : "#64748B", mb: 3 }}>
              Daily realized P&L aggregated strictly from verified closed trade records in PostgreSQL.
            </Typography>

            <Grid container spacing={1.5}>
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                <Grid key={day} size={{ xs: 2.4 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, textAlign: "center", display: "block", color: isDark ? "#94A3B8" : "#64748B" }}>
                    {day}
                  </Typography>
                </Grid>
              ))}

              {/* Sample Month Grid Day Cards */}
              {[
                { date: "Oct 05", pnl: 0, count: 0 },
                { date: "Oct 06", pnl: 980, count: 1, win: true },
                { date: "Oct 07", pnl: -357.5, count: 1, win: false },
                { date: "Oct 08", pnl: 907.5, count: 1, win: true },
                { date: "Oct 09", pnl: -8, count: 1, win: false },
              ].map((dayItem, i) => (
                <Grid key={i} size={{ xs: 2.4 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      minHeight: 100,
                      borderRadius: "6px",
                      bgcolor:
                        dayItem.count === 0
                          ? isDark ? "#070B16" : "#F8FAFC"
                          : dayItem.pnl > 0
                          ? isDark ? "rgba(16, 185, 129, 0.12)" : "#ECFDF5"
                          : isDark ? "rgba(239, 68, 68, 0.12)" : "#FEF2F2",
                      border:
                        dayItem.count === 0
                          ? isDark ? "1px solid rgba(59, 130, 246, 0.1)" : "1px solid #E2E8F0"
                          : dayItem.pnl > 0
                          ? "1px solid rgba(16, 185, 129, 0.3)"
                          : "1px solid rgba(239, 68, 68, 0.3)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? "#94A3B8" : "#64748B" }}>
                      {dayItem.date}
                    </Typography>
                    {dayItem.count > 0 ? (
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 800,
                            color: dayItem.pnl > 0 ? "#10B981" : "#EF4444",
                          }}
                        >
                          {dayItem.pnl > 0 ? `+$${dayItem.pnl}` : `-$${Math.abs(dayItem.pnl)}`}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                          {dayItem.count} trade{dayItem.count > 1 ? "s" : ""}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: isDark ? "#475569" : "#CBD5E1" }}>
                        No trades
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Card>
        )}

        {/* ============================================================ */}
        {/* TAB 4: ANALYTICS & ALGORITHMS (SECTION 7 SPECIFICATION)      */}
        {/* ============================================================ */}
        {activeTab === 4 && analytics && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Card sx={{ p: 3, borderRadius: "6px", bgcolor: isDark ? "#0B1226" : "#FFFFFF", border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0" }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Section 7: Core Financial Formula Specifications
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? "#94A3B8" : "#64748B", mb: 3 }}>
                Every metric is strictly calculated from real database records with documented mathematical explanations:
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: "6px", bgcolor: isDark ? "#070B16" : "#F8FAFC", border: isDark ? "1px solid rgba(59, 130, 246, 0.15)" : "1px solid #E2E8F0" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#38BDF8" }}>
                      Win Rate: {analytics.winRate}%
                    </Typography>
                    <Typography variant="caption" sx={{ display: "block", color: isDark ? "#94A3B8" : "#64748B", my: 0.5 }}>
                      Formula: W / (W + L) * 100
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#64748B" : "#94A3B8" }}>
                      Excludes break-even trades ({analytics.breakEvenTrades}) from the decisive denominator.
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: "6px", bgcolor: isDark ? "#070B16" : "#F8FAFC", border: isDark ? "1px solid rgba(59, 130, 246, 0.15)" : "1px solid #E2E8F0" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#10B981" }}>
                      Profit Factor: {analytics.profitFactor ?? "N/A"}
                    </Typography>
                    <Typography variant="caption" sx={{ display: "block", color: isDark ? "#94A3B8" : "#64748B", my: 0.5 }}>
                      Formula: Gross Profit / Gross Loss
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#64748B" : "#94A3B8" }}>
                      Gross Profit: ${analytics.grossProfit} | Gross Loss: ${analytics.grossLoss}.
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: "6px", bgcolor: isDark ? "#070B16" : "#F8FAFC", border: isDark ? "1px solid rgba(59, 130, 246, 0.15)" : "1px solid #E2E8F0" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#8B5CF6" }}>
                      Expectancy: ${analytics.expectancy ?? "N/A"}
                    </Typography>
                    <Typography variant="caption" sx={{ display: "block", color: isDark ? "#94A3B8" : "#64748B", my: 0.5 }}>
                      Formula: (W_rate * Avg Win) - (L_rate * Avg Loss)
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#64748B" : "#94A3B8" }}>
                      Expected dollar gain per decisive executed trade.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Card>
          </Box>
        )}

        {/* ============================================================ */}
        {/* TAB 5: JOURNAL & PSYCHOLOGY                                  */}
        {/* ============================================================ */}
        {activeTab === 5 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Card sx={{ p: 3, borderRadius: "6px", bgcolor: isDark ? "#0B1226" : "#FFFFFF", border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0" }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Trading Psychology & Daily Reviews
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? "#94A3B8" : "#64748B", mb: 3 }}>
                Reflective journal logs documenting emotional state, rule adherence, and key lessons learned.
              </Typography>

              <Grid container spacing={2}>
                {reviews.map((r) => (
                  <Grid key={r.id} size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: "6px", bgcolor: isDark ? "#070B16" : "#F8FAFC", border: isDark ? "1px solid rgba(59, 130, 246, 0.15)" : "1px solid #E2E8F0" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#38BDF8" }}>
                          Review Date: {new Date(r.review_date).toLocaleDateString()}
                        </Typography>
                        <Rating value={r.daily_rating || 4} readOnly size="small" />
                      </Box>

                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#10B981", display: "block" }}>
                          WHAT WENT WELL:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "0.82rem" }}>
                          {r.what_went_well || "Executed plan without hesitation."}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#EF4444", display: "block" }}>
                          WHAT WENT WRONG / MISTAKES:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "0.82rem" }}>
                          {r.what_went_wrong || "None identified."}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#8B5CF6", display: "block" }}>
                          LESSONS & NEXT SESSION PLAN:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "0.82rem" }}>
                          {r.next_session_plan || "Focus on A+ setups only."}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Box>
        )}

        {/* ============================================================ */}
        {/* TAB 6: ACCOUNTS MANAGEMENT                                   */}
        {/* ============================================================ */}
        {activeTab === 6 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Grid container spacing={2.5}>
              {accounts.map((acc) => (
                <Grid key={acc.id} size={{ xs: 12, md: 4 }}>
                  <Card sx={{ p: 2.5, borderRadius: "6px", bgcolor: isDark ? "#0E162B" : "#FFFFFF", border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Chip
                        label={acc.account_type.toUpperCase()}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.68rem",
                          bgcolor: acc.account_type === "live" ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)",
                          color: acc.account_type === "live" ? "#34D399" : "#60A5FA",
                        }}
                      />
                      <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                        Currency: {acc.currency}
                      </Typography>
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 800, mt: 1 }}>
                      {acc.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", display: "block", mb: 2 }}>
                      {acc.description || "Manually tracked portfolio"}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                        Starting Balance:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        ${Number(acc.starting_balance).toLocaleString()}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                        Current Balance:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 800,
                          color: Number(acc.current_balance) >= Number(acc.starting_balance) ? "#10B981" : "#EF4444",
                        }}
                      >
                        ${Number(acc.current_balance).toLocaleString()}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>

      {/* ============================================================== */}
      {/* TRADE DETAIL MODAL (PSYCHOLOGY & JOURNAL NOTES)                */}
      {/* ============================================================== */}
      <Dialog
        open={Boolean(selectedTrade)}
        onClose={() => setSelectedTrade(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: isDark ? "#0E162B" : "#FFFFFF",
              borderRadius: "6px",
              border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0",
              p: 2,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
          <BookIcon sx={{ color: "#3B82F6" }} />
          Trade Journal: #{selectedTrade?.id} ({selectedTrade?.symbol})
        </DialogTitle>
        <DialogContent>
          {selectedTrade && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#38BDF8", display: "block" }}>
                  SETUP & ENTRY RATIONALE:
                </Typography>
                <Typography variant="body2">
                  {selectedTrade.notes || selectedTrade.entry_reason || "No notes recorded for this trade."}
                </Typography>
              </Box>

              <Divider />

              <Box sx={{ display: "flex", gap: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? "#94A3B8" : "#64748B", display: "block" }}>
                    Emotion Before:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedTrade.emotion_before || "Calm"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? "#94A3B8" : "#64748B", display: "block" }}>
                    Emotion After:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedTrade.emotion_after || "Satisfied"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? "#94A3B8" : "#64748B", display: "block" }}>
                    Discipline:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedTrade.discipline_rating ? `${selectedTrade.discipline_rating}/5` : "5/5"}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#EF4444", display: "block" }}>
                  MISTAKES & LESSONS:
                </Typography>
                <Typography variant="body2">
                  {selectedTrade.lessons_learned || selectedTrade.mistakes || "Followed trading plan."}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTrade(null)} sx={{ borderRadius: "6px" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================== */}
      {/* TOAST NOTIFICATION                                             */}
      {/* ============================================================== */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: "6px", fontWeight: 600 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
