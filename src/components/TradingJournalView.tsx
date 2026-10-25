"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  Rating,
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
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { useColorMode } from "@/components/ThemeRegistry";
import { STORAGE_PREFIX } from "@/lib/brand";
import { TradeRecord } from "@/lib/tradingAnalytics";
import AdvancedTradingDashboard from "./AdvancedTradingDashboard";
import WaveAnalyticsView from "./WaveAnalyticsView";
import AnalyticsView from "./AnalyticsView";
import { MONO, makeTokens, signColor, cardSx } from "./TradingInsightsPanel";
import TradingCalendarView from "./TradingCalendarView";

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

// A fresh trade entry: selects get neutral defaults, every price and result field starts empty
const EMPTY_TRADE_FORM = {
  tradeDate: "",
  tradeTime: "",
  exitTime: "",
  symbol: "XAUUSD",
  direction: "BUY",
  strategyId: "",
  customStrategy: "",
  session: "Morning Opening (9:15-11:00)",
  entryPrice: "",
  stopLoss: "",
  takeProfit: "",
  exitPrice: "",
  volume: "1",
  plannedRiskAmount: "",
  slPoints: "",
  tpPoints: "",
  plannedRR: "",
  netPnl: "",
  actualRR: "-",
  result: "OPEN",
  emotionBefore: "Calm",
  emotionAfter: "Satisfied",
  confidenceRating: 3,
  disciplineRating: 3,
  mistakeFlag: false,
  mistakeType: "None / Followed Plan",
  customMistake: "",
  marketCondition: "Strong Trending Up ↗",
  entryReason: "",
  exitReason: "",
  notes: "",
  accountId: "",
  status: "OPEN",
};

const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", INR: "₹", EUR: "€", GBP: "£" };
export const currencySymbol = (code?: string | null) => (code ? CURRENCY_SYMBOLS[code.toUpperCase()] ?? `${code.toUpperCase()} ` : "$");

// Market is derived from the symbol so every saved trade carries it
const MARKET_BY_SYMBOL: Record<string, string> = {
  XAUUSD: "Metals",
  XAGUSD: "Metals",
  EURUSD: "Forex",
  GBPUSD: "Forex",
  USDJPY: "Forex",
  USDINR: "Forex",
  BTCUSD: "Crypto",
  ETHUSD: "Crypto",
  NIFTY: "Indian Indices (NSE)",
  BANKNIFTY: "Indian Indices (NSE)",
  NASDAQ: "US Indices",
  "S&P500": "US Indices",
};

const ACTIVE_ACCOUNT_KEY = `${STORAGE_PREFIX}_active_account`;

const RATING_OPTIONS = [
  { value: 1, label: "Very low" },
  { value: 2, label: "Low" },
  { value: 3, label: "Average" },
  { value: 4, label: "High" },
  { value: 5, label: "Very high" },
];

// Trade-entry grid column spans: on lg, FIELD = 6 per row, FIELD_MID = 4, FIELD_WIDE = 3
const FIELD = { xs: 6, sm: 4, md: 3, lg: 2 };
const FIELD_MID = { xs: 12, sm: 6, lg: 3 };
const FIELD_WIDE = { xs: 12, sm: 8, md: 6, lg: 4 };

