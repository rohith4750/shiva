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
  Slider,
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

interface TradingJournalViewProps {
  initialTab?: number;
  onBackToHome?: () => void;
}

export default function TradingJournalView({
  initialTab = 0,
  onBackToHome,
}: TradingJournalViewProps) {
  const { mode } = useColorMode();
  const isDark = mode === "dark";

  // Navigation State: 0 = Overview, 1 = Add Trade, 2 = History, 3 = Calendar, 4 = Analytics, 5 = Journal, 6 = Accounts
  const [activeTab, setActiveTab] = useState<number>(initialTab);

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
    const today = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toTimeString().slice(0, 5);
    setTradeForm((prev) => ({
      ...prev,
      tradeDate: prev.tradeDate || today,
      tradeTime: prev.tradeTime || nowTime,
      tradeNum: prev.tradeNum || String(trades.length + 1),
    }));
  }, [fetchJournalData, trades.length]);

  // --- 31-FIELD SINGLE-FORM STATE ---
  const [tradeForm, setTradeForm] = useState({
    // 1. Trade #
    tradeNum: "6",
    // 2. Date
    tradeDate: "",
    // 3. Time
    tradeTime: "09:25",
    // 4. Symbol
    symbol: "NIFTY",
    // 5. Market
    market: "Indian Indices (NSE)",
    // 6. Direction
    direction: "BUY",
    // 7. Strategy/Setup
    strategyId: "",
    // 8. Session
    session: "Morning Opening (9:15-11:00)",
    // 9. Entry Price
    entryPrice: "25150",
    // 10. SL Price
    stopLoss: "25100",
    // 11. TP Price
    takeProfit: "25300",
    // 12. Exit Price
    exitPrice: "25280",
    // 13. Lots / Quantity
    volume: "50",
    // 14. Risk ₹
    plannedRiskAmount: "2500",
    // 15. SL Points
    slPoints: "50.00",
    // 16. TP Points
    tpPoints: "150.00",
    // 17. Planned R:R
    plannedRR: "1 : 3.00",
    // 18. P&L ₹
    netPnl: "6500",
    // 19. Actual R:R
    actualRR: "+2.60R",
    // 20. Result
    result: "WIN",
    // 21. Emotion Before
    emotionBefore: "Calm & Focused",
    // 22. Emotion During
    emotionDuring: "Focused",
    // 23. Emotion After
    emotionAfter: "Satisfied",
    // 24. Confidence 1-10
    confidenceRating: 9,
    // 25. Discipline 1-10
    disciplineRating: 9,
    // 26. Mistake?
    mistakeFlag: false,
    // 27. Mistake Type
    mistakeType: "None / Followed Plan",
    // 28. Market Condition
    marketCondition: "Strong Trending Up ↗",
    // 29. Entry Reason
    entryReason: "Bullish Order Block tap on 5m chart with 15m structural break and volume expansion.",
    // 30. Exit Reason
    exitReason: "Hit Take Profit Target",
    // 31. Notes
    notes: "Clean trade execution following trading rules. Held through pullback without panic.",

    accountId: "",
    status: "CLOSED",
  });

  // Auto-Calculation helper for 31-field single form
  const updateTradeField = (field: string, val: any) => {
    setTradeForm((prev) => {
      const next = { ...prev, [field]: val };

      const entry = parseFloat(field === "entryPrice" ? val : next.entryPrice);
      const sl = parseFloat(field === "stopLoss" ? val : next.stopLoss);
      const tp = parseFloat(field === "takeProfit" ? val : next.takeProfit);
      const exit = parseFloat(field === "exitPrice" ? val : next.exitPrice);
      const lots = parseFloat(field === "volume" ? val : next.volume) || 1;
      const dir = field === "direction" ? val : next.direction;

      // 15. SL Points
      let slPts = next.slPoints;
      if (!isNaN(entry) && !isNaN(sl)) {
        slPts = Math.abs(entry - sl).toFixed(2);
        next.slPoints = slPts;
      }

      // 16. TP Points
      let tpPts = next.tpPoints;
      if (!isNaN(entry) && !isNaN(tp)) {
        tpPts = Math.abs(tp - entry).toFixed(2);
        next.tpPoints = tpPts;
      }

      // 17. Planned R:R
      const numSl = parseFloat(slPts);
      const numTp = parseFloat(tpPts);
      if (!isNaN(numSl) && !isNaN(numTp) && numSl > 0) {
        next.plannedRR = `1 : ${(numTp / numSl).toFixed(2)}`;
      }

      // 14. Risk ₹ (auto calculate: SL Points * Lots if not manually overriding)
      if (!isNaN(numSl) && !isNaN(lots) && field !== "plannedRiskAmount") {
        next.plannedRiskAmount = (numSl * lots).toFixed(0);
      }

      // 18. P&L ₹ & 19. Actual R:R & 20. Result
      if (!isNaN(entry) && !isNaN(exit) && field !== "netPnl") {
        const mult = dir === "BUY" ? 1 : -1;
        const calcPnl = (exit - entry) * mult * lots;
        next.netPnl = calcPnl.toFixed(0);

        const riskNum = parseFloat(next.plannedRiskAmount);
        if (!isNaN(riskNum) && riskNum > 0) {
          const rScore = (calcPnl / riskNum).toFixed(2);
          next.actualRR = (calcPnl >= 0 ? "+" : "") + `${rScore}R`;
        } else {
          next.actualRR = "-";
        }

        if (calcPnl > 0) next.result = "WIN";
        else if (calcPnl < 0) next.result = "LOSS";
        else next.result = "BREAK_EVEN";

        next.status = "CLOSED";
      } else if (field === "netPnl") {
        const customPnl = parseFloat(val);
        const riskNum = parseFloat(next.plannedRiskAmount);
        if (!isNaN(customPnl) && !isNaN(riskNum) && riskNum > 0) {
          const rScore = (customPnl / riskNum).toFixed(2);
          next.actualRR = (customPnl >= 0 ? "+" : "") + `${rScore}R`;
        }
        if (!isNaN(customPnl)) {
          next.result = customPnl > 0 ? "WIN" : customPnl < 0 ? "LOSS" : "BREAK_EVEN";
          next.status = "CLOSED";
        }
      } else if (isNaN(exit)) {
        next.result = "OPEN";
        next.actualRR = "-";
        next.netPnl = "";
        next.status = "OPEN";
      }

      // 26 & 27. Mistake Sync
      if (field === "mistakeFlag") {
        next.mistakeType = val ? "Early Entry before Trigger" : "None / Followed Plan";
      }

      return next;
    });
  };

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
      const openedAtDateTime = `${tradeForm.tradeDate}T${tradeForm.tradeTime || "09:15"}:00`;
      const payload = {
        accountId: tradeForm.accountId,
        strategyId: tradeForm.strategyId || null,
        symbol: tradeForm.symbol.toUpperCase().trim(),
        direction: tradeForm.direction,
        status: tradeForm.exitPrice ? "CLOSED" : "OPEN",
        openedAt: openedAtDateTime,
        closedAt: tradeForm.exitPrice ? openedAtDateTime : null,
        entryPrice: Number(tradeForm.entryPrice),
        exitPrice: tradeForm.exitPrice ? Number(tradeForm.exitPrice) : null,
        stopLoss: tradeForm.stopLoss ? Number(tradeForm.stopLoss) : null,
        takeProfit: tradeForm.takeProfit ? Number(tradeForm.takeProfit) : null,
        volume: tradeForm.volume ? Number(tradeForm.volume) : 1,
        plannedRiskAmount: tradeForm.plannedRiskAmount ? Number(tradeForm.plannedRiskAmount) : null,
        plannedRewardAmount:
          tradeForm.tpPoints && tradeForm.volume ? Number(tradeForm.tpPoints) * Number(tradeForm.volume) : null,
        netPnl: tradeForm.exitPrice && tradeForm.netPnl !== "" ? Number(tradeForm.netPnl) : null,
        grossPnl: tradeForm.exitPrice && tradeForm.netPnl !== "" ? Number(tradeForm.netPnl) : null,
        commission: 0,
        swap: 0,
        fees: 0,
        notes: tradeForm.notes,
        // 31 fields
        tradeNum: tradeForm.tradeNum ? Number(tradeForm.tradeNum) : null,
        market: tradeForm.market,
        session: tradeForm.session,
        slPoints: tradeForm.slPoints ? Number(tradeForm.slPoints) : null,
        tpPoints: tradeForm.tpPoints ? Number(tradeForm.tpPoints) : null,
        marketCondition: tradeForm.marketCondition,
        result: tradeForm.result,
        entryReason: tradeForm.entryReason,
        exitReason: tradeForm.exitReason,
        emotionBefore: tradeForm.emotionBefore,
        emotionDuring: tradeForm.emotionDuring,
        emotionAfter: tradeForm.emotionAfter,
        confidenceRating: Number(tradeForm.confidenceRating),
        disciplineRating: Number(tradeForm.disciplineRating),
        ruleAdherence: !tradeForm.mistakeFlag,
        mistakeFlag: Boolean(tradeForm.mistakeFlag),
        mistakeType: tradeForm.mistakeType,
        mistakes: tradeForm.mistakeFlag ? tradeForm.mistakeType : "None",
        lessonsLearned: tradeForm.notes,
      };

      const res = await fetch("/api/journal/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Trade recorded in PostgreSQL with all 31 fields!", "success");
        fetchJournalData();
        setActiveTab(2); // Jump to Trade History
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
          {onBackToHome ? (
            <Button
              size="small"
              onClick={onBackToHome}
              startIcon={<ArrowBackIcon />}
              sx={{
                color: isDark ? "#94A3B8" : "#64748B",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.82rem",
              }}
            >
              Back to Overview
            </Button>
          ) : (
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
          )}
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
        {/* TAB 1: ADD TRADE (COMPLETE 31-FIELD SINGLE-FORM ENGINE)      */}
        {/* ============================================================ */}
        {activeTab === 1 && (
          <Card
            sx={{
              maxWidth: 1100,
              mx: "auto",
              borderRadius: "8px",
              bgcolor: isDark ? "#0B1226" : "#FFFFFF",
              border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0",
              boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              {/* Form Title & Top Banner */}
              <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>
                      Trade Entry Form
                    </Typography>
                    <Chip
                      label={`Trade #${tradeForm.tradeNum || "1"}`}
                      sx={{ bgcolor: "#2563EB", color: "#FFF", fontWeight: 800, fontSize: "0.78rem" }}
                      size="small"
                    />
                    <Chip
                      label={tradeForm.result}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.75rem",
                        bgcolor:
                          tradeForm.result === "WIN"
                            ? "rgba(16, 185, 129, 0.2)"
                            : tradeForm.result === "LOSS"
                            ? "rgba(239, 68, 68, 0.2)"
                            : "rgba(245, 158, 11, 0.2)",
                        color:
                          tradeForm.result === "WIN"
                            ? "#10B981"
                            : tradeForm.result === "LOSS"
                            ? "#EF4444"
                            : "#F59E0B",
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: isDark ? "#94A3B8" : "#64748B", mt: 0.5 }}>
                    Complete 31-field trading journal entry with Indian Rupee (₹) & point auto-calculations.
                  </Typography>
                </Box>

                {/* Account Selection */}
                <FormControl size="small" sx={{ minWidth: 240 }} required>
                  <InputLabel>Trading Account</InputLabel>
                  <Select
                    value={tradeForm.accountId}
                    label="Trading Account"
                    onChange={(e) => updateTradeField("accountId", e.target.value)}
                  >
                    {accounts.map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.name} ({a.account_type.toUpperCase()} - {a.currency})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Quick Symbol Chips */}
              <Box sx={{ mb: 3, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? "#94A3B8" : "#64748B", mr: 1 }}>
                  QUICK SYMBOLS:
                </Typography>
                {["NIFTY", "BANKNIFTY", "FINNIFTY", "CRUDEOIL", "RELIANCE", "TCS", "EURUSD", "BTCUSDT"].map((sym) => (
                  <Chip
                    key={sym}
                    label={sym}
                    size="small"
                    onClick={() => updateTradeField("symbol", sym)}
                    sx={{
                      cursor: "pointer",
                      fontSize: "0.72rem",
                      fontWeight: tradeForm.symbol === sym ? 800 : 500,
                      bgcolor:
                        tradeForm.symbol === sym
                          ? "#2563EB"
                          : isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "#F1F5F9",
                      color: tradeForm.symbol === sym ? "#FFF" : "inherit",
                    }}
                  />
                ))}
              </Box>

              <form onSubmit={handleCreateTrade}>
                {/* ======================================================== */}
                {/* SECTION 1: TRADE SETUP & EXECUTION (Fields 1 - 8)         */}
                {/* ======================================================== */}
                <Paper
                  sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: "6px",
                    bgcolor: isDark ? "#070B16" : "#F8FAFC",
                    border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#38BDF8", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <Box component="span" sx={{ bgcolor: "#0284C7", color: "#FFF", px: 0.8, py: 0.1, borderRadius: "4px", fontSize: "0.7rem" }}>
                      PART 1
                    </Box>
                    Trade Setup & Execution (Fields 1 – 8)
                  </Typography>

                  <Grid container spacing={2}>
                    {/* 1. Trade # */}
                    <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="1. Trade #"
                        type="number"
                        value={tradeForm.tradeNum}
                        onChange={(e) => updateTradeField("tradeNum", e.target.value)}
                      />
                    </Grid>

                    {/* 2. Date */}
                    <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="2. Date"
                        type="date"
                        value={tradeForm.tradeDate}
                        onChange={(e) => updateTradeField("tradeDate", e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    </Grid>

                    {/* 3. Time */}
                    <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="3. Time"
                        type="time"
                        value={tradeForm.tradeTime}
                        onChange={(e) => updateTradeField("tradeTime", e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    </Grid>

                    {/* 4. Symbol */}
                    <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="4. Symbol"
                        required
                        value={tradeForm.symbol}
                        onChange={(e) => updateTradeField("symbol", e.target.value)}
                      />
                    </Grid>

                    {/* 5. Market */}
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>5. Market</InputLabel>
                        <Select
                          value={tradeForm.market}
                          label="5. Market"
                          onChange={(e) => updateTradeField("market", e.target.value)}
                        >
                          <MenuItem value="Indian Indices (NSE)">Indian Indices (NSE)</MenuItem>
                          <MenuItem value="Indian Equity / F&O">Indian Equity / F&O</MenuItem>
                          <MenuItem value="Commodities (MCX)">Commodities (MCX)</MenuItem>
                          <MenuItem value="Forex">Forex</MenuItem>
                          <MenuItem value="Crypto">Crypto</MenuItem>
                          <MenuItem value="US Equities">US Equities</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* 6. Direction */}
                    <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>6. Direction</InputLabel>
                        <Select
                          value={tradeForm.direction}
                          label="6. Direction"
                          onChange={(e) => updateTradeField("direction", e.target.value)}
                        >
                          <MenuItem value="BUY" sx={{ color: "#10B981", fontWeight: 700 }}>BUY / LONG (↗)</MenuItem>
                          <MenuItem value="SELL" sx={{ color: "#EF4444", fontWeight: 700 }}>SELL / SHORT (↘)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* 7. Strategy / Setup */}
                    <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>7. Strategy / Setup</InputLabel>
                        <Select
                          value={tradeForm.strategyId}
                          label="7. Strategy / Setup"
                          onChange={(e) => updateTradeField("strategyId", e.target.value)}
                        >
                          <MenuItem value="">SMC Order Block / FVG</MenuItem>
                          <MenuItem value="break-retest">Break & Retest</MenuItem>
                          <MenuItem value="orb-15m">ORB 15m Breakout</MenuItem>
                          <MenuItem value="vwap-rejection">VWAP Bounce / Rejection</MenuItem>
                          <MenuItem value="pullback-ema">Pullback to 20 EMA</MenuItem>
                          <MenuItem value="liquidity-sweep">Liquidity Sweep & Reversal</MenuItem>
                          {strategies.map((s) => (
                            <MenuItem key={s.id} value={s.id}>
                              {s.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* 8. Session */}
                    <Grid size={{ xs: 12, sm: 4, md: 5 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>8. Session</InputLabel>
                        <Select
                          value={tradeForm.session}
                          label="8. Session"
                          onChange={(e) => updateTradeField("session", e.target.value)}
                        >
                          <MenuItem value="Morning Opening (9:15-11:00)">Morning Opening (9:15 - 11:00)</MenuItem>
                          <MenuItem value="Mid-Day Consolidation (11:00-13:30)">Mid-Day Consolidation (11:00 - 13:30)</MenuItem>
                          <MenuItem value="Afternoon Closing (13:30-15:30)">Afternoon Closing (13:30 - 15:30)</MenuItem>
                          <MenuItem value="London Open">London Open</MenuItem>
                          <MenuItem value="New York Open">New York Open</MenuItem>
                          <MenuItem value="Asian Session">Asian Session</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>

                {/* ======================================================== */}
                {/* SECTION 2: PRICE LEVELS & SIZING (Fields 9 - 13)          */}
                {/* ======================================================== */}
                <Paper
                  sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: "6px",
                    bgcolor: isDark ? "#070B16" : "#F8FAFC",
                    border: isDark ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid #E2E8F0",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#10B981", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <Box component="span" sx={{ bgcolor: "#059669", color: "#FFF", px: 0.8, py: 0.1, borderRadius: "4px", fontSize: "0.7rem" }}>
                      PART 2
                    </Box>
                    Price Levels & Position Sizing (Fields 9 – 13)
                  </Typography>

                  <Grid container spacing={2}>
                    {/* 9. Entry */}
                    <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="9. Entry Price"
                        type="number"
                        required
                        value={tradeForm.entryPrice}
                        onChange={(e) => updateTradeField("entryPrice", e.target.value)}
                        placeholder="25150"
                      />
                    </Grid>

                    {/* 10. SL */}
                    <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="10. Stop Loss (SL)"
                        type="number"
                        value={tradeForm.stopLoss}
                        onChange={(e) => updateTradeField("stopLoss", e.target.value)}
                        placeholder="25100"
                      />
                    </Grid>

                    {/* 11. TP */}
                    <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="11. Take Profit (TP)"
                        type="number"
                        value={tradeForm.takeProfit}
                        onChange={(e) => updateTradeField("takeProfit", e.target.value)}
                        placeholder="25300"
                      />
                    </Grid>

                    {/* 12. Exit */}
                    <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="12. Exit Price"
                        type="number"
                        value={tradeForm.exitPrice}
                        onChange={(e) => updateTradeField("exitPrice", e.target.value)}
                        placeholder="Leave blank if OPEN"
                        helperText={tradeForm.exitPrice ? "Trade Marked as CLOSED" : "Leave blank if trade is still OPEN"}
                      />
                    </Grid>

                    {/* 13. Lots / Quantity */}
                    <Grid size={{ xs: 12, sm: 4, md: 2.4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="13. Lots / Quantity"
                        type="number"
                        value={tradeForm.volume}
                        onChange={(e) => updateTradeField("volume", e.target.value)}
                        placeholder="e.g. 50 (Nifty 1 lot)"
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* ======================================================== */}
                {/* SECTION 3: RISK & FINANCIAL ENGINE (Fields 14 - 20)      */}
                {/* ======================================================== */}
                <Paper
                  sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: "6px",
                    bgcolor: isDark ? "rgba(245, 158, 11, 0.04)" : "#FFFBEB",
                    border: isDark ? "1px solid rgba(245, 158, 11, 0.25)" : "1px solid #FDE68A",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#D97706", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <Box component="span" sx={{ bgcolor: "#D97706", color: "#FFF", px: 0.8, py: 0.1, borderRadius: "4px", fontSize: "0.7rem" }}>
                      PART 3
                    </Box>
                    Risk, Reward & Auto-Calculated Financials (Fields 14 – 20)
                  </Typography>

                  <Grid container spacing={2}>
                    {/* 14. Risk ₹ */}
                    <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="14. Risk ₹"
                        type="number"
                        value={tradeForm.plannedRiskAmount}
                        onChange={(e) => updateTradeField("plannedRiskAmount", e.target.value)}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
                      />
                    </Grid>

                    {/* 15. SL Points */}
                    <Grid size={{ xs: 6, sm: 3, md: 1.6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="15. SL Points"
                        value={tradeForm.slPoints}
                        onChange={(e) => updateTradeField("slPoints", e.target.value)}
                        helperText="Auto |Entry - SL|"
                      />
                    </Grid>

                    {/* 16. TP Points */}
                    <Grid size={{ xs: 6, sm: 3, md: 1.6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="16. TP Points"
                        value={tradeForm.tpPoints}
                        onChange={(e) => updateTradeField("tpPoints", e.target.value)}
                        helperText="Auto |TP - Entry|"
                      />
                    </Grid>

                    {/* 17. Planned R:R */}
                    <Grid size={{ xs: 6, sm: 3, md: 1.8 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="17. Planned R:R"
                        value={tradeForm.plannedRR}
                        onChange={(e) => updateTradeField("plannedRR", e.target.value)}
                        helperText="Auto TP / SL"
                      />
                    </Grid>

                    {/* 18. P&L ₹ */}
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="18. P&L ₹"
                        type="number"
                        value={tradeForm.netPnl}
                        onChange={(e) => updateTradeField("netPnl", e.target.value)}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
                        helperText="Positive win, negative loss"
                      />
                    </Grid>

                    {/* 19. Actual R:R */}
                    <Grid size={{ xs: 6, sm: 4, md: 1.5 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="19. Actual R:R"
                        value={tradeForm.actualRR}
                        onChange={(e) => updateTradeField("actualRR", e.target.value)}
                        helperText="P&L / Risk"
                      />
                    </Grid>

                    {/* 20. Result */}
                    <Grid size={{ xs: 6, sm: 4, md: 1.5 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>20. Result</InputLabel>
                        <Select
                          value={tradeForm.result}
                          label="20. Result"
                          onChange={(e) => updateTradeField("result", e.target.value)}
                        >
                          <MenuItem value="WIN" sx={{ color: "#10B981", fontWeight: 700 }}>WIN</MenuItem>
                          <MenuItem value="LOSS" sx={{ color: "#EF4444", fontWeight: 700 }}>LOSS</MenuItem>
                          <MenuItem value="BREAK_EVEN" sx={{ color: "#64748B", fontWeight: 700 }}>BREAK_EVEN</MenuItem>
                          <MenuItem value="OPEN" sx={{ color: "#F59E0B", fontWeight: 700 }}>OPEN</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>

                {/* ======================================================== */}
                {/* SECTION 4: PSYCHOLOGY & DISCIPLINE (Fields 21 - 27)      */}
                {/* ======================================================== */}
                <Paper
                  sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: "6px",
                    bgcolor: isDark ? "#070B16" : "#F8FAFC",
                    border: isDark ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid #E2E8F0",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#8B5CF6", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <Box component="span" sx={{ bgcolor: "#7C3AED", color: "#FFF", px: 0.8, py: 0.1, borderRadius: "4px", fontSize: "0.7rem" }}>
                      PART 4
                    </Box>
                    Trading Psychology & Mindset (Fields 21 – 27)
                  </Typography>

                  <Grid container spacing={2}>
                    {/* 21. Emotion Before */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>21. Emotion Before</InputLabel>
                        <Select
                          value={tradeForm.emotionBefore}
                          label="21. Emotion Before"
                          onChange={(e) => updateTradeField("emotionBefore", e.target.value)}
                        >
                          <MenuItem value="Calm & Focused">Calm & Focused</MenuItem>
                          <MenuItem value="Confident">Confident</MenuItem>
                          <MenuItem value="Anxious">Anxious</MenuItem>
                          <MenuItem value="FOMO / Chasing">FOMO / Chasing</MenuItem>
                          <MenuItem value="Rushed / Impatient">Rushed / Impatient</MenuItem>
                          <MenuItem value="Hesitant">Hesitant</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* 22. Emotion During */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>22. Emotion During</InputLabel>
                        <Select
                          value={tradeForm.emotionDuring}
                          label="22. Emotion During"
                          onChange={(e) => updateTradeField("emotionDuring", e.target.value)}
                        >
                          <MenuItem value="Focused">Focused & In Flow</MenuItem>
                          <MenuItem value="Relaxed">Relaxed</MenuItem>
                          <MenuItem value="Impatient">Impatient</MenuItem>
                          <MenuItem value="Fearful / Nervous">Fearful / Nervous</MenuItem>
                          <MenuItem value="Greedy">Greedy</MenuItem>
                          <MenuItem value="Stressed">Stressed</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* 23. Emotion After */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>23. Emotion After</InputLabel>
                        <Select
                          value={tradeForm.emotionAfter}
                          label="23. Emotion After"
                          onChange={(e) => updateTradeField("emotionAfter", e.target.value)}
                        >
                          <MenuItem value="Satisfied">Satisfied & Content</MenuItem>
                          <MenuItem value="Disciplined">Disciplined</MenuItem>
                          <MenuItem value="Regretful">Regretful</MenuItem>
                          <MenuItem value="Frustrated">Frustrated</MenuItem>
                          <MenuItem value="Relieved">Relieved</MenuItem>
                          <MenuItem value="Euphoric">Euphoric</MenuItem>
                          <MenuItem value="Revenge-Minded">Revenge-Minded</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* 24. Confidence 1-10 */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ p: 1.5, borderRadius: "6px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            24. Confidence (1–10):
                          </Typography>
                          <Chip label={`${tradeForm.confidenceRating}/10`} size="small" sx={{ fontWeight: 800, bgcolor: "#38BDF8", color: "#000", height: 20 }} />
                        </Box>
                        <Slider
                          value={tradeForm.confidenceRating}
                          min={1}
                          max={10}
                          step={1}
                          marks
                          valueLabelDisplay="auto"
                          onChange={(_, val) => updateTradeField("confidenceRating", val as number)}
                        />
                      </Box>
                    </Grid>

                    {/* 25. Discipline 1-10 */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ p: 1.5, borderRadius: "6px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            25. Discipline (1–10):
                          </Typography>
                          <Chip label={`${tradeForm.disciplineRating}/10`} size="small" sx={{ fontWeight: 800, bgcolor: "#10B981", color: "#FFF", height: 20 }} />
                        </Box>
                        <Slider
                          value={tradeForm.disciplineRating}
                          min={1}
                          max={10}
                          step={1}
                          marks
                          valueLabelDisplay="auto"
                          onChange={(_, val) => updateTradeField("disciplineRating", val as number)}
                        />
                      </Box>
                    </Grid>

                    {/* 26. Mistake? */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", p: 1.5, borderRadius: "6px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          26. Mistake?
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={tradeForm.mistakeFlag}
                              onChange={(e) => updateTradeField("mistakeFlag", e.target.checked)}
                              color="error"
                            />
                          }
                          label={tradeForm.mistakeFlag ? "YES" : "NO"}
                        />
                      </Box>
                    </Grid>

                    {/* 27. Mistake Type */}
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>27. Mistake Type</InputLabel>
                        <Select
                          value={tradeForm.mistakeType}
                          label="27. Mistake Type"
                          disabled={!tradeForm.mistakeFlag}
                          onChange={(e) => updateTradeField("mistakeType", e.target.value)}
                        >
                          <MenuItem value="None / Followed Plan">None / Followed Plan</MenuItem>
                          <MenuItem value="Early Entry before Trigger">Early Entry before Trigger</MenuItem>
                          <MenuItem value="Chased Trade / FOMO">Chased Trade / FOMO</MenuItem>
                          <MenuItem value="Moved / Widened SL">Moved / Widened SL</MenuItem>
                          <MenuItem value="Overleveraged / Heavy Size">Overleveraged / Heavy Size</MenuItem>
                          <MenuItem value="Exited Early out of Fear">Exited Early out of Fear</MenuItem>
                          <MenuItem value="Revenge Trade">Revenge Trade</MenuItem>
                          <MenuItem value="Traded Outside Rules">Traded Outside Rules</MenuItem>
                          <MenuItem value="Ignored Market Trend">Ignored Market Trend</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>

                {/* ======================================================== */}
                {/* SECTION 5: MARKET CONTEXT & NOTES (Fields 28 - 31)       */}
                {/* ======================================================== */}
                <Paper
                  sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: "6px",
                    bgcolor: isDark ? "#070B16" : "#F8FAFC",
                    border: isDark ? "1px solid rgba(6, 182, 212, 0.2)" : "1px solid #E2E8F0",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#06B6D4", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <Box component="span" sx={{ bgcolor: "#0891B2", color: "#FFF", px: 0.8, py: 0.1, borderRadius: "4px", fontSize: "0.7rem" }}>
                      PART 5
                    </Box>
                    Market Context & Retrospective Journal (Fields 28 – 31)
                  </Typography>

                  <Grid container spacing={2}>
                    {/* 28. Market Condition */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>28. Market Condition</InputLabel>
                        <Select
                          value={tradeForm.marketCondition}
                          label="28. Market Condition"
                          onChange={(e) => updateTradeField("marketCondition", e.target.value)}
                        >
                          <MenuItem value="Strong Trending Up ↗">Strong Trending Up ↗</MenuItem>
                          <MenuItem value="Strong Trending Down ↘">Strong Trending Down ↘</MenuItem>
                          <MenuItem value="Range-Bound / Choppy ↔">Range-Bound / Choppy ↔</MenuItem>
                          <MenuItem value="High Volatility / News Event ⚡">High Volatility / News Event ⚡</MenuItem>
                          <MenuItem value="Low Volume Consolidation 💤">Low Volume Consolidation 💤</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* 30. Exit Reason */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="30. Exit Reason"
                        value={tradeForm.exitReason}
                        onChange={(e) => updateTradeField("exitReason", e.target.value)}
                        placeholder="e.g. Hit Take Profit, Trailing SL, Manual Early Exit"
                      />
                    </Grid>

                    {/* 29. Entry Reason */}
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        label="29. Entry Reason"
                        value={tradeForm.entryReason}
                        onChange={(e) => updateTradeField("entryReason", e.target.value)}
                        placeholder="Exact technical rationale: what market structure, candle pattern, or liquidity sweep triggered this trade?"
                      />
                    </Grid>

                    {/* 31. Notes */}
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        label="31. Notes / Lessons Learned"
                        value={tradeForm.notes}
                        onChange={(e) => updateTradeField("notes", e.target.value)}
                        placeholder="Key reflections, psychological lessons, and what you would do differently next time..."
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Form Action Summary & Submit */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "6px",
                    bgcolor: isDark ? "#0E162B" : "#EFF6FF",
                    border: isDark ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid #BFDBFE",
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    alignItems: { xs: "flex-start", sm: "center" },
                    gap: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      Live Preview:
                    </Typography>
                    <Chip label={`${tradeForm.symbol} • ${tradeForm.direction}`} size="small" sx={{ fontWeight: 700 }} />
                    <Chip label={`Risk: ₹${tradeForm.plannedRiskAmount || "0"}`} size="small" sx={{ fontWeight: 700, bgcolor: "rgba(239,68,68,0.15)", color: "#EF4444" }} />
                    {tradeForm.netPnl !== "" && (
                      <Chip
                        label={`P&L: ${Number(tradeForm.netPnl) >= 0 ? "+" : ""}₹${tradeForm.netPnl} (${tradeForm.actualRR})`}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          bgcolor: Number(tradeForm.netPnl) >= 0 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                          color: Number(tradeForm.netPnl) >= 0 ? "#10B981" : "#EF4444",
                        }}
                      />
                    )}
                    <Chip label={`Result: ${tradeForm.result}`} size="small" sx={{ fontWeight: 700 }} />
                  </Box>

                  <Box sx={{ display: "flex", gap: 1.5 }}>
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
                        bgcolor: "#10B981",
                        color: "#FFFFFF",
                        borderRadius: "6px",
                        px: 3,
                        fontWeight: 800,
                        "&:hover": { bgcolor: "#059669" },
                      }}
                    >
                      {submittingTrade ? "Saving 31 Fields..." : "Submit Trade (31 Fields)"}
                    </Button>
                  </Box>
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
                      <th>#</th>
                      <th>Date & Time</th>
                      <th>Symbol</th>
                      <th>Market</th>
                      <th>Direction</th>
                      <th>Entry</th>
                      <th>Exit</th>
                      <th>Lots</th>
                      <th>SL/TP Pts</th>
                      <th>Risk ₹</th>
                      <th>P&L ₹</th>
                      <th>Actual R</th>
                      <th>Result</th>
                      <th>Mistake?</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrades.length === 0 ? (
                      <tr>
                        <td colSpan={15} style={{ textAlign: "center", padding: "32px" }}>
                          <Typography variant="body2" sx={{ color: isDark ? "#64748B" : "#94A3B8" }}>
                            No trades matching current filters
                          </Typography>
                        </td>
                      </tr>
                    ) : (
                      filteredTrades.map((t) => (
                        <tr key={t.id}>
                          <td>
                            <Chip
                              label={`#${t.trade_num || t.id.slice(-3)}`}
                              size="small"
                              sx={{ height: 20, fontSize: "0.68rem", fontWeight: 800, bgcolor: "rgba(59, 130, 246, 0.15)", color: "#3B82F6" }}
                            />
                          </td>
                          <td>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.78rem" }}>
                              {new Date(t.opened_at).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: "0.68rem" }}>
                              {new Date(t.opened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </Typography>
                          </td>
                          <td>
                            <strong>{t.symbol}</strong>
                          </td>
                          <td>
                            <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                              {t.market || "Indices"}
                            </Typography>
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
                          <td>{t.entry_price}</td>
                          <td>{t.exit_price ?? "-"}</td>
                          <td>{t.volume ?? "1"}</td>
                          <td>
                            <Typography variant="caption" sx={{ display: "block", color: "#F59E0B" }}>
                              SL: {t.sl_points ?? (t.stop_loss ? Math.abs(t.entry_price - t.stop_loss).toFixed(1) : "-")}
                            </Typography>
                            <Typography variant="caption" sx={{ display: "block", color: "#10B981" }}>
                              TP: {t.tp_points ?? (t.take_profit ? Math.abs(t.take_profit - t.entry_price).toFixed(1) : "-")}
                            </Typography>
                          </td>
                          <td>₹{t.planned_risk_amount ?? "-"}</td>
                          <td>
                            {t.status === "CLOSED" && t.net_pnl !== null && t.net_pnl !== undefined ? (
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 800,
                                  color: t.net_pnl >= 0 ? "#10B981" : "#EF4444",
                                }}
                              >
                                {t.net_pnl >= 0 ? `+₹${t.net_pnl}` : `-₹${Math.abs(t.net_pnl)}`}
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
                            <Chip
                              label={t.result || (t.net_pnl !== null && t.net_pnl !== undefined ? (t.net_pnl > 0 ? "WIN" : t.net_pnl < 0 ? "LOSS" : "BE") : "OPEN")}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 800,
                                bgcolor:
                                  t.result === "WIN" || (t.net_pnl && t.net_pnl > 0)
                                    ? "rgba(16, 185, 129, 0.15)"
                                    : t.result === "LOSS" || (t.net_pnl && t.net_pnl < 0)
                                    ? "rgba(239, 68, 68, 0.15)"
                                    : "rgba(245, 158, 11, 0.15)",
                                color:
                                  t.result === "WIN" || (t.net_pnl && t.net_pnl > 0)
                                    ? "#10B981"
                                    : t.result === "LOSS" || (t.net_pnl && t.net_pnl < 0)
                                    ? "#EF4444"
                                    : "#F59E0B",
                              }}
                            />
                          </td>
                          <td>
                            <Chip
                              label={t.mistake_flag ? "YES" : "NO"}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                bgcolor: t.mistake_flag ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                                color: t.mistake_flag ? "#EF4444" : "#10B981",
                              }}
                            />
                          </td>
                          <td>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setSelectedTrade(t)}
                              sx={{ fontSize: "0.72rem", textTransform: "none", py: 0.3, px: 1, borderRadius: "4px" }}
                            >
                              31 Fields
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
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: isDark ? "#0E162B" : "#FFFFFF",
              borderRadius: "8px",
              border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0",
              p: 2,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BookIcon sx={{ color: "#3B82F6" }} />
            Trade #{selectedTrade?.trade_num || selectedTrade?.id.slice(-4)}: {selectedTrade?.symbol} ({selectedTrade?.direction})
          </Box>
          <Chip
            label={selectedTrade?.result || (selectedTrade?.net_pnl && selectedTrade.net_pnl > 0 ? "WIN" : "LOSS")}
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: (selectedTrade?.net_pnl || 0) >= 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
              color: (selectedTrade?.net_pnl || 0) >= 0 ? "#10B981" : "#EF4444",
            }}
          />
        </DialogTitle>
        <DialogContent dividers>
          {selectedTrade && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {/* Part 1: Trade Setup & Execution (Fields 1-8) */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1 }}>
                  PART 1 — Trade Setup & Execution (Fields 1 – 8)
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>1. Trade #:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>#{selectedTrade.trade_num || "1"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>2. Date:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{new Date(selectedTrade.opened_at).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>3. Time:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{new Date(selectedTrade.opened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>4. Symbol:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "#3B82F6" }}>{selectedTrade.symbol}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>5. Market:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.market || "Indian Indices"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>6. Direction:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: selectedTrade.direction === "BUY" ? "#10B981" : "#EF4444" }}>
                      {selectedTrade.direction}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>7. Strategy / Setup:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.strategy_name || "SMC Order Block"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>8. Session:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.session || "Morning Opening"}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Part 2: Price Levels & Sizing (Fields 9-13) */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1 }}>
                  PART 2 — Price Levels & Sizing (Fields 9 – 13)
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>9. Entry:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedTrade.entry_price}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>10. Stop Loss (SL):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#EF4444" }}>{selectedTrade.stop_loss ?? "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>11. Take Profit (TP):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#10B981" }}>{selectedTrade.take_profit ?? "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>12. Exit Price:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedTrade.exit_price ?? "OPEN"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>13. Lots / Quantity:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedTrade.volume ?? "1"}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Part 3: Risk & Financial Engine (Fields 14-20) */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#D97706", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1 }}>
                  PART 3 — Risk, Reward & Financial Engine (Fields 14 – 20)
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6, sm: 1.7 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>14. Risk ₹:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#EF4444" }}>₹{selectedTrade.planned_risk_amount ?? "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.7 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>15. SL Points:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.sl_points ?? (selectedTrade.stop_loss ? Math.abs(selectedTrade.entry_price - selectedTrade.stop_loss).toFixed(1) : "-")}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.7 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>16. TP Points:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.tp_points ?? (selectedTrade.take_profit ? Math.abs(selectedTrade.take_profit - selectedTrade.entry_price).toFixed(1) : "-")}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.7 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>17. Planned R:R:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedTrade.planned_rr_ratio ? `1 : ${selectedTrade.planned_rr_ratio}` : "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>18. Realized P&L ₹:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 900, color: (selectedTrade.net_pnl || 0) >= 0 ? "#10B981" : "#EF4444" }}>
                      {(selectedTrade.net_pnl || 0) >= 0 ? `+₹${selectedTrade.net_pnl}` : `-₹${Math.abs(selectedTrade.net_pnl || 0)}`}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.6 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>19. Actual R:R:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "#8B5CF6" }}>{selectedTrade.actual_r ? `${selectedTrade.actual_r}R` : "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.6 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>20. Result:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: (selectedTrade.net_pnl || 0) >= 0 ? "#10B981" : "#EF4444" }}>
                      {selectedTrade.result || ((selectedTrade.net_pnl || 0) > 0 ? "WIN" : "LOSS")}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Part 4: Psychology & Mindset (Fields 21-27) */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#8B5CF6", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1 }}>
                  PART 4 — Trading Psychology & Mindset (Fields 21 – 27)
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>21. Emotion Before:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.emotion_before || "Calm & Focused"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>22. Emotion During:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.emotion_during || "Focused"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>23. Emotion After:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.emotion_after || "Satisfied"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.5 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>24. Conf (1-10):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#38BDF8" }}>{selectedTrade.confidence_rating || 8}/10</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.5 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>25. Disc (1-10):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#10B981" }}>{selectedTrade.discipline_rating || 8}/10</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>26. Mistake?:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: selectedTrade.mistake_flag ? "#EF4444" : "#10B981" }}>
                      {selectedTrade.mistake_flag ? "YES" : "NO"}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>27. Mistake Type:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: selectedTrade.mistake_flag ? "#EF4444" : "text.primary" }}>
                      {selectedTrade.mistake_type || (selectedTrade.mistake_flag ? "Execution Error" : "None / Followed Plan")}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Part 5: Context & Retrospective (Fields 28-31) */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#06B6D4", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1 }}>
                  PART 5 — Market Context & Retrospective Journal (Fields 28 – 31)
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>28. Market Condition:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.market_condition || "Strong Trending Up"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>30. Exit Reason:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.exit_reason || "Hit Take Profit Target"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>29. Entry Reason:</Typography>
                    <Typography variant="body2" sx={{ fontStyle: "italic", bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", p: 1, borderRadius: "4px" }}>
                      {selectedTrade.entry_reason || "Order block reaction with high volume expansion."}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>31. Notes / Lessons Learned:</Typography>
                    <Typography variant="body2" sx={{ bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", p: 1, borderRadius: "4px" }}>
                      {selectedTrade.notes || selectedTrade.lessons_learned || "Followed trading rules strictly without hesitation."}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTrade(null)} variant="contained" sx={{ borderRadius: "6px", px: 3 }}>
            Close Inspection
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
