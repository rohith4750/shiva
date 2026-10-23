"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
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
  Snackbar,
  Alert,
  FormControlLabel,
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
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  MenuBook as BookIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useColorMode } from "@/components/ThemeRegistry";
import { TradeRecord } from "@/lib/tradingAnalytics";
import AdvancedTradingDashboard from "./AdvancedTradingDashboard";
import WaveAnalyticsView from "./WaveAnalyticsView";
import AnalyticsView from "./AnalyticsView";

export const TRADING_SYMBOLS = [
  "XAUUSD",
  "XAGUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "USDINR",
  "BTCUSD",
  "ETHUSD",
  "NIFTY",
  "BANKNIFTY",
  "NASDAQ",
  "S&P500",
] as const;

export const ENTRY_EMOTIONS = [
  "Calm",
  "Confident",
  "Neutral",
  "Excited",
  "Fearful",
  "Anxious",
  "FOMO",
  "Greedy",
  "Angry",
  "Revenge",
] as const;

export const EXIT_EMOTIONS = [
  "Satisfied",
  "Regretful",
  "Frustrated",
  "Relieved",
  "Disappointed",
  "Proud",
] as const;

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

  // --- OVERVIEW TIMEFRAME FILTERS ---
  const [overviewPeriod, setOverviewPeriod] = useState<"all" | "day" | "week" | "month" | "year" | "custom">("all");
  const [overviewDay, setOverviewDay] = useState<string>(new Date().toISOString().slice(0, 10));
  const [overviewStartDate, setOverviewStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [overviewEndDate, setOverviewEndDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // --- OVERVIEW VIEW MODE: "advanced" (Excel Dashboard) vs "wave" (Spline Wave & Streams) ---
  const [overviewViewMode, setOverviewViewMode] = useState<"advanced" | "wave">("advanced");

  // --- OVERVIEW WAVE & SINE CHART STATE ---

  // --- ACCOUNTS CRUD STATE ---
  const [accountDialogOpen, setAccountDialogOpen] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [accountForm, setAccountForm] = useState({
    name: "",
    accountType: "demo",
    currency: "USD",
    startingBalance: "10000",
    description: "",
  });
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState<boolean>(false);
  const [accountToDelete, setAccountToDelete] = useState<any | null>(null);
  const [accountActionLoading, setAccountActionLoading] = useState<boolean>(false);

  const handleOpenCreateAccount = () => {
    setEditingAccount(null);
    setAccountForm({
      name: "",
      accountType: "demo",
      currency: "USD",
      startingBalance: "10000",
      description: "",
    });
    setAccountDialogOpen(true);
  };

  const handleOpenEditAccount = (acc: any) => {
    setEditingAccount(acc);
    setAccountForm({
      name: acc.name,
      accountType: acc.account_type || "demo",
      currency: acc.currency || "USD",
      startingBalance: String(acc.starting_balance || 10000),
      description: acc.description || "",
    });
    setAccountDialogOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!accountForm.name.trim()) {
      showToast("Account name is required", "error");
      return;
    }
    setAccountActionLoading(true);
    try {
      if (editingAccount) {
        const res = await fetch("/api/journal/accounts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingAccount.id,
            name: accountForm.name,
            accountType: accountForm.accountType,
            currency: accountForm.currency,
            startingBalance: parseFloat(accountForm.startingBalance) || 10000,
            description: accountForm.description,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Account updated successfully!", "success");
          setAccountDialogOpen(false);
          fetchJournalData();
        } else {
          showToast(data.error || "Failed to update account", "error");
        }
      } else {
        const res = await fetch("/api/journal/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: accountForm.name,
            accountType: accountForm.accountType,
            currency: accountForm.currency,
            startingBalance: parseFloat(accountForm.startingBalance) || 10000,
            description: accountForm.description,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Account created successfully!", "success");
          setAccountDialogOpen(false);
          fetchJournalData();
        } else {
          showToast(data.error || "Failed to create account", "error");
        }
      }
    } catch {
      showToast("Server error while saving account", "error");
    } finally {
      setAccountActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    setAccountActionLoading(true);
    try {
      const res = await fetch(`/api/journal/accounts?id=${accountToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Account deleted successfully!", "success");
        setDeleteAccountDialogOpen(false);
        setAccountToDelete(null);
        if (selectedAccountId === accountToDelete.id) {
          setSelectedAccountId("all");
        }
        fetchJournalData();
      } else {
        showToast(data.error || "Failed to delete account", "error");
      }
    } catch {
      showToast("Server error deleting account", "error");
    } finally {
      setAccountActionLoading(false);
    }
  };

  // --- TRADE ENTRY FORM STATE ---
  const [tradeForm, setTradeForm] = useState({
    // 1. Trade #
    tradeNum: "6",
    // 2. Date
    tradeDate: "",
    // 3. Time
    tradeTime: "09:25",
    // 4. Symbol
    symbol: "XAUUSD",
    // 6. Direction (BUY or SELL only)
    direction: "BUY",
    // 7. Strategy/Setup
    strategyId: "",
    customStrategy: "",
    // 8. Session
    session: "Morning Opening (9:15-11:00)",
    // 9. Entry Price
    entryPrice: "2350.50",
    // 10. SL Price
    stopLoss: "2340.00",
    // 11. TP Price
    takeProfit: "2375.00",
    // 12. Exit Price
    exitPrice: "2370.00",
    // 13. Lots / Quantity
    volume: "1",
    // 14. Risk
    plannedRiskAmount: "1050",
    // 15. SL Points
    slPoints: "10.50",
    // 16. TP Points
    tpPoints: "24.50",
    // 17. Planned R:R
    plannedRR: "1 : 2.33",
    // 18. P&L
    netPnl: "1950",
    // 19. Actual R:R
    actualRR: "+1.86R",
    // 20. Result
    result: "WIN",
    // 21. Emotion Before (Entry Emotion)
    emotionBefore: "Calm",
    // 23. Emotion After (Exit Emotion)
    emotionAfter: "Satisfied",
    // 24. Confidence (1–5)
    confidenceRating: 5,
    // 25. Discipline (1–5)
    disciplineRating: 5,
    // 26. Mistake?
    mistakeFlag: false,
    // 27. Mistake Type
    mistakeType: "None / Followed Plan",
    customMistake: "",
    // 28. Market Condition
    marketCondition: "Strong Trending Up ↗",
    // 29. Entry Reason
    entryReason: "Liquidity sweep at support with order flow confirmation.",
    // 30. Exit Reason
    exitReason: "Hit Take Profit Target",
    // 31. Notes
    notes: "Clean trade execution following rules without hesitation.",

    accountId: "",
    status: "CLOSED",
  });

  // Auto-Calculation helper for single form
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

      // 14. Risk (auto calculate: SL Points * Lots if not manually overriding)
      if (!isNaN(numSl) && !isNaN(lots) && field !== "plannedRiskAmount") {
        next.plannedRiskAmount = (numSl * lots).toFixed(0);
      }

      // 18. P&L & 19. Actual R:R & 20. Result
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

      // Mistake Sync
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
        strategyId: tradeForm.strategyId === "other" ? null : (tradeForm.strategyId || null),
        customStrategy: tradeForm.strategyId === "other" ? tradeForm.customStrategy : null,
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
        tradeNum: tradeForm.tradeNum ? Number(tradeForm.tradeNum) : null,
        session: tradeForm.session,
        slPoints: tradeForm.slPoints ? Number(tradeForm.slPoints) : null,
        tpPoints: tradeForm.tpPoints ? Number(tradeForm.tpPoints) : null,
        marketCondition: tradeForm.marketCondition,
        result: tradeForm.result,
        entryReason: tradeForm.entryReason,
        exitReason: tradeForm.exitReason,
        emotionBefore: tradeForm.emotionBefore,
        emotionAfter: tradeForm.emotionAfter,
        confidenceRating: Number(tradeForm.confidenceRating),
        disciplineRating: Number(tradeForm.disciplineRating),
        ruleAdherence: !tradeForm.mistakeFlag,
        mistakeFlag: Boolean(tradeForm.mistakeFlag),
        mistakeType: tradeForm.mistakeType === "Other" ? (tradeForm.customMistake || "Other") : tradeForm.mistakeType,
        customMistake: tradeForm.mistakeType === "Other" ? tradeForm.customMistake : null,
        mistakes: tradeForm.mistakeFlag ? (tradeForm.mistakeType === "Other" ? tradeForm.customMistake : tradeForm.mistakeType) : "None",
        lessonsLearned: tradeForm.notes,
      };

      const res = await fetch("/api/journal/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Trade recorded in PostgreSQL successfully!", "success");
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

  // --- OVERVIEW ANALYTICS COMPUTATION ---
  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  const activeCurrencySymbol = activeAccount?.currency === "INR" ? "₹" : "$";
  const activeStartingBalance = activeAccount ? Number(activeAccount.starting_balance) : 10000;

  // Trades for the selected account only (Analytics tab applies its own period filter)
  const accountTrades = useMemo(
    () => (selectedAccountId === "all" ? trades : trades.filter((t) => t.account_id === selectedAccountId)),
    [trades, selectedAccountId]
  );

  const overviewFilteredTrades = useMemo(() => {
    let list = trades;
    if (selectedAccountId !== "all") {
      list = list.filter((t) => t.account_id === selectedAccountId);
    }

    if (overviewPeriod === "all") return list;

    const now = new Date();
    if (overviewPeriod === "day") {
      const targetDay = overviewDay || now.toISOString().slice(0, 10);
      return list.filter((t) => {
        const d = new Date(t.opened_at).toISOString().slice(0, 10);
        return d === targetDay;
      });
    }

    if (overviewPeriod === "week") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return list.filter((t) => new Date(t.opened_at) >= sevenDaysAgo);
    }

    if (overviewPeriod === "month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return list.filter((t) => new Date(t.opened_at) >= monthStart);
    }

    if (overviewPeriod === "year") {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return list.filter((t) => new Date(t.opened_at) >= yearStart);
    }

    if (overviewPeriod === "custom") {
      const start = overviewStartDate ? new Date(`${overviewStartDate}T00:00:00`) : new Date(0);
      const end = overviewEndDate ? new Date(`${overviewEndDate}T23:59:59`) : new Date();
      return list.filter((t) => {
        const d = new Date(t.opened_at);
        return d >= start && d <= end;
      });
    }

    return list;
  }, [trades, selectedAccountId, overviewPeriod, overviewDay, overviewStartDate, overviewEndDate]);

  // Single source of truth for every journal tab: nav label, icon and page header
  const journalTabs: {
    label: string;
    badge?: string | number;
    icon: React.ReactElement;
    color: string;
  }[] = [
    { label: "Dashboard", icon: <DashboardIcon />, color: "#38BDF8" },
    { label: "Add Trade", icon: <AddTradeIcon />, color: "#10B981" },
    { label: "History", badge: trades.length, icon: <HistoryIcon />, color: "#818CF8" },
    { label: "Calendar", icon: <CalendarIcon />, color: "#F59E0B" },
    { label: "Analytics", icon: <AnalyticsIcon />, color: "#22D3EE" },
    { label: "Psychology", icon: <PsychologyIcon />, color: "#A78BFA" },
    { label: "Accounts", badge: accounts.length, icon: <AccountsIcon />, color: "#10B981" },
  ];

  return (
    <Box
      sx={{
        minHeight: "100%",
        bgcolor: "transparent",
        color: isDark ? "#F8FAFC" : "#0F172A",
        pb: 2,
      }}
    >
      {/* ============================================================== */}
      {/* NAVIGATION COMMAND BAR (TABS + ACCOUNT CONTROLS) & PAGE HEADER */}
      {/* ============================================================== */}
      <Box sx={{ px: { xs: 0.8, sm: 1.2, md: 1.5 }, pt: 1, display: "flex", flexDirection: "column", gap: 1.4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
            borderBottom: isDark ? "1px solid rgba(148, 163, 184, 0.16)" : "1px solid #E2E8F0",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: 44,
              "& .MuiTabs-flexContainer": { gap: 0.5 },
              "& .MuiTabs-scrollButtons.Mui-disabled": { opacity: 0.3 },
              "& .MuiTab-root": {
                minHeight: 44,
                py: 0,
                px: 1.4,
                fontSize: "0.82rem",
                fontWeight: 500,
                textTransform: "none",
                color: isDark ? "#94A3B8" : "#64748B",
                transition: "color 0.15s ease",
                "& .MuiTab-iconWrapper": { fontSize: 17, mr: 0.8 },
                "& .tab-badge": {
                  ml: 0.7,
                  px: 0.6,
                  borderRadius: "8px",
                  fontSize: "0.66rem",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 500,
                  lineHeight: 1.5,
                  bgcolor: isDark ? "rgba(148, 163, 184, 0.14)" : "#F1F5F9",
                  color: isDark ? "#94A3B8" : "#64748B",
                },
                "&:hover": { color: isDark ? "#E2E8F0" : "#0B1220" },
                "&.Mui-selected": { color: isDark ? "#F8FAFC" : "#0B1220", fontWeight: 600 },
              },
              // Single underline under the active tab
              "& .MuiTabs-indicator": {
                height: 2,
                borderRadius: "2px 2px 0 0",
                backgroundColor: isDark ? "#38BDF8" : "#0284C7",
              },
            }}
          >
            {journalTabs.map((t, i) => (
              <Tab
                key={t.label}
                iconPosition="start"
                icon={React.cloneElement(t.icon as React.ReactElement<{ sx?: object }>, {
                  sx: {
                    fontSize: 17,
                    color: activeTab === i ? (isDark ? "#38BDF8" : "#0284C7") : undefined,
                  },
                })}
                label={
                  <Box component="span" sx={{ display: "inline-flex", alignItems: "center" }}>
                    {t.label}
                    {t.badge !== undefined && (
                      <Box component="span" className="tab-badge">
                        {t.badge}
                      </Box>
                    )}
                  </Box>
                }
              />
            ))}
          </Tabs>

          {/* Account selector + refresh */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, pr: 0.4 }}>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <Select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                displayEmpty
                startAdornment={<AccountsIcon sx={{ fontSize: 16, mr: 0.8, color: isDark ? "#38BDF8" : "#0284C7" }} />}
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  height: 34,
                  borderRadius: "9px",
                  bgcolor: isDark ? "rgba(5, 9, 18, 0.6)" : "#F8FAFC",
                  "& .MuiSelect-select": { py: 0.4, pl: 0, pr: 3 },
                }}
              >
                <MenuItem value="all" sx={{ fontSize: "0.78rem" }}>All Accounts ({accounts.length})</MenuItem>
                {accounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id} sx={{ fontSize: "0.78rem" }}>
                    {acc.name} ({acc.currency})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Tooltip title="Refresh data">
              <span>
                <IconButton
                  size="small"
                  onClick={fetchJournalData}
                  disabled={loading}
                  aria-label="Refresh journal data"
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: "9px",
                    border: isDark ? "1px solid rgba(56, 189, 248, 0.14)" : "1px solid #E2E8F0",
                    bgcolor: isDark ? "rgba(5, 9, 18, 0.6)" : "#F8FAFC",
                    color: isDark ? "#38BDF8" : "#0284C7",
                    transition: "all 0.2s ease",
                    "&:hover": { bgcolor: isDark ? "rgba(56, 189, 248, 0.12)" : "#E0F2FE" },
                    "& svg": { transition: "transform 0.4s ease" },
                  }}
                >
                  <RefreshIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </span>
            </Tooltip>

            {activeTab === 6 ? (
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreateAccount} sx={{ height: 34, px: 1.8, fontSize: "0.8rem", fontWeight: 500, borderRadius: "6px", whiteSpace: "nowrap" }}>
                New Account
              </Button>
            ) : activeTab !== 1 ? (
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setActiveTab(1)} sx={{ height: 34, px: 1.8, fontSize: "0.8rem", fontWeight: 500, borderRadius: "6px", whiteSpace: "nowrap" }}>
                Log Trade
              </Button>
            ) : null}
          </Box>
        </Box>
      </Box>

      {/* ============================================================== */}
      {/* MAIN VIEW CONTAINER (100% FULL-WIDTH COMPACT VIEWPORT)         */}
      {/* ============================================================== */}
      <Box key={`tab-${activeTab}`} sx={{ width: "100%", mt: 1, px: { xs: 0.8, sm: 1.2, md: 1.5 }, pb: 1.5, animation: "view-enter 0.35s ease-out both" }}>
        {loading && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}

        {/* ============================================================ */}
        {/* TAB 0: OVERVIEW (DASHBOARD)                                  */}
        {/* ============================================================ */}
        {activeTab === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {/* ============================================================ */}
            {/* OVERVIEW FILTER BAR: Day Wise, Weekly, Monthly, Yearly, Custom */}
            {/* ============================================================ */}
            <Card
              sx={{
                p: 1.2,
                borderRadius: "8px",
                bgcolor: isDark ? "#0A1124" : "#FFFFFF",
                border: isDark ? "1px solid rgba(56, 189, 248, 0.14)" : "1px solid #E2E8F0",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.2,
              }}
            >
              {/* Period Selection Buttons */}
              <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.6 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#64748B", mr: 0.5, fontSize: "0.72rem", textTransform: "uppercase" }}>
                  <FilterIcon sx={{ fontSize: 13, verticalAlign: "middle", mr: 0.4 }} />
                  Filter Period:
                </Typography>
                {[
                  { id: "all", label: "All Time" },
                  { id: "day", label: "Day Wise" },
                  { id: "week", label: "Weekly" },
                  { id: "month", label: "Monthly" },
                  { id: "year", label: "Yearly" },
                  { id: "custom", label: "Custom Date" },
                ].map((p) => (
                  <Chip
                    key={p.id}
                    label={p.label}
                    size="small"
                    clickable
                    onClick={() => setOverviewPeriod(p.id as any)}
                    sx={{
                      fontWeight: overviewPeriod === p.id ? 800 : 600,
                      fontSize: "0.72rem",
                      height: 26,
                      bgcolor:
                        overviewPeriod === p.id
                          ? "#0284C7"
                          : isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "#F1F5F9",
                      color: overviewPeriod === p.id ? "#FFF" : "inherit",
                      border: overviewPeriod === p.id ? "1px solid #38BDF8" : "1px solid transparent",
                      "&:hover": {
                        bgcolor: overviewPeriod === p.id ? "#0369A1" : isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
                      },
                    }}
                  />
                ))}
              </Box>

              {/* Dynamic Contextual Date Inputs */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                {overviewPeriod === "day" && (
                  <TextField
                    size="small"
                    type="date"
                    label="Select Day"
                    value={overviewDay}
                    onChange={(e) => setOverviewDay(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{
                      width: 160,
                      "& .MuiInputBase-root": { height: 30, fontSize: "0.75rem" },
                    }}
                  />
                )}

                {overviewPeriod === "custom" && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <TextField
                      size="small"
                      type="date"
                      label="From Date"
                      value={overviewStartDate}
                      onChange={(e) => setOverviewStartDate(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={{
                        width: 150,
                        "& .MuiInputBase-root": { height: 30, fontSize: "0.75rem" },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>to</Typography>
                    <TextField
                      size="small"
                      type="date"
                      label="To Date"
                      value={overviewEndDate}
                      onChange={(e) => setOverviewEndDate(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={{
                        width: 150,
                        "& .MuiInputBase-root": { height: 30, fontSize: "0.75rem" },
                      }}
                    />
                  </Box>
                )}

                {/* View Mode Toggle: Excel Advanced Dashboard vs Spline Wave View */}
                <Box
                  sx={{
                    display: "flex",
                    p: 0.3,
                    borderRadius: "6px",
                    bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
                    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #CBD5E1",
                  }}
                >
                  <Button
                    size="small"
                    onClick={() => setOverviewViewMode("advanced")}
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      py: 0.2,
                      px: 1.2,
                      height: 24,
                      borderRadius: "5px",
                      textTransform: "none",
                      bgcolor: overviewViewMode === "advanced" ? "#0284C7" : "transparent",
                      color: overviewViewMode === "advanced" ? "#FFF" : "inherit",
                    }}
                  >
                    📊 Advanced Dashboard
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setOverviewViewMode("wave")}
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      py: 0.2,
                      px: 1.2,
                      height: 24,
                      borderRadius: "5px",
                      textTransform: "none",
                      bgcolor: overviewViewMode === "wave" ? "#8B5CF6" : "transparent",
                      color: overviewViewMode === "wave" ? "#FFF" : "inherit",
                    }}
                  >
                    🌊 Wave Analytics
                  </Button>
                </Box>
              </Box>
            </Card>

            {/* CONDITIONAL DASHBOARD VIEW: ADVANCED DASHBOARD (EXCEL STYLE) VS WAVE ANALYTICS */}
            {overviewViewMode === "advanced" ? (
              <AdvancedTradingDashboard
                trades={overviewFilteredTrades}
                currencySymbol={activeCurrencySymbol}
                startingBalance={activeStartingBalance}
                isDark={isDark}
                onSelectTrade={(trade) => setSelectedTrade(trade)}
              />
            ) : (
              <WaveAnalyticsView
                trades={overviewFilteredTrades}
                currencySymbol={activeCurrencySymbol}
                startingBalance={activeStartingBalance}
                isDark={isDark}
                onSelectTrade={(trade) => setSelectedTrade(trade)}
              />
            )}
      </Box>
    )}

        {/* ============================================================ */}
        {/* TAB 1: ADD TRADE (COMPLETE 31-FIELD SINGLE-FORM ENGINE)      */}
        {/* ============================================================ */}
        {activeTab === 1 && (
          <Card
            sx={{
              width: "100%",
              borderRadius: "8px",
              bgcolor: isDark ? "#0A1124" : "#FFFFFF",
              border: isDark ? "1px solid rgba(56, 189, 248, 0.14)" : "1px solid #E2E8F0",
            }}
          >
            <CardContent
              sx={{
                p: { xs: 1.2, sm: 1.5 },
                "&:last-child": { pb: 1.5 },
                "& .MuiInputLabel-root": { fontSize: "0.70rem" },
                "& .MuiInputLabel-root.MuiInputLabel-shrink": { fontSize: "0.72rem" },
                "& .MuiInputBase-root:not(.MuiInputBase-multiline)": {
                  height: 32,
                  fontSize: "0.75rem",
                },
                "& .MuiInputBase-multiline": {
                  fontSize: "0.75rem",
                },
                "& .MuiInputBase-input": {
                  fontSize: "0.75rem",
                  py: 0.5,
                },
                "& .MuiSelect-select": {
                  fontSize: "0.75rem",
                  py: 0.5,
                  display: "flex",
                  alignItems: "center",
                },
                "& .MuiMenuItem-root": {
                  fontSize: "0.75rem",
                },
              }}
            >
              {/* Form Title & Clean Header */}
              <Box sx={{ mb: 1.2, pb: 1, borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: isDark ? "#94A3B8" : "#64748B" }}>
                  New trade entry
                </Typography>

                {/* Account Selection */}
                <FormControl size="small" sx={{ minWidth: 220 }} required>
                  <InputLabel sx={{ fontSize: "0.74rem" }}>Trading Account</InputLabel>
                  <Select
                    value={tradeForm.accountId}
                    label="Trading Account"
                    onChange={(e) => updateTradeField("accountId", e.target.value)}
                    sx={{ fontSize: "0.76rem", height: 32 }}
                  >
                    {accounts.map((a) => (
                      <MenuItem key={a.id} value={a.id} sx={{ fontSize: "0.75rem" }}>
                        {a.name} ({a.account_type.toUpperCase()} - {a.currency})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <form onSubmit={handleCreateTrade}>
                <Grid container spacing={1.5}>
                  {/* ============================================================ */}
                  {/* LEFT COLUMN: SETUP, PRICING & FINANCIAL ENGINE (PARTS 1, 2, 3) */}
                  {/* ============================================================ */}
                  <Grid size={{ xs: 12, lg: 6 }} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {/* SECTION 1: TRADE SETUP & EXECUTION */}
                    <Paper
                      sx={{
                        p: 1.2,
                        borderRadius: "8px",
                        bgcolor: isDark ? "#050912" : "#F8FAFC",
                        border: isDark ? "1px solid rgba(56, 189, 248, 0.2)" : "1px solid #E2E8F0",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#38BDF8", mb: 0.9, display: "flex", alignItems: "center", gap: 0.8, fontSize: "0.78rem" }}>
                        <Box component="span" sx={{ bgcolor: "#0284C7", color: "#FFF", px: 0.6, py: 0.1, borderRadius: "4px", fontSize: "0.62rem" }}>
                          PART 1
                        </Box>
                        Trade Setup & Execution
                      </Typography>

                      <Grid container spacing={1.2}>
                        {/* 1. Trade # */}
                        <Grid size={{ xs: 6, sm: 3 }}>
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
                        <Grid size={{ xs: 6, sm: 5 }}>
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
                        <Grid size={{ xs: 12, sm: 4 }}>
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

                        {/* 4. Symbol (Dropdown with 12 preset values) */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth size="small" required>
                            <InputLabel>4. Symbol</InputLabel>
                            <Select
                              value={tradeForm.symbol}
                              label="4. Symbol"
                              onChange={(e) => updateTradeField("symbol", e.target.value)}
                            >
                              {TRADING_SYMBOLS.map((sym) => (
                                <MenuItem key={sym} value={sym} sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                                  {sym}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        {/* 5. Direction (ONLY BUY and SELL) */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>5. Direction</InputLabel>
                            <Select
                              value={tradeForm.direction}
                              label="5. Direction"
                              onChange={(e) => updateTradeField("direction", e.target.value)}
                            >
                              <MenuItem value="BUY" sx={{ color: "#10B981", fontWeight: 600, fontSize: "0.75rem" }}>BUY</MenuItem>
                              <MenuItem value="SELL" sx={{ color: "#EF4444", fontWeight: 600, fontSize: "0.75rem" }}>SELL</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        {/* 6. Strategy / Setup (with Other manual text input option) */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>6. Strategy / Setup</InputLabel>
                            <Select
                              value={tradeForm.strategyId}
                              label="6. Strategy / Setup"
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
                              <MenuItem value="other" sx={{ fontWeight: 600, color: "#38BDF8" }}>
                                + Other (Enter Details Manually)
                              </MenuItem>
                            </Select>
                          </FormControl>
                          {tradeForm.strategyId === "other" && (
                            <TextField
                              fullWidth
                              size="small"
                              label="Custom Strategy Details"
                              placeholder="Describe your strategy manually..."
                              value={tradeForm.customStrategy}
                              onChange={(e) => updateTradeField("customStrategy", e.target.value)}
                              required
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Grid>

                        {/* 7. Session */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>7. Session</InputLabel>
                            <Select
                              value={tradeForm.session}
                              label="7. Session"
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
                    {/* SECTION 2: PRICE LEVELS & SIZING          */}
                    {/* ======================================================== */}
                    <Paper
                      sx={{
                        p: 1.2,
                        borderRadius: "8px",
                        bgcolor: isDark ? "#050912" : "#F8FAFC",
                        border: isDark ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid #E2E8F0",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#10B981", mb: 0.9, display: "flex", alignItems: "center", gap: 0.8, fontSize: "0.78rem" }}>
                        <Box component="span" sx={{ bgcolor: "#059669", color: "#FFF", px: 0.6, py: 0.1, borderRadius: "4px", fontSize: "0.62rem" }}>
                          PART 2
                        </Box>
                        Price Levels & Position Sizing
                      </Typography>

                      <Grid container spacing={1.2}>
                        {/* 9. Entry */}
                        <Grid size={{ xs: 12, sm: 4 }}>
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
                        <Grid size={{ xs: 12, sm: 4 }}>
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
                        <Grid size={{ xs: 12, sm: 4 }}>
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
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="12. Exit Price"
                            type="number"
                            value={tradeForm.exitPrice}
                            onChange={(e) => updateTradeField("exitPrice", e.target.value)}
                            placeholder="Blank if OPEN"
                          />
                        </Grid>

                        {/* 13. Lots / Quantity */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="13. Lots / Quantity"
                            type="number"
                            value={tradeForm.volume}
                            onChange={(e) => updateTradeField("volume", e.target.value)}
                            placeholder="e.g. 50"
                          />
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* ======================================================== */}
                    {/* SECTION 3: RISK & FINANCIAL ENGINE      */}
                    {/* ======================================================== */}
                    <Paper
                      sx={{
                        p: 1.2,
                        flex: 1,
                        borderRadius: "8px",
                        bgcolor: isDark ? "rgba(245, 158, 11, 0.04)" : "#FFFBEB",
                        border: isDark ? "1px solid rgba(245, 158, 11, 0.25)" : "1px solid #FDE68A",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#D97706", mb: 0.9, display: "flex", alignItems: "center", gap: 0.8, fontSize: "0.78rem" }}>
                        <Box component="span" sx={{ bgcolor: "#D97706", color: "#FFF", px: 0.6, py: 0.1, borderRadius: "4px", fontSize: "0.62rem" }}>
                          PART 3
                        </Box>
                        Risk, Reward & Auto-Calculated Financials
                      </Typography>

                      <Grid container spacing={1.2}>
                        {/* 14. Risk */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label={`14. Planned Risk (${activeCurrencySymbol})`}
                            type="number"
                            value={tradeForm.plannedRiskAmount}
                            onChange={(e) => updateTradeField("plannedRiskAmount", e.target.value)}
                            slotProps={{ input: { startAdornment: <InputAdornment position="start"><span style={{ fontSize: "0.75rem" }}>{activeCurrencySymbol}</span></InputAdornment> } }}
                          />
                        </Grid>

                        {/* 15. SL Points */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="15. SL Points (Auto)"
                            value={tradeForm.slPoints}
                            onChange={(e) => updateTradeField("slPoints", e.target.value)}
                            placeholder="Auto |Entry - SL|"
                          />
                        </Grid>

                        {/* 16. TP Points */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="16. TP Points (Auto)"
                            value={tradeForm.tpPoints}
                            onChange={(e) => updateTradeField("tpPoints", e.target.value)}
                            placeholder="Auto |TP - Entry|"
                          />
                        </Grid>

                        {/* 17. Planned R:R */}
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="17. Planned R:R (Auto)"
                            value={tradeForm.plannedRR}
                            onChange={(e) => updateTradeField("plannedRR", e.target.value)}
                          />
                        </Grid>

                        {/* 18. P&L */}
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label={`18. Net P&L (${activeCurrencySymbol})`}
                            type="number"
                            value={tradeForm.netPnl}
                            onChange={(e) => updateTradeField("netPnl", e.target.value)}
                            slotProps={{ input: { startAdornment: <InputAdornment position="start"><span style={{ fontSize: "0.75rem" }}>{activeCurrencySymbol}</span></InputAdornment> } }}
                          />
                        </Grid>

                        {/* 19. Actual R:R */}
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="19. Actual R:R (Auto)"
                            value={tradeForm.actualRR}
                            onChange={(e) => updateTradeField("actualRR", e.target.value)}
                          />
                        </Grid>

                        {/* 20. Result */}
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>20. Result</InputLabel>
                            <Select
                              value={tradeForm.result}
                              label="20. Result"
                              onChange={(e) => updateTradeField("result", e.target.value)}
                            >
                              <MenuItem value="WIN" sx={{ color: "#10B981", fontWeight: 600, fontSize: "0.75rem" }}>WIN</MenuItem>
                              <MenuItem value="LOSS" sx={{ color: "#EF4444", fontWeight: 600, fontSize: "0.75rem" }}>LOSS</MenuItem>
                              <MenuItem value="BREAK_EVEN" sx={{ color: "#64748B", fontWeight: 600, fontSize: "0.75rem" }}>BREAK_EVEN</MenuItem>
                              <MenuItem value="OPEN" sx={{ color: "#F59E0B", fontWeight: 600, fontSize: "0.75rem" }}>OPEN</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* ============================================================ */}
                  {/* RIGHT COLUMN: PSYCHOLOGY & MARKET CONTEXT (PARTS 4, 5)        */}
                  {/* ============================================================ */}
                  <Grid size={{ xs: 12, lg: 6 }} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {/* SECTION 4: PSYCHOLOGY & DISCIPLINE */}
                    <Paper
                      sx={{
                        p: 1.2,
                        borderRadius: "8px",
                        bgcolor: isDark ? "#050912" : "#F8FAFC",
                        border: isDark ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid #E2E8F0",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#8B5CF6", mb: 0.9, display: "flex", alignItems: "center", gap: 0.8, fontSize: "0.78rem" }}>
                        <Box component="span" sx={{ bgcolor: "#7C3AED", color: "#FFF", px: 0.6, py: 0.1, borderRadius: "4px", fontSize: "0.62rem" }}>
                          PART 4
                        </Box>
                        Trading Psychology & Mindset
                      </Typography>

                      <Grid container spacing={1.2}>
                        {/* 21. Entry Emotion */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>21. Entry Emotion</InputLabel>
                            <Select
                              value={tradeForm.emotionBefore}
                              label="21. Entry Emotion"
                              onChange={(e) => updateTradeField("emotionBefore", e.target.value)}
                            >
                              {ENTRY_EMOTIONS.map((emo) => (
                                <MenuItem key={emo} value={emo} sx={{ fontSize: "0.75rem" }}>
                                  {emo}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        {/* 22. Exit Emotion */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>22. Exit Emotion</InputLabel>
                            <Select
                              value={tradeForm.emotionAfter}
                              label="22. Exit Emotion"
                              onChange={(e) => updateTradeField("emotionAfter", e.target.value)}
                            >
                              {EXIT_EMOTIONS.map((emo) => (
                                <MenuItem key={emo} value={emo} sx={{ fontSize: "0.75rem" }}>
                                  {emo}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        {/* 23. Confidence (1–5) */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Box sx={{ p: 1, py: 0.6, borderRadius: "6px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.3 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.70rem" }}>
                                23. Confidence (1–5):
                              </Typography>
                              <Chip label={`${tradeForm.confidenceRating}/5`} size="small" sx={{ fontWeight: 600, bgcolor: "#38BDF8", color: "#000", height: 16, fontSize: "0.62rem" }} />
                            </Box>
                            <Slider
                              size="small"
                              value={tradeForm.confidenceRating}
                              min={1}
                              max={5}
                              step={1}
                              marks
                              valueLabelDisplay="auto"
                              onChange={(_, val) => updateTradeField("confidenceRating", val as number)}
                              sx={{ py: 0.3 }}
                            />
                          </Box>
                        </Grid>

                        {/* 24. Discipline (1–5) */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Box sx={{ p: 1, py: 0.6, borderRadius: "6px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.3 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.70rem" }}>
                                24. Discipline (1–5):
                              </Typography>
                              <Chip label={`${tradeForm.disciplineRating}/5`} size="small" sx={{ fontWeight: 600, bgcolor: "#10B981", color: "#FFF", height: 16, fontSize: "0.62rem" }} />
                            </Box>
                            <Slider
                              size="small"
                              value={tradeForm.disciplineRating}
                              min={1}
                              max={5}
                              step={1}
                              marks
                              valueLabelDisplay="auto"
                              onChange={(_, val) => updateTradeField("disciplineRating", val as number)}
                              sx={{ py: 0.3 }}
                            />
                          </Box>
                        </Grid>

                        {/* 25. Mistake? */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", p: 1, py: 0.5, borderRadius: "6px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.70rem" }}>
                              25. Mistake?
                            </Typography>
                            <FormControlLabel
                              sx={{ mr: 0 }}
                              control={
                                <Switch
                                  size="small"
                                  checked={tradeForm.mistakeFlag}
                                  onChange={(e) => updateTradeField("mistakeFlag", e.target.checked)}
                                  color="error"
                                />
                              }
                              label={<Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.68rem" }}>{tradeForm.mistakeFlag ? "YES" : "NO"}</Typography>}
                            />
                          </Box>
                        </Grid>

                        {/* 26. Mistake Type (with Other manual text input option) */}
                        <Grid size={{ xs: 12, sm: 8 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>26. Mistake Type</InputLabel>
                            <Select
                              value={tradeForm.mistakeType}
                              label="26. Mistake Type"
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
                              <MenuItem value="Other" sx={{ fontWeight: 600, color: "#EF4444" }}>
                                Other (Enter Details Manually)
                              </MenuItem>
                            </Select>
                          </FormControl>
                          {tradeForm.mistakeFlag && tradeForm.mistakeType === "Other" && (
                            <TextField
                              fullWidth
                              size="small"
                              label="Describe Mistake Details"
                              placeholder="Enter details of what went wrong..."
                              value={tradeForm.customMistake}
                              onChange={(e) => updateTradeField("customMistake", e.target.value)}
                              required
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* SECTION 5: MARKET CONTEXT & NOTES */}
                    <Paper
                      sx={{
                        p: 1.2,
                        flex: 1,
                        borderRadius: "8px",
                        bgcolor: isDark ? "#050912" : "#F8FAFC",
                        border: isDark ? "1px solid rgba(6, 182, 212, 0.2)" : "1px solid #E2E8F0",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#22D3EE", mb: 0.9, display: "flex", alignItems: "center", gap: 0.8, fontSize: "0.78rem" }}>
                        <Box component="span" sx={{ bgcolor: "#0891B2", color: "#FFF", px: 0.6, py: 0.1, borderRadius: "4px", fontSize: "0.62rem" }}>
                          PART 5
                        </Box>
                        Market Context & Retrospective Journal
                      </Typography>

                      <Grid container spacing={1.2}>
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
                            placeholder="Hit TP, Trailing SL, Manual Early Exit"
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
                            placeholder="Market structure, candle pattern, or liquidity sweep trigger"
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
                            placeholder="Key reflections, psychology lessons, adjustments..."
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* ============================================================ */}
                  {/* FULL-WIDTH BOTTOM ACTION SUMMARY & SUBMIT BAR                */}
                  {/* ============================================================ */}
                  <Grid size={{ xs: 12 }}>
                    <Box
                      sx={{
                        p: 1.4,
                        mt: 0.5,
                        borderRadius: "8px",
                        bgcolor: isDark ? "#0A1124" : "#F0F9FF",
                        border: isDark ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid #BAE6FD",
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        gap: 1.2,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                          Live Preview:
                        </Typography>
                        <Chip label={`${tradeForm.symbol} • ${tradeForm.direction}`} size="small" sx={{ fontWeight: 600, height: 22, fontSize: "0.68rem" }} />
                        <Chip label={`Risk: ₹${tradeForm.plannedRiskAmount || "0"}`} size="small" sx={{ fontWeight: 600, height: 22, fontSize: "0.68rem", bgcolor: "rgba(239,68,68,0.15)", color: "#EF4444" }} />
                        {tradeForm.netPnl !== "" && (
                          <Chip
                            label={`P&L: ${Number(tradeForm.netPnl) >= 0 ? "+" : ""}₹${tradeForm.netPnl} (${tradeForm.actualRR})`}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              height: 22,
                              fontSize: "0.68rem",
                              bgcolor: Number(tradeForm.netPnl) >= 0 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                              color: Number(tradeForm.netPnl) >= 0 ? "#10B981" : "#EF4444",
                            }}
                          />
                        )}
                        <Chip label={`Result: ${tradeForm.result}`} size="small" sx={{ fontWeight: 600, height: 22, fontSize: "0.68rem" }} />
                      </Box>

                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setActiveTab(0)}
                          sx={{ borderRadius: "6px", height: 32, fontSize: "0.74rem", px: 1.8, textTransform: "none", fontWeight: 600 }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="small"
                          variant="contained"
                          disabled={submittingTrade}
                          sx={{
                            bgcolor: "#10B981",
                            color: "#FFFFFF",
                            borderRadius: "6px",
                            px: 2.2,
                            height: 32,
                            fontSize: "0.74rem",
                            fontWeight: 600,
                            textTransform: "none",
                            "&:hover": { bgcolor: "#059669" },
                          }}
                        >
                          {submittingTrade ? "Saving..." : "Submit Trade (31 Fields)"}
                        </Button>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
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
              borderRadius: "8px",
              bgcolor: isDark ? "#0A1124" : "#FFFFFF",
              border: isDark ? "1px solid rgba(56, 189, 248, 0.14)" : "1px solid #E2E8F0",
            }}
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
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
                          <SearchIcon sx={{ fontSize: 18, color: "#38BDF8" }} />
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
              <Paper elevation={0} sx={{ overflowX: "auto", border: isDark ? "1px solid rgba(56, 189, 248, 0.15)" : "1px solid #E2E8F0", borderRadius: "6px" }}>
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
                      bgcolor: isDark ? "#0A1124" : "#F1F5F9",
                      color: isDark ? "#94A3B8" : "#475569",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontSize: "0.72rem",
                      borderBottom: isDark ? "1px solid rgba(56, 189, 248, 0.2)" : "1px solid #E2E8F0",
                    },
                    "& td": {
                      py: 1.2,
                      px: 1.5,
                      borderBottom: isDark ? "1px solid rgba(56, 189, 248, 0.08)" : "1px solid #F1F5F9",
                    },
                    "& tr:hover": {
                      bgcolor: isDark ? "rgba(56, 189, 248, 0.06)" : "rgba(2, 132, 199, 0.04)",
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
                              sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, bgcolor: "rgba(56, 189, 248, 0.15)", color: "#38BDF8" }}
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
                                fontWeight: 600,
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
                                  fontWeight: 600,
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
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "#8B5CF6" }}>
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
                                fontWeight: 600,
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
                                fontWeight: 600,
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
              borderRadius: "8px",
              bgcolor: isDark ? "#0A1124" : "#FFFFFF",
              border: isDark ? "1px solid rgba(56, 189, 248, 0.14)" : "1px solid #E2E8F0",
              p: 2,
            }}
          >

            <Grid container spacing={1.5}>
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                <Grid key={day} size={{ xs: 2.4 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, textAlign: "center", display: "block", color: isDark ? "#94A3B8" : "#64748B" }}>
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
                          ? isDark ? "#050912" : "#F8FAFC"
                          : dayItem.pnl > 0
                          ? isDark ? "rgba(16, 185, 129, 0.12)" : "#ECFDF5"
                          : isDark ? "rgba(239, 68, 68, 0.12)" : "#FEF2F2",
                      border:
                        dayItem.count === 0
                          ? isDark ? "1px solid rgba(56, 189, 248, 0.1)" : "1px solid #E2E8F0"
                          : dayItem.pnl > 0
                          ? "1px solid rgba(16, 185, 129, 0.3)"
                          : "1px solid rgba(239, 68, 68, 0.3)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#64748B" }}>
                      {dayItem.date}
                    </Typography>
                    {dayItem.count > 0 ? (
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
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
        {activeTab === 4 && (
          <AnalyticsView
            trades={accountTrades}
            currencySymbol={activeCurrencySymbol}
            startingBalance={activeStartingBalance}
            isDark={isDark}
          />
        )}

        {/* ============================================================ */}
        {/* TAB 5: JOURNAL & PSYCHOLOGY                                  */}
        {/* ============================================================ */}
        {activeTab === 5 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Card sx={{ p: 2, borderRadius: "8px", bgcolor: isDark ? "#0A1124" : "#FFFFFF", border: isDark ? "1px solid rgba(56, 189, 248, 0.14)" : "1px solid #E2E8F0" }}>

              <Grid container spacing={2}>
                {reviews.map((r) => (
                  <Grid key={r.id} size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: "6px", bgcolor: isDark ? "#050912" : "#F8FAFC", border: isDark ? "1px solid rgba(56, 189, 248, 0.15)" : "1px solid #E2E8F0" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#38BDF8" }}>
                          Review Date: {new Date(r.review_date).toLocaleDateString()}
                        </Typography>
                        <Rating value={r.daily_rating || 4} readOnly size="small" />
                      </Box>

                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: "#10B981", display: "block" }}>
                          WHAT WENT WELL:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "0.82rem" }}>
                          {r.what_went_well || "Executed plan without hesitation."}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: "#EF4444", display: "block" }}>
                          WHAT WENT WRONG / MISTAKES:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "0.82rem" }}>
                          {r.what_went_wrong || "None identified."}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: "#8B5CF6", display: "block" }}>
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
        {/* TAB 6: ACCOUNTS MANAGEMENT (COMPLETE CRUD)                  */}
        {/* ============================================================ */}
        {activeTab === 6 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Accounts Grid */}
            <Grid container spacing={2}>
              {accounts.map((acc) => {
                const isActive = selectedAccountId === acc.id;
                const starting = Number(acc.starting_balance) || 10000;
                const current = Number(acc.current_balance) || starting;
                const netProfit = current - starting;
                const currSymbol = acc.currency === "INR" ? "₹" : "$";

                return (
                  <Grid key={acc.id} size={{ xs: 12, md: 6, lg: 4 }}>
                    <Card
                      sx={{
                        p: 2,
                        borderRadius: "8px",
                        bgcolor: isDark ? "#0A1124" : "#FFFFFF",
                        border: isActive
                          ? "2px solid #0284C7"
                          : isDark
                          ? "1px solid rgba(56, 189, 248, 0.2)"
                          : "1px solid #E2E8F0",
                        position: "relative",
                      }}
                    >
                      {/* Top Badges */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <Chip
                            label={acc.account_type.toUpperCase()}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.65rem",
                              height: 20,
                              bgcolor:
                                acc.account_type === "live"
                                  ? "rgba(16, 185, 129, 0.2)"
                                  : "rgba(56, 189, 248, 0.2)",
                              color:
                                acc.account_type === "live"
                                  ? "#10B981"
                                  : "#38BDF8",
                            }}
                          />
                          <Chip
                            label={acc.currency}
                            size="small"
                            sx={{ fontWeight: 600, fontSize: "0.65rem", height: 20 }}
                          />
                        </Box>

                        {isActive && (
                          <Chip
                            label="ACTIVE"
                            size="small"
                            sx={{
                              bgcolor: "#0284C7",
                              color: "#FFF",
                              fontWeight: 600,
                              fontSize: "0.62rem",
                              height: 18,
                            }}
                          />
                        )}
                      </Box>

                      {/* Account Name & Description */}
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.05rem", mt: 0.5 }}>
                        {acc.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", minHeight: 32, fontSize: "0.72rem" }}>
                        {acc.description || "Portfolio account tracked in PostgreSQL database."}
                      </Typography>

                      <Divider sx={{ my: 1.2 }} />

                      {/* Balances */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.6 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>Starting Capital:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {currSymbol}{starting.toLocaleString()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.6 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>Current Equity:</Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: current >= starting ? "#10B981" : "#EF4444",
                          }}
                        >
                          {currSymbol}{current.toLocaleString()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>Realized Growth:</Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: netProfit >= 0 ? "#10B981" : "#EF4444",
                          }}
                        >
                          {netProfit >= 0 ? `+${currSymbol}${netProfit.toLocaleString()}` : `-${currSymbol}${Math.abs(netProfit).toLocaleString()}`} ({starting > 0 ? ((netProfit / starting) * 100).toFixed(2) : "0.00"}%)
                        </Typography>
                      </Box>

                      {/* Actions */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1, borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #F1F5F9" }}>
                        <Button
                          size="small"
                          variant={isActive ? "outlined" : "contained"}
                          onClick={() => setSelectedAccountId(acc.id)}
                          disabled={isActive}
                          sx={{
                            fontSize: "0.72rem",
                            height: 26,
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                        >
                          {isActive ? "Active Account" : "Set as Active"}
                        </Button>

                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Edit Account Details">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditAccount(acc)}
                              sx={{ border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #E2E8F0" }}
                            >
                              <EditIcon sx={{ fontSize: 15, color: "#38BDF8" }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Account">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setAccountToDelete(acc);
                                setDeleteAccountDialogOpen(true);
                              }}
                              sx={{ border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #E2E8F0" }}
                            >
                              <DeleteIcon sx={{ fontSize: 15, color: "#EF4444" }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

      </Box>

      {/* ============================================================== */}
      {/* CREATE / EDIT ACCOUNT DIALOG                                   */}
      {/* ============================================================== */}
      <Dialog
        open={accountDialogOpen}
        onClose={() => !accountActionLoading && setAccountDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: isDark ? "#0A1124" : "#FFFFFF",
              borderRadius: "8px",
              border: isDark ? "1px solid rgba(56, 189, 248, 0.14)" : "1px solid #E2E8F0",
              p: 1.5,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
          {editingAccount ? "Edit Trading Account" : "Create New Trading Account"}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Account Name"
              required
              placeholder="e.g. Personal Swing Account, Live Scalping"
              value={accountForm.name}
              onChange={(e) => setAccountForm((prev) => ({ ...prev, name: e.target.value }))}
            />

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Account Type</InputLabel>
                  <Select
                    value={accountForm.accountType}
                    label="Account Type"
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, accountType: e.target.value }))}
                  >
                    <MenuItem value="demo">Demo</MenuItem>
                    <MenuItem value="live">Live</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={accountForm.currency}
                    label="Currency"
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, currency: e.target.value }))}
                  >
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="INR">INR (₹)</MenuItem>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                    <MenuItem value="GBP">GBP (£)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              size="small"
              label="Starting Balance"
              type="number"
              required
              value={accountForm.startingBalance}
              onChange={(e) => setAccountForm((prev) => ({ ...prev, startingBalance: e.target.value }))}
            />

            <TextField
              fullWidth
              size="small"
              label="Description / Broker Notes"
              multiline
              rows={2}
              placeholder="e.g. Zerodha / ICICI Direct / Exness / FTMO"
              value={accountForm.description}
              onChange={(e) => setAccountForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ pt: 1.5 }}>
          <Button
            onClick={() => setAccountDialogOpen(false)}
            disabled={accountActionLoading}
            sx={{ textTransform: "none", color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAccount}
            disabled={accountActionLoading}
            sx={{
              bgcolor: "#0284C7",
              fontWeight: 600,
              borderRadius: "6px",
              px: 3,
            }}
          >
            {accountActionLoading ? "Saving..." : editingAccount ? "Update Account" : "Create Account"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================== */}
      {/* DELETE ACCOUNT CONFIRMATION DIALOG                             */}
      {/* ============================================================== */}
      <Dialog
        open={deleteAccountDialogOpen}
        onClose={() => !accountActionLoading && setDeleteAccountDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: isDark ? "#0A1124" : "#FFFFFF",
              borderRadius: "8px",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              p: 1.5,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: "#EF4444", display: "flex", alignItems: "center", gap: 1 }}>
          <WarningIcon sx={{ color: "#EF4444" }} />
          Delete Account?
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Are you sure you want to delete <strong>{accountToDelete?.name}</strong>?
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            This will permanently remove the account and its associated trades from the database.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pt: 1.5 }}>
          <Button
            onClick={() => setDeleteAccountDialogOpen(false)}
            disabled={accountActionLoading}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
            disabled={accountActionLoading}
            sx={{ fontWeight: 600, borderRadius: "6px" }}
          >
            {accountActionLoading ? "Deleting..." : "Delete Permanently"}
          </Button>
        </DialogActions>
      </Dialog>

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
              bgcolor: isDark ? "#0A1124" : "#FFFFFF",
              borderRadius: "8px",
              border: isDark ? "1px solid rgba(56, 189, 248, 0.14)" : "1px solid #E2E8F0",
              p: 2,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BookIcon sx={{ color: "#38BDF8" }} />
            Trade #{selectedTrade?.trade_num || selectedTrade?.id.slice(-4)}: {selectedTrade?.symbol} ({selectedTrade?.direction})
          </Box>
          <Chip
            label={selectedTrade?.result || (selectedTrade?.net_pnl && selectedTrade.net_pnl > 0 ? "WIN" : "LOSS")}
            size="small"
            sx={{
              fontWeight: 600,
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
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1 }}>
                  PART 1 — Trade Setup & Execution
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>1. Trade #:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>#{selectedTrade.trade_num || "1"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>2. Date:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{new Date(selectedTrade.opened_at).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>3. Time:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{new Date(selectedTrade.opened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>4. Symbol:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#38BDF8" }}>{selectedTrade.symbol}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>5. Direction:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: selectedTrade.direction === "BUY" ? "#10B981" : "#EF4444" }}>
                      {selectedTrade.direction}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>6. Strategy / Setup:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.strategy_name || "SMC Order Block"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>7. Session:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.session || "Morning Opening"}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Part 2: Price Levels & Sizing (Fields 9-13) */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1 }}>
                  PART 2 — Price Levels & Sizing (Fields 8 – 12)
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Entry Price:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.entry_price}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Stop Loss (SL):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#EF4444" }}>{selectedTrade.stop_loss ?? "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Take Profit (TP):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#10B981" }}>{selectedTrade.take_profit ?? "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Exit Price:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.exit_price ?? "OPEN"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Lots / Quantity:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.volume ?? "1"}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Part 3: Risk & Financial Engine (Fields 14-20) */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#D97706", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1 }}>
                  PART 3 — Risk, Reward & Financial Engine
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6, sm: 1.7 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Risk Amount:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#EF4444" }}>${selectedTrade.planned_risk_amount ?? "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.7 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>SL Points:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.sl_points ?? (selectedTrade.stop_loss ? Math.abs(selectedTrade.entry_price - selectedTrade.stop_loss).toFixed(1) : "-")}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.7 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>TP Points:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.tp_points ?? (selectedTrade.take_profit ? Math.abs(selectedTrade.take_profit - selectedTrade.entry_price).toFixed(1) : "-")}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.7 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Planned R:R:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.planned_rr_ratio ? `1 : ${selectedTrade.planned_rr_ratio}` : "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Realized P&L:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: (selectedTrade.net_pnl || 0) >= 0 ? "#10B981" : "#EF4444" }}>
                      {(selectedTrade.net_pnl || 0) >= 0 ? `+$${selectedTrade.net_pnl}` : `-$${Math.abs(selectedTrade.net_pnl || 0)}`}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.6 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Actual R:R:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#8B5CF6" }}>{selectedTrade.actual_r ? `${selectedTrade.actual_r}R` : "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.6 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Result:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: (selectedTrade.net_pnl || 0) >= 0 ? "#10B981" : "#EF4444" }}>
                      {selectedTrade.result || ((selectedTrade.net_pnl || 0) > 0 ? "WIN" : "LOSS")}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Part 4: Psychology & Mindset */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#8B5CF6", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1 }}>
                  PART 4 — Trading Psychology & Mindset
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Entry Emotion:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.emotion_before || "Calm"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Exit Emotion:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.emotion_after || "Satisfied"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.5 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Confidence (1-5):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#38BDF8" }}>{selectedTrade.confidence_rating || 5}/5</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.5 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Discipline (1-5):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#10B981" }}>{selectedTrade.discipline_rating || 5}/5</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Mistake Flag:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: selectedTrade.mistake_flag ? "#EF4444" : "#10B981" }}>
                      {selectedTrade.mistake_flag ? "YES" : "NO"}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Mistake Type:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: selectedTrade.mistake_flag ? "#EF4444" : "text.primary" }}>
                      {selectedTrade.mistake_type || (selectedTrade.mistake_flag ? "Execution Error" : "None / Followed Plan")}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Part 5: Context & Retrospective */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#22D3EE", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1 }}>
                  PART 5 — Market Context & Retrospective Journal
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Market Condition:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.market_condition || "Strong Trending Up"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Exit Reason:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.exit_reason || "Hit Take Profit Target"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Entry Reason:</Typography>
                    <Typography variant="body2" sx={{ fontStyle: "italic", bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", p: 1, borderRadius: "4px" }}>
                      {selectedTrade.entry_reason || "Order block reaction with high volume expansion."}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Notes / Lessons Learned:</Typography>
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