// Auto-calculated inputs stay editable but read as derived values
const autoFieldSx = {
  "& .MuiOutlinedInput-root": { bgcolor: "rgba(56, 189, 248, 0.05)" },
  "& .MuiInputBase-input": { color: "#7DD3FC", fontFamily: "var(--font-mono)" },
};

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
  const tk = useMemo(() => makeTokens(isDark), [isDark]);

  // Navigation State: 0 = Overview, 1 = Add Trade, 2 = History, 3 = Calendar, 4 = Analytics, 5 = Journal, 6 = Accounts
  const [activeTab, setActiveTab] = useState<number>(initialTab);

  // Selected Account Filter
  // Active account survives reloads; "" means nothing chosen yet (resolved once accounts load)
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    try {
      return localStorage.getItem(ACTIVE_ACCOUNT_KEY) ?? "";
    } catch {
      return "";
    }
  });
  useEffect(() => {
    try {
      if (selectedAccountId) localStorage.setItem(ACTIVE_ACCOUNT_KEY, selectedAccountId);
    } catch {}
  }, [selectedAccountId]);

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
      if (res.status === 401) {
        showToast("Your session has expired. Please sign in again.", "error");
        return;
      }
      if (data.success) {
        const loaded: { id: string; is_archived?: boolean }[] = data.accounts || [];
        const activeIds = loaded.filter((a) => !a.is_archived).map((a) => a.id);
        const fallback = activeIds[0] ?? "all";
        setSelectedAccountId((prev) => (prev === "all" || activeIds.includes(prev) ? prev : fallback));
        setTradeForm((prev) => (prev.accountId && activeIds.includes(prev.accountId) ? prev : { ...prev, accountId: activeIds.includes(selectedAccountId) ? selectedAccountId : activeIds[0] ?? "" }));
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
    }));
  }, [fetchJournalData]);

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
    accountType: "live",
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
      accountType: "live",
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
      accountType: acc.account_type || "live",
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
          showToast("Account created and set as active", "success");
          setAccountDialogOpen(false);
          if (data.account?.id) {
            setSelectedAccountId(data.account.id);
            setTradeForm((prev) => ({ ...prev, accountId: data.account.id }));
          } else {
            fetchJournalData();
          }
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
        showToast(`${accountToDelete.name} is now inactive`, "success");
        setDeleteAccountDialogOpen(false);
        setAccountToDelete(null);
        const next = activeAccounts.find((a) => a.id !== accountToDelete.id)?.id ?? "all";
        if (selectedAccountId === accountToDelete.id) {
          setSelectedAccountId(next);
        } else {
          fetchJournalData();
        }
      } else {
        showToast(data.error || "Failed to deactivate account", "error");
      }
    } catch {
      showToast("Server error deactivating account", "error");
    } finally {
      setAccountActionLoading(false);
    }
  };

  const handleReactivateAccount = async (acc: any) => {
    setAccountActionLoading(true);
    try {
      const res = await fetch(`/api/journal/accounts?id=${acc.id}`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`${acc.name} is active again`, "success");
        fetchJournalData();
      } else {
        showToast(data.error || "Failed to reactivate account", "error");
      }
    } catch {
      showToast("Server error reactivating account", "error");
    } finally {
      setAccountActionLoading(false);
    }
  };

  // --- TRADE ENTRY FORM STATE ---
  const [tradeForm, setTradeForm] = useState(EMPTY_TRADE_FORM);

  const activeAccounts = accounts.filter((a) => !a.is_archived);
  const inactiveAccounts = accounts.filter((a) => a.is_archived);
  const currencyOfAccount = (accountId: string) => currencySymbol(accounts.find((a) => a.id === accountId)?.currency);
  const formCurrencySymbol = currencyOfAccount(tradeForm.accountId);
  const ACCOUNT_TYPE_COLOR: Record<string, string> = { live: tk.pos, funded: tk.indigo, backtest: tk.accent };

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

      // Mistake Sync: any type other than "None" marks the trade as a mistake
      if (field === "mistakeType") {
        next.mistakeFlag = val !== "None / Followed Plan";
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
      // Exit time is on the trade date; an exit earlier than the entry rolls to the next day
      let closedAtDateTime: string | null = null;
      if (tradeForm.exitPrice) {
        const closeDate = new Date(`${tradeForm.tradeDate}T${tradeForm.exitTime || tradeForm.tradeTime || "09:15"}:00`);
        if (closeDate < new Date(openedAtDateTime)) closeDate.setDate(closeDate.getDate() + 1);
        closedAtDateTime = closeDate.toISOString();
      }
      const payload = {
        accountId: tradeForm.accountId,
        strategyId: tradeForm.strategyId === "other" ? null : (tradeForm.strategyId || null),
        customStrategy: tradeForm.strategyId === "other" ? tradeForm.customStrategy : null,
        symbol: tradeForm.symbol.toUpperCase().trim(),
        direction: tradeForm.direction,
        status: tradeForm.exitPrice ? "CLOSED" : "OPEN",
        openedAt: new Date(openedAtDateTime).toISOString(),
        closedAt: closedAtDateTime,
        market: MARKET_BY_SYMBOL[tradeForm.symbol] ?? null,
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
        showToast(data.tradeNum ? `Trade #${data.tradeNum} recorded successfully!` : "Trade recorded successfully!", "success");
        setTradeForm((prev) => ({
          ...EMPTY_TRADE_FORM,
          accountId: prev.accountId,
          tradeDate: new Date().toISOString().slice(0, 10),
          tradeTime: new Date().toTimeString().slice(0, 5),
        }));
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
  const activeAccount = activeAccounts.find((a) => a.id === selectedAccountId) ?? null;
  const scopeAccounts = activeAccount ? [activeAccount] : activeAccounts;
  const scopeCurrencies = Array.from(new Set(scopeAccounts.map((a) => String(a.currency || "USD").toUpperCase())));
  const mixedCurrencies = scopeCurrencies.length > 1;
  // Mixed currencies can't share one symbol, so amounts are shown unlabelled and flagged in the dashboard
  const activeCurrencySymbol = mixedCurrencies ? "" : currencySymbol(scopeCurrencies[0]);
  const activeStartingBalance = scopeAccounts.reduce((sum, a) => sum + (Number(a.starting_balance) || 0), 0);

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

  // Size the view to the visible outlet so the top menu stays fixed and only tab content scrolls
  const rootRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  useEffect(() => {
    const outlet = document.getElementById("app-main-outlet");
    const el = rootRef.current;
    if (!outlet || !el) return;
    const bottomPadding = parseFloat(getComputedStyle(el.closest(".app-content-container") ?? outlet).paddingBottom) || 0;
    const measure = () => {
      const top = el.getBoundingClientRect().top - outlet.getBoundingClientRect().top + outlet.scrollTop;
      setViewportHeight(Math.max(360, Math.floor(outlet.clientHeight - top - bottomPadding)));
    };
    // ResizeObserver fires once on observe, which also covers the initial measurement
    const ro = new ResizeObserver(measure);
    ro.observe(outlet);
    return () => ro.disconnect();
  }, []);

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
    { label: "Accounts", badge: activeAccounts.length, icon: <AccountsIcon />, color: "#10B981" },
  ];

  return (
    <Box
      ref={rootRef}
      sx={{
        height: viewportHeight ?? "auto",
        display: "flex",
        flexDirection: "column",
        bgcolor: "transparent",
        color: isDark ? "#F8FAFC" : "#0F172A",
      }}
    >
      {/* ============================================================== */}
      {/* NAVIGATION COMMAND BAR (TABS + ACCOUNT CONTROLS) & PAGE HEADER */}
      {/* ============================================================== */}
      {/* Fixed top menu: sits outside the scroll area so only the tab content below it scrolls */}
      <Box sx={{ flexShrink: 0, px: { xs: 0.8, sm: 1.2, md: 1.5 }, pt: 1, display: "flex", flexDirection: "column", gap: 1.4 }}>
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
            scrollButtons={false}
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: 44,
              "& .MuiTabs-flexContainer": { gap: 0.2 },
              "& .MuiTab-root": {
                minHeight: 44,
                minWidth: 0,
                py: 0,
                px: { xs: 1, xl: 1.3 },
                fontSize: "0.8rem",
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
            <FormControl size="small" sx={{ minWidth: 170, maxWidth: 230 }}>
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
                  "& .MuiSelect-select": { py: 0.4, pl: 0, pr: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                }}
              >
                <MenuItem value="all" sx={{ fontSize: "0.78rem" }}>All Accounts ({activeAccounts.length})</MenuItem>
                {activeAccounts.map((acc) => (
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
      <Box
        key={`tab-${activeTab}`}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: viewportHeight ? "auto" : "visible",
          overflowX: "hidden",
          width: "100%",
          mt: 1,
          px: { xs: 0.8, sm: 1.2, md: 1.5 },
          pb: 1.5,
          animation: "view-enter 0.35s ease-out both",
          scrollbarWidth: "thin",
          scrollbarColor: "var(--scrollbar-thumb) var(--scrollbar-track)",
          "&::-webkit-scrollbar": { width: "var(--scrollbar-width)" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "var(--scrollbar-thumb)", borderRadius: "var(--border-radius)" },
        }}
      >
        {loading && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}

        {mixedCurrencies && [0, 3, 4].includes(activeTab) && (
          <Alert severity="info" sx={{ mb: 1.5, py: 0.2, fontSize: "0.76rem", alignItems: "center" }}>
            All Accounts mixes {scopeCurrencies.join(" and ")} accounts, so totals add amounts in different currencies. Pick a single account for exact figures.
          </Alert>
        )}

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
              <form onSubmit={handleCreateTrade}>
                {/* Single dense grid; on lg each row fills 12 cols: setup, context, prices, financials, mindset, journal */}
                <Grid container spacing={1.2}>
                  <Grid size={FIELD_WIDE}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Trading Account</InputLabel>
                      <Select value={tradeForm.accountId} label="Trading Account" onChange={(e) => updateTradeField("accountId", e.target.value)}>
                        {activeAccounts.map((a) => (
                          <MenuItem key={a.id} value={a.id}>
                            {a.name} ({a.account_type.toUpperCase()} - {a.currency})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={FIELD}>
                    <TextField fullWidth size="small" label="Date" type="date" value={tradeForm.tradeDate} onChange={(e) => updateTradeField("tradeDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                  <Grid size={FIELD}>
                    <TextField fullWidth size="small" label="Entry Time" type="time" value={tradeForm.tradeTime} onChange={(e) => updateTradeField("tradeTime", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                  <Grid size={FIELD}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Exit Time"
                      type="time"
                      value={tradeForm.exitTime}
                      onChange={(e) => updateTradeField("exitTime", e.target.value)}
                      disabled={!tradeForm.exitPrice}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={FIELD}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Symbol</InputLabel>
                      <Select value={tradeForm.symbol} label="Symbol" onChange={(e) => updateTradeField("symbol", e.target.value)}>
                        {TRADING_SYMBOLS.map((sym) => (
                          <MenuItem key={sym} value={sym} sx={{ fontWeight: 600 }}>
                            {sym}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={FIELD}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Direction</InputLabel>
                      <Select
                        value={tradeForm.direction}
                        label="Direction"
                        onChange={(e) => updateTradeField("direction", e.target.value)}
                        sx={{ color: tradeForm.direction === "BUY" ? "#10B981" : "#EF4444", fontWeight: 600 }}
                      >
                        <MenuItem value="BUY" sx={{ color: "#10B981", fontWeight: 600 }}>BUY</MenuItem>
                        <MenuItem value="SELL" sx={{ color: "#EF4444", fontWeight: 600 }}>SELL</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={FIELD_MID}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Strategy / Setup</InputLabel>
                      <Select value={tradeForm.strategyId} label="Strategy / Setup" onChange={(e) => updateTradeField("strategyId", e.target.value)}>
                        <MenuItem value="" sx={{ color: "text.secondary" }}>No strategy</MenuItem>
                        {strategies.map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.name}
                          </MenuItem>
                        ))}
                        <MenuItem value="other" sx={{ fontWeight: 600, color: "#38BDF8" }}>
                          + New strategy (type a name)
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={FIELD_MID}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Session</InputLabel>
                      <Select value={tradeForm.session} label="Session" onChange={(e) => updateTradeField("session", e.target.value)}>
                        <MenuItem value="Morning Opening (9:15-11:00)">Morning Opening (9:15 - 11:00)</MenuItem>
                        <MenuItem value="Mid-Day Consolidation (11:00-13:30)">Mid-Day Consolidation (11:00 - 13:30)</MenuItem>
                        <MenuItem value="Afternoon Closing (13:30-15:30)">Afternoon Closing (13:30 - 15:30)</MenuItem>
                        <MenuItem value="London Open">London Open</MenuItem>
                        <MenuItem value="New York Open">New York Open</MenuItem>
                        <MenuItem value="Asian Session">Asian Session</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={FIELD}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Market Condition</InputLabel>
                      <Select value={tradeForm.marketCondition} label="Market Condition" onChange={(e) => updateTradeField("marketCondition", e.target.value)}>
                        <MenuItem value="Strong Trending Up ↗">Strong Trending Up ↗</MenuItem>
                        <MenuItem value="Strong Trending Down ↘">Strong Trending Down ↘</MenuItem>
                        <MenuItem value="Range-Bound / Choppy ↔">Range-Bound / Choppy ↔</MenuItem>
                        <MenuItem value="High Volatility / News Event ⚡">High Volatility / News Event ⚡</MenuItem>
                        <MenuItem value="Low Volume Consolidation 💤">Low Volume Consolidation 💤</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={FIELD}>
                    <TextField fullWidth size="small" label="Exit Reason" value={tradeForm.exitReason} onChange={(e) => updateTradeField("exitReason", e.target.value)} placeholder="Hit TP, Trailing SL, Manual Exit" />
                  </Grid>
                  {tradeForm.strategyId === "other" && (
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Custom Strategy Details"
                        placeholder="Describe your strategy manually..."
                        value={tradeForm.customStrategy}
                        onChange={(e) => updateTradeField("customStrategy", e.target.value)}
                        required
                      />
                    </Grid>
                  )}

                  <Grid size={FIELD}>
                    <TextField fullWidth size="small" label="Entry Price" type="number" required value={tradeForm.entryPrice} onChange={(e) => updateTradeField("entryPrice", e.target.value)} placeholder="25150" />
                  </Grid>
                  <Grid size={FIELD}>
                    <TextField fullWidth size="small" label="Stop Loss" type="number" value={tradeForm.stopLoss} onChange={(e) => updateTradeField("stopLoss", e.target.value)} placeholder="25100" />
                  </Grid>
                  <Grid size={FIELD}>
                    <TextField fullWidth size="small" label="Take Profit" type="number" value={tradeForm.takeProfit} onChange={(e) => updateTradeField("takeProfit", e.target.value)} placeholder="25300" />
                  </Grid>
                  <Grid size={FIELD}>
                    <TextField fullWidth size="small" label="Exit Price" type="number" value={tradeForm.exitPrice} onChange={(e) => updateTradeField("exitPrice", e.target.value)} placeholder="Blank if open" />
                  </Grid>
                  <Grid size={FIELD}>
                    <TextField fullWidth size="small" label="Lots / Qty" type="number" value={tradeForm.volume} onChange={(e) => updateTradeField("volume", e.target.value)} placeholder="e.g. 50" />
                  </Grid>
                  <Grid size={FIELD}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Planned Risk"
                      type="number"
                      value={tradeForm.plannedRiskAmount}
                      onChange={(e) => updateTradeField("plannedRiskAmount", e.target.value)}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><span style={{ fontSize: "0.75rem" }}>{formCurrencySymbol}</span></InputAdornment> } }}
                    />
                  </Grid>

                  <Grid size={FIELD}>
                    <TextField fullWidth size="small" label="SL Points (Auto)" value={tradeForm.slPoints} onChange={(e) => updateTradeField("slPoints", e.target.value)} placeholder="|Entry − SL|" sx={autoFieldSx} />
                  </Grid>
                  <Grid size={FIELD}>
                    <TextField fullWidth size="small" label="TP Points (Auto)" value={tradeForm.tpPoints} onChange={(e) => updateTradeField("tpPoints", e.target.value)} placeholder="|TP − Entry|" sx={autoFieldSx} />
                  </Grid>
                  <Grid size={FIELD}>
                    <TextField fullWidth size="small" label="Planned R:R (Auto)" value={tradeForm.plannedRR} onChange={(e) => updateTradeField("plannedRR", e.target.value)} sx={autoFieldSx} />
                  </Grid>
                  <Grid size={FIELD}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Net P&L"
                      type="number"
                      value={tradeForm.netPnl}
                      onChange={(e) => updateTradeField("netPnl", e.target.value)}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><span style={{ fontSize: "0.75rem" }}>{formCurrencySymbol}</span></InputAdornment> } }}
                      sx={{ "& .MuiInputBase-input": { fontWeight: 600, color: tradeForm.netPnl === "" ? undefined : Number(tradeForm.netPnl) >= 0 ? "#10B981" : "#EF4444" } }}
                    />
                  </Grid>
                  <Grid size={FIELD}>
                    <TextField fullWidth size="small" label="Actual R (Auto)" value={tradeForm.actualRR} onChange={(e) => updateTradeField("actualRR", e.target.value)} sx={autoFieldSx} />
                  </Grid>
                  <Grid size={FIELD}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Result</InputLabel>
                      <Select value={tradeForm.result} label="Result" onChange={(e) => updateTradeField("result", e.target.value)}>
                        <MenuItem value="WIN" sx={{ color: "#10B981", fontWeight: 600 }}>WIN</MenuItem>
                        <MenuItem value="LOSS" sx={{ color: "#EF4444", fontWeight: 600 }}>LOSS</MenuItem>
                        <MenuItem value="BREAK_EVEN" sx={{ color: "#64748B", fontWeight: 600 }}>BREAK_EVEN</MenuItem>
                        <MenuItem value="OPEN" sx={{ color: "#F59E0B", fontWeight: 600 }}>OPEN</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={FIELD}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Entry Emotion</InputLabel>
                      <Select value={tradeForm.emotionBefore} label="Entry Emotion" onChange={(e) => updateTradeField("emotionBefore", e.target.value)}>
                        {ENTRY_EMOTIONS.map((emo) => (
                          <MenuItem key={emo} value={emo}>
                            {emo}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={FIELD}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Exit Emotion</InputLabel>
                      <Select value={tradeForm.emotionAfter} label="Exit Emotion" onChange={(e) => updateTradeField("emotionAfter", e.target.value)}>
                        {EXIT_EMOTIONS.map((emo) => (
                          <MenuItem key={emo} value={emo}>
                            {emo}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  {(
                    [
                      { field: "confidenceRating", label: "Confidence" },
                      { field: "disciplineRating", label: "Discipline" },
                    ] as const
                  ).map((r) => (
                    <Grid key={r.field} size={FIELD}>
                      <FormControl fullWidth size="small">
                        <InputLabel>{r.label} (1–5)</InputLabel>
                        <Select value={tradeForm[r.field]} label={`${r.label} (1–5)`} onChange={(e) => updateTradeField(r.field, Number(e.target.value))}>
                          {RATING_OPTIONS.map((o) => (
                            <MenuItem key={o.value} value={o.value}>
                              {o.value} · {o.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  ))}
                  <Grid size={FIELD_WIDE}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Mistake</InputLabel>
                      <Select
                        value={tradeForm.mistakeType}
                        label="Mistake"
                        onChange={(e) => updateTradeField("mistakeType", e.target.value)}
                        sx={{ color: tradeForm.mistakeFlag ? "#F87171" : undefined }}
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
                  </Grid>
                  {tradeForm.mistakeType === "Other" && (
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Describe Mistake Details"
                        placeholder="Enter details of what went wrong..."
                        value={tradeForm.customMistake}
                        onChange={(e) => updateTradeField("customMistake", e.target.value)}
                        required
                      />
                    </Grid>
                  )}

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth size="small" multiline rows={2} label="Entry Reason" value={tradeForm.entryReason} onChange={(e) => updateTradeField("entryReason", e.target.value)} placeholder="Market structure, candle pattern, or liquidity sweep trigger" />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth size="small" multiline rows={2} label="Notes / Lessons Learned" value={tradeForm.notes} onChange={(e) => updateTradeField("notes", e.target.value)} placeholder="Key reflections, psychology lessons, adjustments..." />
                  </Grid>
                </Grid>

                {/* Summary + actions */}
                <Box
                  sx={{
                    mt: 1.5,
                    pt: 1.2,
                    borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    alignItems: { xs: "flex-start", sm: "center" },
                    gap: 1.2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
                    <Chip label={`${tradeForm.symbol} • ${tradeForm.direction}`} size="small" sx={{ fontWeight: 600, height: 22, fontSize: "0.68rem" }} />
                    <Chip label={`Risk: ${formCurrencySymbol}${tradeForm.plannedRiskAmount || "0"}`} size="small" sx={{ fontWeight: 600, height: 22, fontSize: "0.68rem", bgcolor: "rgba(239,68,68,0.15)", color: "#EF4444" }} />
                    {tradeForm.netPnl !== "" && (
                      <Chip
                        label={`P&L: ${Number(tradeForm.netPnl) >= 0 ? "+" : ""}${formCurrencySymbol}${tradeForm.netPnl} (${tradeForm.actualRR})`}
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
                      {submittingTrade ? "Saving..." : "Submit Trade"}
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
          <Paper elevation={0} sx={{ ...cardSx(tk), height: "100%", minHeight: 420, p: 1.4, gap: 1.2 }}>
            {/* Filter Controls & Search */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
              <TextField
                size="small"
                placeholder="Filter by symbol, notes, strategy..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 17, color: tk.accent }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ minWidth: 260, "& .MuiInputBase-root": { height: 32, fontSize: "0.78rem" } }}
              />

              <Box sx={{ display: "flex", gap: 1, alignItems: "center", "& .MuiInputBase-root": { height: 32, fontSize: "0.78rem" } }}>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Status</InputLabel>
                  <Select value={historyStatus} label="Status" onChange={(e) => setHistoryStatus(e.target.value)}>
                    <MenuItem value="ALL">All Statuses</MenuItem>
                    <MenuItem value="CLOSED">Closed</MenuItem>
                    <MenuItem value="OPEN">Open</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Direction</InputLabel>
                  <Select value={historyDirection} label="Direction" onChange={(e) => setHistoryDirection(e.target.value)}>
                    <MenuItem value="ALL">All Directions</MenuItem>
                    <MenuItem value="BUY">Buy / Long</MenuItem>
                    <MenuItem value="SELL">Sell / Short</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ExportIcon />}
                  onClick={handleExportCSV}
                  sx={{ borderRadius: "6px", fontSize: "0.76rem", height: 32, textTransform: "none", fontWeight: 600 }}
                >
                  Export CSV
                </Button>
              </Box>
            </Box>

            {/* Table: scrolls inside its own viewport with a pinned header */}
            <Box
              sx={{
                flex: 1,
                minHeight: 240,
                overflow: "auto",
                border: `1px solid ${tk.border}`,
                borderRadius: "6px",
              }}
            >
              <Box
                component="table"
                sx={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  textAlign: "left",
                  fontSize: "0.76rem",
                  "& th": {
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    py: 0.8,
                    px: 1,
                    bgcolor: tk.isDark ? "#0E1A33" : "#F1F5F9",
                    color: tk.textSec,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontSize: "0.64rem",
                    whiteSpace: "nowrap",
                    borderBottom: `1px solid ${tk.borderHover}`,
                  },
                  "& td": {
                    py: 0.55,
                    px: 1,
                    color: tk.text,
                    whiteSpace: "nowrap",
                    borderBottom: `1px solid ${tk.grid}`,
                  },
                  "& .num": { textAlign: "right", fontFamily: MONO, fontVariantNumeric: "tabular-nums" },
                  "& .muted": { color: tk.textMuted },
                  "& tbody tr": { cursor: "pointer", transition: "background-color 0.12s ease" },
                  "& tbody tr:hover": { bgcolor: tk.hoverTint },
                  "& .pill": { display: "inline-block", px: 0.7, py: 0.1, borderRadius: "4px", fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.02em" },
                }}
              >
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date & Time</th>
                    <th>Symbol</th>
                    <th>Market</th>
                    <th>Side</th>
                    <th className="num">Entry</th>
                    <th className="num">Exit</th>
                    <th className="num">Lots</th>
                    <th className="num">SL / TP pts</th>
                    <th className="num">Risk</th>
                    <th className="num">P&L</th>
                    <th className="num">R</th>
                    <th>Result</th>
                    <th>Mistake</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.length === 0 ? (
                    <tr>
                      <td colSpan={15} style={{ textAlign: "center", padding: "32px", cursor: "default" }}>
                        <Typography variant="body2" sx={{ color: tk.textMuted }}>
                          No trades matching current filters
                        </Typography>
                      </td>
                    </tr>
                  ) : (
                    filteredTrades.map((t) => {
                      const cur = currencyOfAccount(t.account_id);
                      const isBuy = ["BUY", "LONG"].includes(t.direction);
                      const closed = t.status === "CLOSED" && t.net_pnl !== null && t.net_pnl !== undefined;
                      const result = t.result || (closed ? (t.net_pnl! > 0 ? "WIN" : t.net_pnl! < 0 ? "LOSS" : "BE") : "OPEN");
                      const resultColor = result === "WIN" ? tk.pos : result === "LOSS" ? tk.neg : result === "OPEN" ? tk.warn : tk.neutral;
                      const opened = new Date(t.opened_at);
                      const slPts = t.sl_points ?? (t.stop_loss ? Math.abs(t.entry_price - t.stop_loss).toFixed(1) : "–");
                      const tpPts = t.tp_points ?? (t.take_profit ? Math.abs(t.take_profit - t.entry_price).toFixed(1) : "–");
                      return (
                        <tr key={t.id} onClick={() => setSelectedTrade(t)}>
                          <td className="muted" style={{ fontFamily: MONO }}>#{t.trade_num || t.id.slice(-3)}</td>
                          <td>
                            {opened.toLocaleDateString([], { day: "2-digit", month: "short", year: "2-digit" })}
                            <Box component="span" className="muted" sx={{ ml: 0.7, fontFamily: MONO }}>
                              {opened.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                            </Box>
                          </td>
                          <td style={{ fontWeight: 600 }}>{t.symbol}</td>
                          <td className="muted">{t.market || "—"}</td>
                          <td>
                            <Box component="span" className="pill" sx={{ color: isBuy ? tk.pos : tk.neg, bgcolor: isBuy ? "rgba(16,185,129,0.14)" : "rgba(239,68,68,0.14)" }}>
                              {isBuy ? "BUY" : "SELL"}
                            </Box>
                          </td>
                          <td className="num">{t.entry_price}</td>
                          <td className="num">{t.exit_price ?? "–"}</td>
                          <td className="num">{t.volume ?? 1}</td>
                          <td className="num">
                            <Box component="span" sx={{ color: tk.neg }}>{slPts}</Box>
                            <Box component="span" className="muted"> / </Box>
                            <Box component="span" sx={{ color: tk.pos }}>{tpPts}</Box>
                          </td>
                          <td className="num">{t.planned_risk_amount != null ? `${cur}${Number(t.planned_risk_amount).toLocaleString()}` : "–"}</td>
                          <td className="num" style={{ fontWeight: 600, color: closed ? signColor(tk, Number(t.net_pnl)) : tk.textMuted }}>
                            {closed ? `${Number(t.net_pnl) >= 0 ? "+" : "−"}${cur}${Math.abs(Number(t.net_pnl)).toLocaleString()}` : "–"}
                          </td>
                          <td className="num" style={{ color: t.actual_r != null ? signColor(tk, Number(t.actual_r)) : tk.textMuted }}>
                            {t.actual_r != null ? `${Number(t.actual_r) > 0 ? "+" : ""}${t.actual_r}R` : "–"}
                          </td>
                          <td>
                            <Box component="span" className="pill" sx={{ color: resultColor, border: `1px solid ${resultColor}` }}>
                              {result === "BREAK_EVEN" ? "BE" : result}
                            </Box>
                          </td>
                          <td>
                            {t.mistake_flag ? (
                              <Box component="span" className="pill" sx={{ color: tk.neg, bgcolor: "rgba(239,68,68,0.14)" }}>YES</Box>
                            ) : (
                              <Box component="span" className="muted">No</Box>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <Tooltip title="View all fields" arrow>
                              <IconButton size="small" sx={{ p: 0.3, color: tk.accent }}>
                                <ViewIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Box>
            </Box>

            <Typography sx={{ fontSize: "0.68rem", color: tk.textMuted }}>
              Showing {filteredTrades.length} of {trades.length} trade{trades.length === 1 ? "" : "s"} · click a row for full details
            </Typography>
          </Paper>
        )}

        {/* ============================================================ */}
        {/* TAB 3: TRADING CALENDAR                                      */}
        {/* ============================================================ */}
        {activeTab === 3 && (
          <TradingCalendarView
            trades={accountTrades}
            currencySymbol={activeCurrencySymbol}
            isDark={isDark}
            onSelectTrade={(trade) => setSelectedTrade(trade)}
          />
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

              {reviews.length === 0 && (
                <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", textAlign: "center", py: 4 }}>
                  No daily reviews yet. Reviews you record will appear here.
                </Typography>
              )}
              <Grid container spacing={2}>
                {reviews.map((r) => (
                  <Grid key={r.id} size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: "6px", bgcolor: isDark ? "#050912" : "#F8FAFC", border: isDark ? "1px solid rgba(56, 189, 248, 0.15)" : "1px solid #E2E8F0" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#38BDF8" }}>
                          Review Date: {new Date(r.review_date).toLocaleDateString()}
                        </Typography>
                        {r.daily_rating ? <Rating value={r.daily_rating} readOnly size="small" /> : <Typography variant="caption" sx={{ color: "text.secondary" }}>Not rated</Typography>}
                      </Box>

                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: "#10B981", display: "block" }}>
                          WHAT WENT WELL:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "0.82rem" }}>
                          {r.what_went_well || "—"}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: "#EF4444", display: "block" }}>
                          WHAT WENT WRONG / MISTAKES:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "0.82rem" }}>
                          {r.what_went_wrong || "—"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: "#8B5CF6", display: "block" }}>
                          LESSONS & NEXT SESSION PLAN:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "0.82rem" }}>
                          {r.next_session_plan || r.lessons || "—"}
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
          <Grid container spacing={1.5}>
            {activeAccounts.map((acc) => {
              const isActive = selectedAccountId === acc.id;
              const starting = Number(acc.starting_balance) || 0;
              const current = acc.current_balance != null ? Number(acc.current_balance) : starting;
              const netProfit = current - starting;
              const growthPct = starting > 0 ? (netProfit / starting) * 100 : 0;
              const cur = currencySymbol(acc.currency);
              const money = (v: number) => `${cur}${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
              const typeColor = ACCOUNT_TYPE_COLOR[acc.account_type?.toLowerCase()] ?? tk.warn;
              const growthColor = signColor(tk, netProfit);

              return (
                <Grid key={acc.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      ...cardSx(tk),
                      p: 0,
                      overflow: "hidden",
                      borderColor: isActive ? tk.accent : tk.border,
                      boxShadow: isActive ? `0 0 0 1px ${tk.accent}, 0 8px 24px rgba(2, 132, 199, 0.15)` : "none",
                      transition: "border-color 0.15s ease, transform 0.15s ease",
                      "&:hover": { borderColor: isActive ? tk.accent : tk.borderHover, transform: "translateY(-1px)" },
                    }}
                  >
                    {/* Type accent strip */}
                    <Box sx={{ height: 3, bgcolor: typeColor, opacity: 0.9 }} />

                    <Box sx={{ p: 1.6, display: "flex", flexDirection: "column", gap: 1.2, flex: 1 }}>
                      {/* Header */}
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.6 }}>
                            <Box
                              component="span"
                              sx={{ px: 0.7, py: 0.1, borderRadius: "4px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em", color: typeColor, border: `1px solid ${typeColor}` }}
                            >
                              {acc.account_type.toUpperCase()}
                            </Box>
                            <Box component="span" sx={{ px: 0.7, py: 0.1, borderRadius: "4px", fontSize: "0.6rem", fontWeight: 700, color: tk.textSec, bgcolor: tk.tint, border: `1px solid ${tk.border}` }}>
                              {acc.currency}
                            </Box>
                          </Box>
                          <Typography noWrap sx={{ fontWeight: 600, fontSize: "0.95rem", color: tk.text }}>
                            {acc.name}
                          </Typography>
                          <Typography noWrap sx={{ fontSize: "0.7rem", color: tk.textMuted, mt: 0.2 }}>
                            {acc.description || "No description"}
                          </Typography>
                        </Box>
                        {isActive && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 0.8, py: 0.25, borderRadius: "999px", bgcolor: "rgba(56, 189, 248, 0.12)", color: tk.accent, fontSize: "0.62rem", fontWeight: 700, flexShrink: 0 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: tk.accent, animation: "brand-pulse 2.4s ease-in-out infinite" }} />
                            ACTIVE
                          </Box>
                        )}
                      </Box>

                      {/* Equity hero */}
                      <Box>
                        <Typography sx={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: tk.textMuted }}>
                          Current equity
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
                          <Typography sx={{ fontFamily: MONO, fontWeight: 600, fontSize: "1.35rem", color: tk.text, fontVariantNumeric: "tabular-nums" }}>
                            {money(current)}
                          </Typography>
                          <Box
                            component="span"
                            sx={{ fontFamily: MONO, fontSize: "0.7rem", fontWeight: 600, color: growthColor, bgcolor: netProfit === 0 ? tk.tint : netProfit > 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", px: 0.7, py: 0.15, borderRadius: "4px" }}
                          >
                            {growthPct > 0 ? "+" : growthPct < 0 ? "−" : ""}
                            {Math.abs(growthPct).toFixed(2)}%
                          </Box>
                        </Box>
                      </Box>

                      {/* Stats */}
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.8 }}>
                        {[
                          { label: "Starting capital", value: money(starting), color: tk.text },
                          { label: "Net P&L", value: `${netProfit > 0 ? "+" : netProfit < 0 ? "−" : ""}${money(netProfit)}`, color: growthColor },
                        ].map((s) => (
                          <Box key={s.label} sx={{ p: 0.9, borderRadius: "6px", bgcolor: tk.tint, border: `1px solid ${tk.border}` }}>
                            <Typography sx={{ fontSize: "0.62rem", color: tk.textMuted }}>{s.label}</Typography>
                            <Typography sx={{ fontFamily: MONO, fontWeight: 600, fontSize: "0.85rem", color: s.color, mt: 0.2 }}>{s.value}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1.6, py: 0.9, borderTop: `1px solid ${tk.border}`, bgcolor: tk.tint }}>
                      {isActive ? (
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: tk.accent }}>Viewing this account</Typography>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setSelectedAccountId(acc.id)}
                          sx={{ fontSize: "0.72rem", height: 28, px: 1.4, textTransform: "none", fontWeight: 600, borderRadius: "6px" }}
                        >
                          Set as active
                        </Button>
                      )}

                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="Edit account" arrow>
                          <IconButton size="small" onClick={() => handleOpenEditAccount(acc)} sx={{ width: 28, height: 28, borderRadius: "6px", border: `1px solid ${tk.border}`, color: tk.textSec, "&:hover": { color: tk.accent, borderColor: tk.accent } }}>
                            <EditIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Deactivate account" arrow>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setAccountToDelete(acc);
                              setDeleteAccountDialogOpen(true);
                            }}
                            sx={{ width: 28, height: 28, borderRadius: "6px", border: `1px solid ${tk.border}`, color: tk.textSec, "&:hover": { color: tk.neg, borderColor: tk.neg } }}
                          >
                            <DeleteIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}

            {/* Add account tile */}
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <Box
                role="button"
                tabIndex={0}
                onClick={handleOpenCreateAccount}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleOpenCreateAccount()}
                sx={{
                  height: "100%",
                  minHeight: 220,
                  borderRadius: "8px",
                  border: `1px dashed ${tk.borderHover}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.8,
                  color: tk.textMuted,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover, &:focus-visible": { color: tk.accent, borderColor: tk.accent, bgcolor: tk.hoverTint, outline: "none" },
                }}
              >
                <Box sx={{ width: 36, height: 36, borderRadius: "8px", display: "grid", placeItems: "center", border: "1px solid currentColor" }}>
                  <AddIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>Add trading account</Typography>
                <Typography sx={{ fontSize: "0.68rem", color: tk.textMuted }}>Live, funded or backtest</Typography>
              </Box>
            </Grid>

            {inactiveAccounts.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper elevation={0} sx={{ ...cardSx(tk), height: "auto", p: 1.4 }}>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: tk.textMuted, mb: 0.8 }}>
                    Inactive accounts ({inactiveAccounts.length})
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6 }}>
                    {inactiveAccounts.map((acc) => (
                      <Box
                        key={acc.id}
                        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, px: 1.2, py: 0.8, borderRadius: "6px", border: `1px solid ${tk.border}`, bgcolor: tk.tint }}
                      >
                        <Box sx={{ minWidth: 0, display: "flex", alignItems: "center", gap: 1 }}>
                          <Box component="span" sx={{ px: 0.7, py: 0.1, borderRadius: "4px", fontSize: "0.6rem", fontWeight: 700, color: tk.textMuted, border: `1px solid ${tk.border}` }}>
                            INACTIVE
                          </Box>
                          <Typography noWrap sx={{ fontSize: "0.82rem", fontWeight: 600, color: tk.textSec }}>{acc.name}</Typography>
                          <Typography noWrap sx={{ fontSize: "0.7rem", color: tk.textMuted, fontFamily: MONO }}>
                            {acc.account_type?.toUpperCase()} · {acc.currency}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={accountActionLoading}
                          onClick={() => handleReactivateAccount(acc)}
                          sx={{ fontSize: "0.72rem", height: 28, px: 1.4, textTransform: "none", fontWeight: 600, borderRadius: "6px", flexShrink: 0 }}
                        >
                          Reactivate
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
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
                    <MenuItem value="live">Live</MenuItem>
                    <MenuItem value="funded">Funded / Prop</MenuItem>
                    <MenuItem value="backtest">Backtest</MenuItem>
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
          Deactivate Account?
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Deactivate <strong>{accountToDelete?.name}</strong>?
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            It is hidden from the journal and its trades leave your totals, but nothing is erased. You can reactivate it any time from Inactive accounts.
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
            {accountActionLoading ? "Deactivating..." : "Deactivate"}
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
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.trade_num ? `#${selectedTrade.trade_num}` : "—"}</Typography>
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
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.strategy_name || "—"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>7. Session:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.session || "—"}</Typography>
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
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.volume ?? "—"}</Typography>
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
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#EF4444" }}>{selectedTrade.planned_risk_amount != null ? `${currencyOfAccount(selectedTrade.account_id)}${selectedTrade.planned_risk_amount}` : "—"}</Typography>
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
                      {selectedTrade.net_pnl == null
                        ? "—"
                        : `${selectedTrade.net_pnl >= 0 ? "+" : "−"}${currencyOfAccount(selectedTrade.account_id)}${Math.abs(selectedTrade.net_pnl)}`}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.6 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Actual R:R:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#8B5CF6" }}>{selectedTrade.actual_r ? `${selectedTrade.actual_r}R` : "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.6 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Result:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: (selectedTrade.net_pnl || 0) >= 0 ? "#10B981" : "#EF4444" }}>
                      {selectedTrade.result || (selectedTrade.net_pnl == null ? "OPEN" : selectedTrade.net_pnl > 0 ? "WIN" : selectedTrade.net_pnl < 0 ? "LOSS" : "BREAK_EVEN")}
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
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.emotion_before || "—"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Exit Emotion:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.emotion_after || "—"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.5 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Confidence (1-5):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#38BDF8" }}>{selectedTrade.confidence_rating ? `${selectedTrade.confidence_rating}/5` : "—"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.5 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Discipline (1-5):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#10B981" }}>{selectedTrade.discipline_rating ? `${selectedTrade.discipline_rating}/5` : "—"}</Typography>
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
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.market_condition || "—"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Exit Reason:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTrade.exit_reason || "—"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Entry Reason:</Typography>
                    <Typography variant="body2" sx={{ fontStyle: "italic", bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", p: 1, borderRadius: "4px" }}>
                      {selectedTrade.entry_reason || "—"}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Notes / Lessons Learned:</Typography>
                    <Typography variant="body2" sx={{ bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", p: 1, borderRadius: "4px" }}>
                      {selectedTrade.notes || selectedTrade.lessons_learned || "—"}
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
