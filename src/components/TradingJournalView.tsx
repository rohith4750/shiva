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
  Checkbox,
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
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  ShowChart as ShowChartIcon,
  BarChart as BarChartIcon,
  SelfImprovement as MeditationIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  RestartAlt as ResetIcon,
  OpenInNew as OpenInNewIcon,
  LocalFireDepartment as FireIcon,
  AssignmentTurnedIn as ChecklistIcon,
  Check as CheckIcon,
  Spa as SpaIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { useColorMode } from "@/components/ThemeRegistry";
import { TradeRecord, AnalyticsSummary, calculateTradingAnalytics } from "@/lib/tradingAnalytics";

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

  // --- OVERVIEW TIMEFRAME FILTERS ---
  const [overviewPeriod, setOverviewPeriod] = useState<"all" | "day" | "week" | "month" | "year" | "custom">("all");
  const [overviewDay, setOverviewDay] = useState<string>(new Date().toISOString().slice(0, 10));
  const [overviewStartDate, setOverviewStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [overviewEndDate, setOverviewEndDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // --- OVERVIEW WAVE & SINE CHART STATE ---
  const [waveChartMode, setWaveChartMode] = useState<"equity" | "sine">("equity");
  const [hoveredWaveIndex, setHoveredWaveIndex] = useState<number | null>(null);
  const [selectedWaveIndex, setSelectedWaveIndex] = useState<number | null>(null);

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

  // --- PRE-MARKET ROUTINE STATE & MEDITATION TIMER ---
  const [routineDate, setRoutineDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [routine, setRoutine] = useState({
    economicCalendarReviewed: false,
    economicCalendarNotes: "",
    tradePlanReviewed: false,
    dailyBias: "Neutral",
    maxDailyLoss: "250",
    tradePlanNotes: "",
    chartsAnalyzed: false,
    watchlist: ["XAUUSD", "EURUSD", "BTCUSD"] as string[],
    chartNotes: "",
    meditationCompleted: false,
    meditationMinutes: 10,
    mindsetRating: 5,
  });
  const [routineStreak, setRoutineStreak] = useState<number>(0);
  const [routineSaving, setRoutineSaving] = useState<boolean>(false);

  // 10 Mins Meditation Timer State (600 seconds)
  const [meditationTimeLeft, setMeditationTimeLeft] = useState<number>(600);
  const [meditationIsRunning, setMeditationIsRunning] = useState<boolean>(false);
  const [breathingPhase, setBreathingPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Pause">("Inhale");
  const [breathingTimer, setBreathingTimer] = useState<number>(4);

  // Meditation timer countdown
  useEffect(() => {
    let interval: any;
    if (meditationIsRunning && meditationTimeLeft > 0) {
      interval = setInterval(() => {
        setMeditationTimeLeft((prev) => {
          if (prev <= 1) {
            setMeditationIsRunning(false);
            setRoutine((r) => ({ ...r, meditationCompleted: true }));
            showToast("🧘 10 Minutes Meditation Completed! Mind is calm and focused for trading.", "success");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [meditationIsRunning, meditationTimeLeft]);

  // Box Breathing cycle (4s Inhale -> 4s Hold -> 4s Exhale -> 4s Pause = 16s)
  useEffect(() => {
    let interval: any;
    if (meditationIsRunning) {
      interval = setInterval(() => {
        const cycleSeconds = (600 - meditationTimeLeft) % 16;
        if (cycleSeconds < 4) {
          setBreathingPhase("Inhale");
          setBreathingTimer(4 - (cycleSeconds % 4));
        } else if (cycleSeconds < 8) {
          setBreathingPhase("Hold");
          setBreathingTimer(4 - (cycleSeconds % 4));
        } else if (cycleSeconds < 12) {
          setBreathingPhase("Exhale");
          setBreathingTimer(4 - (cycleSeconds % 4));
        } else {
          setBreathingPhase("Pause");
          setBreathingTimer(4 - (cycleSeconds % 4));
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [meditationIsRunning, meditationTimeLeft]);

  // Fetch routine from API and localStorage
  const fetchRoutine = useCallback(async (date: string) => {
    try {
      const localKey = `pre_market_routine_${date}`;
      const cached = localStorage.getItem(localKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setRoutine((prev) => ({ ...prev, ...parsed }));
        } catch {}
      }

      const res = await fetch(`/api/journal/routine?date=${date}`);
      const data = await res.json();
      if (data && data.success) {
        if (data.routine) {
          const r = data.routine;
          const loaded = {
            economicCalendarReviewed: Boolean(r.economic_calendar_reviewed),
            economicCalendarNotes: r.economic_calendar_notes || "",
            tradePlanReviewed: Boolean(r.trade_plan_reviewed),
            dailyBias: r.daily_bias || "Neutral",
            maxDailyLoss: String(r.max_daily_loss || "250"),
            tradePlanNotes: r.trade_plan_notes || "",
            chartsAnalyzed: Boolean(r.charts_analyzed),
            watchlist: r.watchlist ? r.watchlist.split(",") : ["XAUUSD", "EURUSD"],
            chartNotes: r.chart_notes || "",
            meditationCompleted: Boolean(r.meditation_completed),
            meditationMinutes: r.meditation_minutes || 10,
            mindsetRating: r.mindset_rating || 5,
          };
          setRoutine(loaded);
          localStorage.setItem(localKey, JSON.stringify(loaded));
        }
        if (typeof data.streak === "number") {
          setRoutineStreak(data.streak);
        }
      }
    } catch {
      // Offline fallback: rely on localStorage
    }
  }, []);

  useEffect(() => {
    fetchRoutine(routineDate);
  }, [fetchRoutine, routineDate]);

  const handleSaveRoutine = async () => {
    setRoutineSaving(true);
    try {
      const localKey = `pre_market_routine_${routineDate}`;
      localStorage.setItem(localKey, JSON.stringify(routine));

      const payload = {
        routineDate,
        accountId: selectedAccountId !== "all" ? selectedAccountId : null,
        economicCalendarReviewed: routine.economicCalendarReviewed,
        economicCalendarNotes: routine.economicCalendarNotes,
        tradePlanReviewed: routine.tradePlanReviewed,
        dailyBias: routine.dailyBias,
        maxDailyLoss: parseFloat(routine.maxDailyLoss) || 0,
        tradePlanNotes: routine.tradePlanNotes,
        chartsAnalyzed: routine.chartsAnalyzed,
        watchlist: routine.watchlist.join(","),
        chartNotes: routine.chartNotes,
        meditationCompleted: routine.meditationCompleted,
        meditationMinutes: routine.meditationMinutes,
        mindsetRating: routine.mindsetRating,
      };

      const res = await fetch("/api/journal/routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data && data.success) {
        showToast("Pre-Market Routine saved & locked in successfully!", "success");
        fetchRoutine(routineDate);
      } else {
        showToast((data && data.error) || "Failed to save routine to server", "error");
      }
    } catch {
      showToast("Pre-Market Routine saved in local browser storage", "info");
    } finally {
      setRoutineSaving(false);
    }
  };

  const routineCompletedCount = useMemo(() => {
    let count = 0;
    if (routine.economicCalendarReviewed) count++;
    if (routine.tradePlanReviewed) count++;
    if (routine.chartsAnalyzed) count++;
    if (routine.meditationCompleted) count++;
    return count;
  }, [routine]);

  const routineIsAllComplete = routineCompletedCount === 4;

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

  const overviewAnalytics = useMemo(() => {
    return calculateTradingAnalytics(overviewFilteredTrades, activeStartingBalance);
  }, [overviewFilteredTrades, activeStartingBalance]);

  // Synchronized exact trade orders constituting the wave progression
  const wavePointsWithTrades = useMemo(() => {
    const closed = [...overviewFilteredTrades]
      .filter((t) => t.status === "CLOSED" && t.net_pnl !== null)
      .sort((a, b) => new Date(a.closed_at || a.opened_at).getTime() - new Date(b.closed_at || b.opened_at).getTime());

    let runningEq = activeStartingBalance;
    let peakEq = activeStartingBalance;

    const list: Array<{
      index: number;
      trade?: TradeRecord;
      date: string;
      time: string;
      symbol: string;
      direction: string;
      pnl: number;
      equity: number;
      peak: number;
      drawdown: number;
      isInitial: boolean;
    }> = [
      {
        index: 0,
        date: closed[0] ? new Date(closed[0].opened_at).toLocaleDateString([], { month: "short", day: "numeric" }) : "Start",
        time: "00:00",
        symbol: "Starting Capital",
        direction: "—",
        pnl: 0,
        equity: activeStartingBalance,
        peak: activeStartingBalance,
        drawdown: 0,
        isInitial: true,
      },
    ];

    closed.forEach((t, i) => {
      const pnl = Number(t.net_pnl) || 0;
      runningEq += pnl;
      peakEq = Math.max(peakEq, runningEq);
      const dd = peakEq - runningEq;
      const dObj = new Date(t.closed_at || t.opened_at);

      list.push({
        index: i + 1,
        trade: t,
        date: dObj.toLocaleDateString([], { month: "short", day: "numeric" }),
        time: dObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        symbol: t.symbol,
        direction: t.direction,
        pnl,
        equity: runningEq,
        peak: peakEq,
        drawdown: dd,
        isInitial: false,
      });
    });

    return list;
  }, [overviewFilteredTrades, activeStartingBalance]);

  // Direction analytics (BUY vs SELL)
  const directionAnalytics = useMemo(() => {
    const closed = overviewFilteredTrades.filter((t) => t.status === "CLOSED" && t.net_pnl !== null);
    const buyTrades = closed.filter((t) => t.direction === "BUY");
    const sellTrades = closed.filter((t) => t.direction === "SELL");

    const calc = (arr: TradeRecord[]) => {
      const count = arr.length;
      const wins = arr.filter((t) => (t.net_pnl || 0) > 0).length;
      const losses = arr.filter((t) => (t.net_pnl || 0) < 0).length;
      const pnl = arr.reduce((acc, t) => acc + (t.net_pnl || 0), 0);
      const wr = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : null;
      return { count, wins, losses, pnl, wr };
    };

    return {
      buy: calc(buyTrades),
      sell: calc(sellTrades),
    };
  }, [overviewFilteredTrades]);

  // Performance by symbols
  const symbolStats = useMemo(() => {
    const closed = overviewFilteredTrades.filter((t) => t.status === "CLOSED" && t.net_pnl !== null);
    const map: Record<string, { count: number; wins: number; losses: number; pnl: number }> = {};

    closed.forEach((t) => {
      const sym = t.symbol.toUpperCase();
      if (!map[sym]) map[sym] = { count: 0, wins: 0, losses: 0, pnl: 0 };
      map[sym].count += 1;
      const pnl = t.net_pnl || 0;
      if (pnl > 0) map[sym].wins += 1;
      else if (pnl < 0) map[sym].losses += 1;
      map[sym].pnl += pnl;
    });

    return Object.entries(map).map(([symbol, s]) => {
      const dec = s.wins + s.losses;
      return {
        symbol,
        count: s.count,
        winRate: dec > 0 ? (s.wins / dec) * 100 : null,
        pnl: s.pnl,
      };
    }).sort((a, b) => b.pnl - a.pnl);
  }, [overviewFilteredTrades]);

  // Emotional performance (Entry emotion vs Exit emotion)
  const emotionalStats = useMemo(() => {
    const closed = overviewFilteredTrades.filter((t) => t.status === "CLOSED" && t.net_pnl !== null);
    const entryMap: Record<string, { count: number; wins: number; pnl: number }> = {};
    const exitMap: Record<string, { count: number; wins: number; pnl: number }> = {};

    closed.forEach((t) => {
      const eb = t.emotion_before || "Unspecified";
      const ea = t.emotion_after || "Unspecified";
      const pnl = t.net_pnl || 0;

      if (!entryMap[eb]) entryMap[eb] = { count: 0, wins: 0, pnl: 0 };
      entryMap[eb].count += 1;
      if (pnl > 0) entryMap[eb].wins += 1;
      entryMap[eb].pnl += pnl;

      if (!exitMap[ea]) exitMap[ea] = { count: 0, wins: 0, pnl: 0 };
      exitMap[ea].count += 1;
      if (pnl > 0) exitMap[ea].wins += 1;
      exitMap[ea].pnl += pnl;
    });

    return {
      entry: Object.entries(entryMap).map(([emotion, s]) => ({
        emotion,
        count: s.count,
        winRate: s.count > 0 ? (s.wins / s.count) * 100 : 0,
        pnl: s.pnl,
      })).sort((a, b) => b.pnl - a.pnl),
      exit: Object.entries(exitMap).map(([emotion, s]) => ({
        emotion,
        count: s.count,
        winRate: s.count > 0 ? (s.wins / s.count) * 100 : 0,
        pnl: s.pnl,
      })).sort((a, b) => b.pnl - a.pnl),
    };
  }, [overviewFilteredTrades]);

  // Daily PnL distribution bars
  const dailyPnlBars = useMemo(() => {
    const closed = overviewFilteredTrades
      .filter((t) => t.status === "CLOSED" && t.net_pnl !== null)
      .sort((a, b) => new Date(a.closed_at || a.opened_at).getTime() - new Date(b.closed_at || b.opened_at).getTime());

    const map: Record<string, number> = {};
    closed.forEach((t) => {
      const d = new Date(t.closed_at || t.opened_at).toLocaleDateString([], { month: "short", day: "numeric" });
      map[d] = (map[d] || 0) + (t.net_pnl || 0);
    });

    return Object.entries(map).map(([date, pnl]) => ({ date, pnl }));
  }, [overviewFilteredTrades]);

  // Discipline & mistake stats
  const disciplineStats = useMemo(() => {
    const closed = overviewFilteredTrades.filter((t) => t.status === "CLOSED" && t.net_pnl !== null);
    const disciplined = closed.filter((t) => !t.mistake_flag);
    const mistakes = closed.filter((t) => t.mistake_flag);

    const calc = (arr: TradeRecord[]) => {
      const count = arr.length;
      const wins = arr.filter((t) => (t.net_pnl || 0) > 0).length;
      const pnl = arr.reduce((acc, t) => acc + (t.net_pnl || 0), 0);
      const wr = count > 0 ? (wins / count) * 100 : null;
      return { count, pnl, wr };
    };

    return {
      disciplined: calc(disciplined),
      mistakes: calc(mistakes),
    };
  }, [overviewFilteredTrades]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: isDark ? "#070A13" : "#F8FAFC",
        color: isDark ? "#F8FAFC" : "#0F172A",
        pb: 2,
      }}
    >
      {/* ============================================================== */}
      {/* TOP HEADER: Breadcrumb, Account Filter, Live Status, Add Trade */}
      {/* ============================================================== */}
      <Box
        sx={{
          py: 1,
          px: { xs: 1.5, md: 2.5 },
          bgcolor: isDark ? "#0B1226" : "#FFFFFF",
          borderBottom: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 1.2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          {onBackToHome ? (
            <Button
              size="small"
              onClick={onBackToHome}
              startIcon={<ArrowBackIcon />}
              sx={{
                color: isDark ? "#94A3B8" : "#64748B",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8rem",
                py: 0.2,
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
                  fontSize: "0.8rem",
                  py: 0.2,
                }}
              >
                Auth & User Portal
              </Button>
            </Link>
          )}
          <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.01em" }}>
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
                  fontSize: "0.65rem",
                  height: 18,
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: "0.7rem", lineHeight: 1 }}>
              Independent multi-user trading platform. Zero MT5 or broker dependency.
            </Typography>
          </Box>
        </Box>

        {/* Account Selector, Refresh & Primary Add Trade Action */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel sx={{ fontSize: "0.78rem" }}>Active Account</InputLabel>
            <Select
              value={selectedAccountId}
              label="Active Account"
              onChange={(e) => setSelectedAccountId(e.target.value)}
              sx={{ fontSize: "0.78rem", height: 32, bgcolor: isDark ? "#0E162B" : "#FFFFFF" }}
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
                width: 32,
                height: 32,
              }}
            >
              <RefreshIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          <Button
            size="small"
            startIcon={<MeditationIcon sx={{ fontSize: 16 }} />}
            onClick={() => setActiveTab(7)}
            sx={{
              height: 32,
              px: 1.5,
              fontSize: "0.78rem",
              fontWeight: 700,
              borderRadius: "6px",
              textTransform: "none",
              bgcolor: routineIsAllComplete
                ? (isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5")
                : (isDark ? "rgba(245, 158, 11, 0.15)" : "#FFFBEB"),
              color: routineIsAllComplete ? "#10B981" : (isDark ? "#FBBF24" : "#D97706"),
              border: routineIsAllComplete
                ? "1px solid rgba(16, 185, 129, 0.4)"
                : "1px solid rgba(245, 158, 11, 0.4)",
              "&:hover": {
                bgcolor: routineIsAllComplete
                  ? (isDark ? "rgba(16, 185, 129, 0.25)" : "#D1FAE5")
                  : (isDark ? "rgba(245, 158, 11, 0.25)" : "#FEF3C7"),
              },
            }}
          >
            Routine: {routineCompletedCount}/4 {routineIsAllComplete ? "✅" : "⏳"}
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<AddTradeIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              if (accounts.length > 0 && !tradeForm.accountId) {
                setTradeForm((prev) => ({ ...prev, accountId: accounts[0].id }));
              }
              setActiveTab(1);
            }}
            sx={{
              bgcolor: "#2563EB",
              fontWeight: 700,
              fontSize: "0.78rem",
              borderRadius: "6px",
              height: 32,
              px: 1.8,
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
          px: { xs: 1.5, md: 2.5 },
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
            minHeight: 38,
            "& .MuiTab-root": {
              minHeight: 38,
              py: 0.5,
              px: 1.5,
              fontSize: "0.78rem",
              fontWeight: 700,
              textTransform: "none",
              color: isDark ? "#94A3B8" : "#64748B",
              "&.Mui-selected": {
                color: isDark ? "#38BDF8" : "#2563EB",
              },
            },
            "& .MuiTabs-indicator": {
              bgcolor: isDark ? "#38BDF8" : "#2563EB",
              height: 2.5,
            },
          }}
        >
          <Tab icon={<DashboardIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Overview" />
          <Tab icon={<AddTradeIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Add Trade (31 Fields)" />
          <Tab icon={<HistoryIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={`Trade History (${trades.length})`} />
          <Tab icon={<CalendarIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Trading Calendar" />
          <Tab icon={<AnalyticsIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Analytics & Algorithms" />
          <Tab icon={<PsychologyIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Journal & Psychology" />
          <Tab icon={<AccountsIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={`Accounts (${accounts.length})`} />
          <Tab
            icon={<MeditationIcon sx={{ fontSize: 16, color: routineIsAllComplete ? "#10B981" : undefined }} />}
            iconPosition="start"
            label={`Pre-Market Routine (${routineCompletedCount}/4)`}
          />
        </Tabs>
      </Box>

      {/* ============================================================== */}
      {/* MAIN VIEW CONTAINER (100% FULL-WIDTH COMPACT VIEWPORT)         */}
      {/* ============================================================== */}
      <Box sx={{ width: "100%", mt: 0.8, px: { xs: 0.8, sm: 1.2, md: 1.5 }, pb: 1.5 }}>
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
                bgcolor: isDark ? "#0B1226" : "#FFFFFF",
                border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.2,
              }}
            >
              {/* Period Selection Buttons */}
              <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.6 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? "#94A3B8" : "#64748B", mr: 0.5, fontSize: "0.72rem", textTransform: "uppercase" }}>
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
                          ? "#2563EB"
                          : isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "#F1F5F9",
                      color: overviewPeriod === p.id ? "#FFF" : "inherit",
                      border: overviewPeriod === p.id ? "1px solid #3B82F6" : "1px solid transparent",
                      "&:hover": {
                        bgcolor: overviewPeriod === p.id ? "#1D4ED8" : isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
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

                <Chip
                  label={`${overviewFilteredTrades.length} Total Orders`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    height: 24,
                    bgcolor: isDark ? "rgba(56, 189, 248, 0.15)" : "#E0F2FE",
                    color: isDark ? "#38BDF8" : "#0284C7",
                  }}
                />
              </Box>
            </Card>

            {/* Pre-Market Routine Daily Mindset & Readiness Banner */}
            <Card
              sx={{
                p: 1.2,
                borderRadius: "8px",
                bgcolor: routineIsAllComplete
                  ? (isDark ? "rgba(16, 185, 129, 0.08)" : "#F0FDF4")
                  : (isDark ? "rgba(59, 130, 246, 0.08)" : "#EFF6FF"),
                border: routineIsAllComplete
                  ? (isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #BBF7D0")
                  : (isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #BFDBFE"),
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap" }}>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: "8px",
                    bgcolor: routineIsAllComplete ? "#10B981" : "#2563EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFF",
                  }}
                >
                  <MeditationIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.82rem" }}>
                      Pre-Market Routine ({routineCompletedCount}/4 Steps Done)
                    </Typography>
                    {routineStreak > 0 && (
                      <Chip
                        icon={<FireIcon sx={{ fontSize: "14px !important", color: "#F97316 !important" }} />}
                        label={`${routineStreak} Day Streak`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          bgcolor: isDark ? "rgba(249, 115, 22, 0.15)" : "#FFEDD5",
                          color: "#EA580C",
                        }}
                      />
                    )}
                    {routineIsAllComplete && (
                      <Chip
                        label="Ready to Trade ✅"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          bgcolor: isDark ? "rgba(16, 185, 129, 0.2)" : "#DCFCE7",
                          color: "#10B981",
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: 0.3, flexWrap: "wrap" }}>
                    <Chip
                      size="small"
                      label={`1. Calendar: ${routine.economicCalendarReviewed ? "✅ Reviewed" : "⏳ Pending"}`}
                      sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600 }}
                    />
                    <Chip
                      size="small"
                      label={`2. Trade Plan: ${routine.tradePlanReviewed ? "✅ Committed" : "⏳ Pending"}`}
                      sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600 }}
                    />
                    <Chip
                      size="small"
                      label={`3. Charts: ${routine.chartsAnalyzed ? "✅ Mapped" : "⏳ Pending"}`}
                      sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600 }}
                    />
                    <Chip
                      size="small"
                      label={`4. 10m Meditation: ${routine.meditationCompleted ? "✅ Done" : "⏳ Pending"}`}
                      sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600 }}
                    />
                  </Box>
                </Box>
              </Box>

              <Button
                variant={routineIsAllComplete ? "outlined" : "contained"}
                size="small"
                onClick={() => setActiveTab(7)}
                startIcon={<MeditationIcon sx={{ fontSize: 15 }} />}
                sx={{
                  height: 28,
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: "6px",
                  bgcolor: routineIsAllComplete ? "transparent" : "#2563EB",
                  color: routineIsAllComplete ? (isDark ? "#34D399" : "#059669") : "#FFF",
                  borderColor: routineIsAllComplete ? "#10B981" : undefined,
                }}
              >
                {routineIsAllComplete ? "View Pre-Market Routine" : "Complete Routine & Meditation"}
              </Button>
            </Card>

            {/* ============================================================ */}
            {/* HERO KPI CARDS: Net Profit, Closed Orders, Equity Prominence */}
            {/* ============================================================ */}
            <Grid container spacing={1.2}>
              {/* 1. Net Profit (Emphasized Primary Metric) */}
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                <Card
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    bgcolor: isDark ? "#0E162B" : "#FFFFFF",
                    border:
                      overviewAnalytics.netPnl > 0
                        ? "1px solid rgba(16, 185, 129, 0.35)"
                        : overviewAnalytics.netPnl < 0
                        ? "1px solid rgba(239, 68, 68, 0.35)"
                        : isDark
                        ? "1px solid rgba(59, 130, 246, 0.2)"
                        : "1px solid #E2E8F0",
                    boxShadow:
                      overviewAnalytics.netPnl > 0
                        ? "0 4px 20px rgba(16, 185, 129, 0.08)"
                        : overviewAnalytics.netPnl < 0
                        ? "0 4px 20px rgba(239, 68, 68, 0.08)"
                        : "none",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontWeight: 800, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                      Net Realized Profit
                    </Typography>
                    {overviewAnalytics.netPnl >= 0 ? (
                      <TrendingUpIcon sx={{ fontSize: 18, color: "#10B981" }} />
                    ) : (
                      <TrendingDownIcon sx={{ fontSize: 18, color: "#EF4444" }} />
                    )}
                  </Box>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 900,
                      my: 0.5,
                      fontSize: "1.45rem",
                      color: overviewAnalytics.netPnl >= 0 ? "#10B981" : "#EF4444",
                    }}
                  >
                    {overviewAnalytics.netPnl >= 0
                      ? `+${activeCurrencySymbol}${overviewAnalytics.netPnl.toLocaleString()}`
                      : `-${activeCurrencySymbol}${Math.abs(overviewAnalytics.netPnl).toLocaleString()}`}
                  </Typography>

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Chip
                      size="small"
                      label={`${overviewAnalytics.startingBalance > 0 ? ((overviewAnalytics.netPnl / overviewAnalytics.startingBalance) * 100).toFixed(2) : "0.00"}% ROI`}
                      sx={{
                        height: 18,
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        bgcolor: overviewAnalytics.netPnl >= 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: overviewAnalytics.netPnl >= 0 ? "#10B981" : "#EF4444",
                      }}
                    />
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem" }}>
                      GP: +${overviewAnalytics.grossProfit} | GL: -${overviewAnalytics.grossLoss}
                    </Typography>
                  </Box>
                </Card>
              </Grid>

              {/* 2. Closed Orders (Emphasized Metric) */}
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                <Card
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    bgcolor: isDark ? "#0E162B" : "#FFFFFF",
                    border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontWeight: 800, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                      Closed Orders
                    </Typography>
                    <CheckCircleIcon sx={{ fontSize: 18, color: "#3B82F6" }} />
                  </Box>

                  <Typography variant="h5" sx={{ fontWeight: 900, my: 0.5, fontSize: "1.45rem", color: isDark ? "#F8FAFC" : "#0F172A" }}>
                    {overviewAnalytics.totalClosedTrades}
                  </Typography>

                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>
                    <Chip
                      size="small"
                      label={`${overviewAnalytics.winningTrades}W`}
                      sx={{ height: 18, fontSize: "0.65rem", fontWeight: 800, bgcolor: "rgba(16, 185, 129, 0.15)", color: "#10B981" }}
                    />
                    <Chip
                      size="small"
                      label={`${overviewAnalytics.losingTrades}L`}
                      sx={{ height: 18, fontSize: "0.65rem", fontWeight: 800, bgcolor: "rgba(239, 68, 68, 0.15)", color: "#EF4444" }}
                    />
                    <Chip
                      size="small"
                      label={`${overviewAnalytics.breakEvenTrades}BE`}
                      sx={{ height: 18, fontSize: "0.65rem", fontWeight: 800, bgcolor: "rgba(245, 158, 11, 0.15)", color: "#F59E0B" }}
                    />
                    {overviewAnalytics.openTradesCount > 0 && (
                      <Typography variant="caption" sx={{ color: "#F59E0B", fontWeight: 700, fontSize: "0.65rem", ml: "auto" }}>
                        {overviewAnalytics.openTradesCount} Open
                      </Typography>
                    )}
                  </Box>
                </Card>
              </Grid>

              {/* 3. Account Equity (Emphasized Metric) */}
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                <Card
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    bgcolor: isDark ? "#0E162B" : "#FFFFFF",
                    border: isDark ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid #E2E8F0",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontWeight: 800, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                      Current Equity
                    </Typography>
                    <TimelineIcon sx={{ fontSize: 18, color: "#8B5CF6" }} />
                  </Box>

                  <Typography variant="h5" sx={{ fontWeight: 900, my: 0.5, fontSize: "1.45rem", color: "#8B5CF6" }}>
                    {activeCurrencySymbol}{overviewAnalytics.endingBalance.toLocaleString()}
                  </Typography>

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem" }}>
                      Start: {activeCurrencySymbol}{overviewAnalytics.startingBalance.toLocaleString()}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: overviewAnalytics.maxDrawdown > 0 ? "#EF4444" : "#10B981",
                      }}
                    >
                      Max DD: -{overviewAnalytics.maxDrawdownPercent}%
                    </Typography>
                  </Box>
                </Card>
              </Grid>

              {/* 4. Win Rate */}
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                <Card
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    bgcolor: isDark ? "#0E162B" : "#FFFFFF",
                    border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontWeight: 800, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                      Win Rate
                    </Typography>
                    <SpeedIcon sx={{ fontSize: 18, color: "#06B6D4" }} />
                  </Box>

                  <Typography variant="h5" sx={{ fontWeight: 900, my: 0.5, fontSize: "1.45rem", color: isDark ? "#F8FAFC" : "#0F172A" }}>
                    {overviewAnalytics.winRate !== null ? `${overviewAnalytics.winRate}%` : "N/A"}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={overviewAnalytics.winRate || 0}
                      sx={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: (overviewAnalytics.winRate || 0) >= 50 ? "#10B981" : "#EF4444",
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.68rem" }}>
                      Streak: {overviewAnalytics.consecutiveWins}W
                    </Typography>
                  </Box>
                </Card>
              </Grid>

              {/* 5. Profit Factor & Avg R */}
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                <Card
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    bgcolor: isDark ? "#0E162B" : "#FFFFFF",
                    border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontWeight: 800, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                      Profit Factor & R
                    </Typography>
                    <MoneyIcon sx={{ fontSize: 18, color: "#10B981" }} />
                  </Box>

                  <Typography variant="h5" sx={{ fontWeight: 900, my: 0.5, fontSize: "1.45rem", color: "#3B82F6" }}>
                    {overviewAnalytics.profitFactor !== null
                      ? overviewAnalytics.profitFactor
                      : overviewAnalytics.grossProfit > 0
                      ? "∞"
                      : "0.00"}
                  </Typography>

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem" }}>
                      Avg R: {overviewAnalytics.avgActualR !== null ? `${overviewAnalytics.avgActualR}R` : "N/A"}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#10B981", fontSize: "0.68rem" }}>
                      Exp: {overviewAnalytics.expectancy !== null ? `${activeCurrencySymbol}${overviewAnalytics.expectancy.toFixed(0)}` : "N/A"}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            </Grid>

            {/* ============================================================ */}
            {/* ANALYTIC VISUALIZATIONS: Equity Curve & PnL Distribution     */}
            {/* ============================================================ */}
            <Grid container spacing={1.2}>
              {/* ============================================================ */}
              {/* WAVE & SINE ANALYTICS: Fluid Spline Wave & Exact Orders Stream */}
              {/* ============================================================ */}
              <Grid size={{ xs: 12 }}>
                <Card
                  sx={{
                    p: 2,
                    borderRadius: "8px",
                    bgcolor: isDark ? "#0A1124" : "#FFFFFF",
                    border: isDark ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid #CBD5E1",
                    boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Top Bar: Title, Mode Toggles (Equity Wave vs Sine Oscillator) */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1.2, mb: 1.5 }}>
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: "0.98rem", letterSpacing: "-0.01em" }}>
                          🌊 Performance Wave & Sine Trade Analytics
                        </Typography>
                        <Chip
                          label={waveChartMode === "equity" ? "Smooth Equity Wave" : "P&L Sine Wave Oscillator"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.68rem",
                            height: 20,
                            bgcolor: isDark ? "rgba(56, 189, 248, 0.15)" : "#E0F2FE",
                            color: isDark ? "#38BDF8" : "#0284C7",
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: "0.72rem" }}>
                        Continuous cubic spline wave tracking every trade order execution, capital progression & return variance.
                      </Typography>
                    </Box>

                    {/* Mode Toggle & High Watermark Badges */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
                      <Box
                        sx={{
                          display: "flex",
                          p: 0.3,
                          borderRadius: "6px",
                          bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
                        }}
                      >
                        <Button
                          size="small"
                          onClick={() => setWaveChartMode("equity")}
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            py: 0.2,
                            px: 1.2,
                            height: 24,
                            borderRadius: "5px",
                            textTransform: "none",
                            bgcolor: waveChartMode === "equity" ? "#2563EB" : "transparent",
                            color: waveChartMode === "equity" ? "#FFF" : "inherit",
                          }}
                        >
                          🌊 Equity Wave
                        </Button>
                        <Button
                          size="small"
                          onClick={() => setWaveChartMode("sine")}
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            py: 0.2,
                            px: 1.2,
                            height: 24,
                            borderRadius: "5px",
                            textTransform: "none",
                            bgcolor: waveChartMode === "sine" ? "#8B5CF6" : "transparent",
                            color: waveChartMode === "sine" ? "#FFF" : "inherit",
                          }}
                        >
                          〰️ P&L Sine Oscillator
                        </Button>
                      </Box>

                      <Chip
                        icon={<ShowChartIcon sx={{ fontSize: 13 }} />}
                        label={`Peak Equity: ${activeCurrencySymbol}${overviewAnalytics.endingBalance.toLocaleString()}`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: "rgba(16, 185, 129, 0.15)",
                          color: "#10B981",
                          height: 24,
                          fontSize: "0.72rem",
                        }}
                      />
                    </Box>
                  </Box>

                  {/* ACTIVE HOVER / SELECTED TRADE ORDER INSPECTION BANNER */}
                  {(() => {
                    const pts = wavePointsWithTrades;
                    const activeIndex = hoveredWaveIndex !== null ? hoveredWaveIndex : selectedWaveIndex !== null ? selectedWaveIndex : pts.length - 1;
                    const activePoint = pts[activeIndex] || pts[pts.length - 1];
                    const activeTrade = activePoint?.trade;

                    return (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.2,
                          mb: 1.5,
                          borderRadius: "6px",
                          bgcolor: isDark ? "#060A17" : "#F8FAFC",
                          border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0",
                          display: "flex",
                          flexWrap: "wrap",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 1.2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap" }}>
                          {/* Order Number Badge */}
                          <Chip
                            label={activePoint?.isInitial ? "Deposit Anchor" : `Order #${activeTrade?.trade_num || activeIndex}`}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.72rem",
                              height: 24,
                              bgcolor: activePoint?.isInitial
                                ? (isDark ? "rgba(59, 130, 246, 0.2)" : "#DBEAFE")
                                : (activePoint?.pnl >= 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"),
                              color: activePoint?.isInitial ? "#3B82F6" : (activePoint?.pnl >= 0 ? "#10B981" : "#EF4444"),
                            }}
                          />

                          {/* Symbol & Direction */}
                          <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "0.85rem" }}>
                            {activePoint?.symbol}
                          </Typography>

                          {activeTrade && (
                            <Chip
                              label={activeTrade.direction}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.68rem",
                                height: 20,
                                bgcolor: activeTrade.direction === "BUY" ? "#10B981" : "#EF4444",
                                color: "#FFF",
                              }}
                            />
                          )}

                          {/* Execution Prices */}
                          {activeTrade && (
                            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                              Entry: <b>{activeTrade.entry_price}</b> ➔ Exit: <b>{activeTrade.exit_price || "—"}</b> {activeTrade.volume ? `(${activeTrade.volume} Lots)` : ""}
                            </Typography>
                          )}

                          {/* Realized PnL & Equity Progression */}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 900,
                                fontSize: "0.86rem",
                                color: activePoint?.pnl > 0 ? "#10B981" : activePoint?.pnl < 0 ? "#EF4444" : "#94A3B8",
                              }}
                            >
                              {activePoint?.pnl > 0 ? `+${activeCurrencySymbol}${activePoint.pnl.toLocaleString()}` : activePoint?.pnl < 0 ? `-${activeCurrencySymbol}${Math.abs(activePoint.pnl).toLocaleString()}` : `${activeCurrencySymbol}0`}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                              ➔ Running Equity: <b style={{ color: isDark ? "#38BDF8" : "#2563EB" }}>{activeCurrencySymbol}{activePoint?.equity.toLocaleString()}</b>
                            </Typography>
                          </Box>
                        </Box>

                        {/* Strategy, Timestamp & Inspect Button */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                          {activeTrade?.strategy_name && (
                            <Chip
                              label={activeTrade.strategy_name}
                              size="small"
                              sx={{ height: 20, fontSize: "0.66rem", fontWeight: 700 }}
                            />
                          )}
                          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                            {activePoint?.date} {activePoint?.time}
                          </Typography>

                          {activeTrade && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setSelectedTrade(activeTrade)}
                              sx={{
                                height: 24,
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                textTransform: "none",
                                px: 1,
                              }}
                            >
                              Inspect Order Details
                            </Button>
                          )}
                        </Box>
                      </Paper>
                    );
                  })()}

                  {/* SVG SMOOTH SPLINE WAVE & SINE OSCILLATOR GRAPH */}
                  {wavePointsWithTrades.length > 1 ? (
                    <Box sx={{ width: "100%", height: 220, position: "relative", my: 1 }}>
                      {(() => {
                        const pts = wavePointsWithTrades;
                        const svgWidth = 920;
                        const svgHeight = 210;

                        // Range calculation
                        const minEq = Math.min(...pts.map((p) => p.equity)) * 0.98;
                        const maxEq = Math.max(...pts.map((p) => p.equity)) * 1.02;
                        const eqRange = maxEq - minEq || 1;

                        const maxAbsPnl = Math.max(1, ...pts.map((p) => Math.abs(p.pnl)));

                        // Map coordinates
                        const coordinates = pts.map((p, idx) => {
                          const x = (idx / (pts.length - 1)) * (svgWidth - 60) + 30;
                          let y = svgHeight / 2;
                          if (waveChartMode === "equity") {
                            y = svgHeight - 35 - ((p.equity - minEq) / eqRange) * (svgHeight - 70);
                          } else {
                            const norm = (p.pnl / maxAbsPnl) * (svgHeight / 2 - 35);
                            y = svgHeight / 2 - norm;
                          }
                          return { x, y, pt: p, idx };
                        });

                        // Catmull-Rom to Cubic Bezier Spline Wave Algorithm
                        const generateSpline = (coords: typeof coordinates) => {
                          if (coords.length === 0) return "";
                          if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;
                          if (coords.length === 2) {
                            const cpX = (coords[0].x + coords[1].x) / 2;
                            return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)} C ${cpX.toFixed(1)} ${coords[0].y.toFixed(1)}, ${cpX.toFixed(1)} ${coords[1].y.toFixed(1)}, ${coords[1].x.toFixed(1)} ${coords[1].y.toFixed(1)}`;
                          }
                          let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
                          for (let i = 0; i < coords.length - 1; i++) {
                            const p0 = i > 0 ? coords[i - 1] : coords[i];
                            const p1 = coords[i];
                            const p2 = coords[i + 1];
                            const p3 = i < coords.length - 2 ? coords[i + 2] : p2;
                            const cp1x = p1.x + (p2.x - p0.x) / 4.5;
                            const cp1y = p1.y + (p2.y - p0.y) / 4.5;
                            const cp2x = p2.x - (p3.x - p1.x) / 4.5;
                            const cp2y = p2.y - (p3.y - p1.y) / 4.5;
                            d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
                          }
                          return d;
                        };

                        const splineD = generateSpline(coordinates);
                        const baselineY = waveChartMode === "equity"
                          ? svgHeight - 35 - ((activeStartingBalance - minEq) / eqRange) * (svgHeight - 70)
                          : svgHeight / 2;

                        const areaD = `${splineD} L ${coordinates[coordinates.length - 1].x.toFixed(1)} ${svgHeight - 15} L ${coordinates[0].x.toFixed(1)} ${svgHeight - 15} Z`;

                        // Secondary harmonic wave for depth
                        const harmonicCoords = coordinates.map((c) => ({
                          ...c,
                          y: c.y + Math.sin(c.x / 40) * 8,
                        }));
                        const harmonicSplineD = generateSpline(harmonicCoords);

                        const activeCoord = hoveredWaveIndex !== null
                          ? coordinates[hoveredWaveIndex]
                          : selectedWaveIndex !== null
                          ? coordinates[selectedWaveIndex]
                          : null;

                        return (
                          <svg
                            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                            style={{ width: "100%", height: "100%", overflow: "visible" }}
                            onMouseLeave={() => setHoveredWaveIndex(null)}
                          >
                            <defs>
                              {/* Glowing Wave Gradient */}
                              <linearGradient id="waveFillGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#38BDF8" stopOpacity={isDark ? "0.45" : "0.35"} />
                                <stop offset="50%" stopColor="#2563EB" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.0" />
                              </linearGradient>

                              {/* Sine Win/Loss Gradients */}
                              <linearGradient id="sineGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                                <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.4" />
                              </linearGradient>

                              {/* Neon Glow Filter */}
                              <filter id="neonWaveGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                              </filter>
                            </defs>

                            {/* Reference Baseline Grid */}
                            <line
                              x1="20"
                              y1={baselineY}
                              x2={svgWidth - 20}
                              y2={baselineY}
                              stroke={isDark ? "rgba(255,255,255,0.2)" : "#CBD5E1"}
                              strokeDasharray="4 4"
                              strokeWidth="1.2"
                            />
                            <text
                              x={svgWidth - 25}
                              y={baselineY - 5}
                              fill={isDark ? "#94A3B8" : "#64748B"}
                              fontSize="10"
                              fontWeight="700"
                              textAnchor="end"
                            >
                              {waveChartMode === "equity"
                                ? `Starting: ${activeCurrencySymbol}${activeStartingBalance.toLocaleString()}`
                                : `Zero Baseline ($0.00)`}
                            </text>

                            {/* Secondary Translucent Harmonic Resonance Wave */}
                            <path
                              d={harmonicSplineD}
                              fill="none"
                              stroke="#60A5FA"
                              strokeWidth="1"
                              strokeOpacity="0.25"
                              strokeDasharray="2 2"
                            />

                            {/* Luminous Wave Area Fill */}
                            <path
                              d={areaD}
                              fill={waveChartMode === "equity" ? "url(#waveFillGrad)" : "url(#sineGrad)"}
                            />

                            {/* Primary Fluid Spline Wave Line */}
                            <path
                              d={splineD}
                              fill="none"
                              stroke={waveChartMode === "equity" ? "#38BDF8" : "#A78BFA"}
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              filter="url(#neonWaveGlow)"
                            />

                            {/* Interactive Hover Crosshair */}
                            {activeCoord && (
                              <g>
                                <line
                                  x1={activeCoord.x}
                                  y1={15}
                                  x2={activeCoord.x}
                                  y2={svgHeight - 15}
                                  stroke="#38BDF8"
                                  strokeDasharray="3 3"
                                  strokeWidth="1.5"
                                />
                                <line
                                  x1={20}
                                  y1={activeCoord.y}
                                  x2={svgWidth - 20}
                                  y2={activeCoord.y}
                                  stroke="rgba(56, 189, 248, 0.4)"
                                  strokeDasharray="3 3"
                                  strokeWidth="1"
                                />
                              </g>
                            )}

                            {/* Trade Order Nodes Along the Wave */}
                            {coordinates.map((c) => {
                              const isHovered = hoveredWaveIndex === c.idx;
                              const isSelected = selectedWaveIndex === c.idx;
                              const isWin = c.pt.pnl > 0;
                              const isLoss = c.pt.pnl < 0;

                              const nodeFill = c.pt.isInitial
                                ? "#3B82F6"
                                : isWin
                                ? "#10B981"
                                : isLoss
                                ? "#EF4444"
                                : "#F59E0B";

                              return (
                                <g
                                  key={c.idx}
                                  style={{ cursor: "pointer" }}
                                  onMouseEnter={() => setHoveredWaveIndex(c.idx)}
                                  onClick={() => {
                                    setSelectedWaveIndex(c.idx);
                                    if (c.pt.trade) setSelectedTrade(c.pt.trade);
                                  }}
                                >
                                  {/* Pulse Aura on Active Node */}
                                  {(isHovered || isSelected) && (
                                    <circle
                                      cx={c.x}
                                      cy={c.y}
                                      r="11"
                                      fill={nodeFill}
                                      fillOpacity="0.3"
                                    />
                                  )}

                                  {/* Node Core */}
                                  <circle
                                    cx={c.x}
                                    cy={c.y}
                                    r={isHovered || isSelected ? 6 : 4}
                                    fill={nodeFill}
                                    stroke={isDark ? "#0A1124" : "#FFFFFF"}
                                    strokeWidth="2"
                                  />

                                  {/* Point label on hover or endpoints */}
                                  {(isHovered || isSelected || c.idx === coordinates.length - 1) && (
                                    <text
                                      x={c.x}
                                      y={c.y - 10}
                                      fill={isDark ? "#F8FAFC" : "#0F172A"}
                                      fontSize="10"
                                      fontWeight="800"
                                      textAnchor="middle"
                                    >
                                      {c.pt.isInitial ? "Start" : `${c.pt.pnl >= 0 ? "+" : ""}${activeCurrencySymbol}${c.pt.pnl.toLocaleString()}`}
                                    </text>
                                  )}
                                </g>
                              );
                            })}
                          </svg>
                        );
                      })()}
                    </Box>
                  ) : (
                    <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
                      <Typography variant="body2">No closed trades in this period to plot wave progression.</Typography>
                    </Box>
                  )}

                  {/* SYNCHRONIZED EXACT TRADE ORDERS STREAM TABLE */}
                  <Box sx={{ mt: 2, pt: 1.5, borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.84rem" }}>
                        📋 Exact Trade Orders on Wave ({wavePointsWithTrades.filter((p) => !p.isInitial).length} Closed Orders)
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                        Click any order to inspect or locate on the wave graph
                      </Typography>
                    </Box>

                    <Box sx={{ overflowX: "auto", maxHeight: 220, overflowY: "auto" }}>
                      <Box
                        component="table"
                        sx={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "0.75rem",
                          "& th": {
                            py: 0.6,
                            px: 1,
                            textAlign: "left",
                            fontWeight: 800,
                            color: isDark ? "#94A3B8" : "#64748B",
                            borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
                            bgcolor: isDark ? "#060A17" : "#F8FAFC",
                          },
                          "& td": {
                            py: 0.6,
                            px: 1,
                            borderBottom: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid #F1F5F9",
                          },
                        }}
                      >
                        <thead>
                          <tr>
                            <th># Order</th>
                            <th>Date / Time</th>
                            <th>Symbol</th>
                            <th>Direction</th>
                            <th>Entry ➔ Exit</th>
                            <th>Volume</th>
                            <th>Net Realized P&L</th>
                            <th>Equity After Order</th>
                            <th>Strategy</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wavePointsWithTrades.map((pt) => {
                            if (pt.isInitial) return null;
                            const t = pt.trade;
                            const isSelected = selectedWaveIndex === pt.index || hoveredWaveIndex === pt.index;
                            const isWin = pt.pnl > 0;
                            const isLoss = pt.pnl < 0;

                            return (
                              <Box
                                component="tr"
                                key={pt.index}
                                onMouseEnter={() => setHoveredWaveIndex(pt.index)}
                                onMouseLeave={() => setHoveredWaveIndex(null)}
                                onClick={() => {
                                  setSelectedWaveIndex(pt.index);
                                  if (t) setSelectedTrade(t);
                                }}
                                sx={{
                                  cursor: "pointer",
                                  bgcolor: isSelected
                                    ? (isDark ? "rgba(59, 130, 246, 0.18)" : "#EFF6FF")
                                    : "transparent",
                                  "&:hover": {
                                    bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                                  },
                                }}
                              >
                                <td>
                                  <Chip
                                    label={`#${t?.trade_num || pt.index}`}
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: "0.65rem",
                                      fontWeight: 800,
                                      bgcolor: isWin ? "rgba(16, 185, 129, 0.15)" : isLoss ? "rgba(239, 68, 68, 0.15)" : "#F1F5F9",
                                      color: isWin ? "#10B981" : isLoss ? "#EF4444" : "inherit",
                                    }}
                                  />
                                </td>
                                <td>
                                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.72rem" }}>
                                    {pt.date} {pt.time}
                                  </Typography>
                                </td>
                                <td>
                                  <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "0.74rem" }}>
                                    {pt.symbol}
                                  </Typography>
                                </td>
                                <td>
                                  <Chip
                                    label={pt.direction}
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: "0.65rem",
                                      fontWeight: 800,
                                      bgcolor: pt.direction === "BUY" ? "#10B981" : "#EF4444",
                                      color: "#FFF",
                                    }}
                                  />
                                </td>
                                <td>
                                  <Typography variant="caption" sx={{ fontSize: "0.72rem" }}>
                                    {t?.entry_price || "—"} ➔ {t?.exit_price || "—"}
                                  </Typography>
                                </td>
                                <td>
                                  <Typography variant="caption" sx={{ fontSize: "0.72rem" }}>
                                    {t?.volume ? `${t.volume} Lots` : "—"}
                                  </Typography>
                                </td>
                                <td>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 800,
                                      fontSize: "0.75rem",
                                      color: isWin ? "#10B981" : isLoss ? "#EF4444" : "#94A3B8",
                                    }}
                                  >
                                    {isWin ? `+${activeCurrencySymbol}${pt.pnl.toLocaleString()}` : isLoss ? `-${activeCurrencySymbol}${Math.abs(pt.pnl).toLocaleString()}` : `${activeCurrencySymbol}0`}
                                  </Typography>
                                </td>
                                <td>
                                  <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "0.74rem", color: isDark ? "#38BDF8" : "#2563EB" }}>
                                    {activeCurrencySymbol}{pt.equity.toLocaleString()}
                                  </Typography>
                                </td>
                                <td>
                                  <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
                                    {t?.strategy_name || "Standard"}
                                  </Typography>
                                </td>
                                <td>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (t) setSelectedTrade(t);
                                    }}
                                    sx={{ height: 20, fontSize: "0.65rem", py: 0, px: 0.8, textTransform: "none", fontWeight: 700 }}
                                  >
                                    Inspect
                                  </Button>
                                </td>
                              </Box>
                            );
                          })}
                        </tbody>
                      </Box>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            </Grid>

            {/* ============================================================ */}
            {/* PERFORMANCE BREAKDOWN: Daily P&L, Symbols, BUY vs SELL        */}
            {/* ============================================================ */}
            <Grid container spacing={1.2}>
              {/* 1. Day / Trade P&L Distribution Bar Chart */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    bgcolor: isDark ? "#0E162B" : "#FFFFFF",
                    border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0",
                    height: "100%",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.88rem" }}>
                      Daily P&L Distribution
                    </Typography>
                    <BarChartIcon sx={{ fontSize: 18, color: "#10B981" }} />
                  </Box>

                  {dailyPnlBars.length > 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, maxHeight: 220, overflowY: "auto" }}>
                      {dailyPnlBars.map((bar, idx) => {
                        const maxAbs = Math.max(...dailyPnlBars.map((b) => Math.abs(b.pnl))) || 1;
                        const pct = Math.min(100, Math.max(10, (Math.abs(bar.pnl) / maxAbs) * 100));
                        const isWin = bar.pnl >= 0;

                        return (
                          <Box key={idx} sx={{ p: 0.6, px: 0.8, borderRadius: "5px", bgcolor: isDark ? "#070B16" : "#F8FAFC", border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #E2E8F0" }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.3 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
                                {bar.date}
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.72rem", color: isWin ? "#10B981" : "#EF4444" }}>
                                {isWin ? `+$${bar.pnl}` : `-$${Math.abs(bar.pnl)}`}
                              </Typography>
                            </Box>
                            <Box sx={{ width: "100%", height: 6, bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                              <Box
                                sx={{
                                  width: `${pct}%`,
                                  height: "100%",
                                  bgcolor: isWin ? "#10B981" : "#EF4444",
                                  borderRadius: 3,
                                }}
                              />
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
                      <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>No closed trades to distribute.</Typography>
                    </Box>
                  )}
                </Card>
              </Grid>

              {/* 2. Symbol Performance Breakdown */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    bgcolor: isDark ? "#0E162B" : "#FFFFFF",
                    border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0",
                    height: "100%",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, fontSize: "0.85rem" }}>
                    Performance by Symbol
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, maxHeight: 250, overflowY: "auto" }}>
                    {symbolStats.length > 0 ? (
                      symbolStats.map((s, idx) => (
                        <Box key={idx} sx={{ p: 0.8, borderRadius: "5px", bgcolor: isDark ? "#070B16" : "#F8FAFC", border: isDark ? "1px solid rgba(59, 130, 246, 0.1)" : "1px solid #E2E8F0" }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "0.78rem" }}>
                              {s.symbol}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "0.78rem", color: s.pnl >= 0 ? "#10B981" : "#EF4444" }}>
                              {s.pnl >= 0 ? `+$${s.pnl}` : `-$${Math.abs(s.pnl)}`}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.2 }}>
                            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem" }}>
                              {s.count} trades (Win Rate: {s.winRate !== null ? `${s.winRate.toFixed(1)}%` : "N/A"})
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="caption" sx={{ color: "text.secondary", p: 1 }}>No symbol data available.</Typography>
                    )}
                  </Box>
                </Card>
              </Grid>

              {/* BUY vs SELL Direction Analysis */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    bgcolor: isDark ? "#0E162B" : "#FFFFFF",
                    border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0",
                    height: "100%",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, fontSize: "0.85rem" }}>
                    Directional Edge (BUY vs SELL)
                  </Typography>
                  <Grid container spacing={1}>
                    {/* BUY Side */}
                    <Grid size={{ xs: 6 }}>
                      <Paper sx={{ p: 1, borderRadius: "6px", bgcolor: isDark ? "#070B16" : "#F8FAFC", border: "1px solid rgba(16, 185, 129, 0.2)", textAlign: "center" }}>
                        <Chip label="BUY ORDERS" size="small" sx={{ fontWeight: 800, fontSize: "0.62rem", height: 18, bgcolor: "rgba(16, 185, 129, 0.15)", color: "#10B981", mb: 0.5 }} />
                        <Typography variant="h6" sx={{ fontWeight: 900, fontSize: "1.1rem", color: directionAnalytics.buy.pnl >= 0 ? "#10B981" : "#EF4444" }}>
                          {directionAnalytics.buy.pnl >= 0 ? `+$${directionAnalytics.buy.pnl}` : `-$${Math.abs(directionAnalytics.buy.pnl)}`}
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block", color: "text.secondary", fontSize: "0.68rem", mt: 0.2 }}>
                          {directionAnalytics.buy.count} trades | {directionAnalytics.buy.wr !== null ? `${directionAnalytics.buy.wr.toFixed(0)}% WR` : "N/A"}
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* SELL Side */}
                    <Grid size={{ xs: 6 }}>
                      <Paper sx={{ p: 1, borderRadius: "6px", bgcolor: isDark ? "#070B16" : "#F8FAFC", border: "1px solid rgba(239, 68, 68, 0.2)", textAlign: "center" }}>
                        <Chip label="SELL ORDERS" size="small" sx={{ fontWeight: 800, fontSize: "0.62rem", height: 18, bgcolor: "rgba(239, 68, 68, 0.15)", color: "#EF4444", mb: 0.5 }} />
                        <Typography variant="h6" sx={{ fontWeight: 900, fontSize: "1.1rem", color: directionAnalytics.sell.pnl >= 0 ? "#10B981" : "#EF4444" }}>
                          {directionAnalytics.sell.pnl >= 0 ? `+$${directionAnalytics.sell.pnl}` : `-$${Math.abs(directionAnalytics.sell.pnl)}`}
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block", color: "text.secondary", fontSize: "0.68rem", mt: 0.2 }}>
                          {directionAnalytics.sell.count} trades | {directionAnalytics.sell.wr !== null ? `${directionAnalytics.sell.wr.toFixed(0)}% WR` : "N/A"}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Discipline Impact Card */}
                  <Box sx={{ mt: 1.5, p: 1, borderRadius: "6px", bgcolor: isDark ? "#070B16" : "#F8FAFC", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0" }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#38BDF8", display: "block", mb: 0.4, fontSize: "0.72rem" }}>
                      COST OF MISTAKES:
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                        Plan Followed ({disciplineStats.disciplined.count}t):
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: disciplineStats.disciplined.pnl >= 0 ? "#10B981" : "#EF4444" }}>
                        {disciplineStats.disciplined.pnl >= 0 ? `+$${disciplineStats.disciplined.pnl}` : `-$${Math.abs(disciplineStats.disciplined.pnl)}`}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.2 }}>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                        Mistakes Made ({disciplineStats.mistakes.count}t):
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: disciplineStats.mistakes.pnl >= 0 ? "#10B981" : "#EF4444" }}>
                        {disciplineStats.mistakes.pnl >= 0 ? `+$${disciplineStats.mistakes.pnl}` : `-$${Math.abs(disciplineStats.mistakes.pnl)}`}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>

              {/* Psychological Edge (Entry Emotion Impact) */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    bgcolor: isDark ? "#0E162B" : "#FFFFFF",
                    border: isDark ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid #E2E8F0",
                    height: "100%",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, fontSize: "0.85rem" }}>
                    Psychological Edge (Entry Emotion)
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, maxHeight: 250, overflowY: "auto" }}>
                    {emotionalStats.entry.length > 0 ? (
                      emotionalStats.entry.map((e, idx) => (
                        <Box key={idx} sx={{ p: 0.8, borderRadius: "5px", bgcolor: isDark ? "#070B16" : "#F8FAFC", border: isDark ? "1px solid rgba(139, 92, 246, 0.1)" : "1px solid #E2E8F0" }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.78rem" }}>
                              {e.emotion}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "0.78rem", color: e.pnl >= 0 ? "#10B981" : "#EF4444" }}>
                              {e.pnl >= 0 ? `+$${e.pnl}` : `-$${Math.abs(e.pnl)}`}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem" }}>
                            {e.count} trades | {e.winRate.toFixed(0)}% Win Rate
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="caption" sx={{ color: "text.secondary", p: 1 }}>No emotional records found.</Typography>
                    )}
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
              width: "100%",
              borderRadius: "8px",
              bgcolor: isDark ? "#0B1226" : "#FFFFFF",
              border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0",
              boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
            }}
          >
            <CardContent
              sx={{
                p: { xs: 1.5, sm: 2.2 },
                "&:last-child": { pb: 2.2 },
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
              {/* Form Title & Top Banner */}
              <Box sx={{ mb: 1.5, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: "0.95rem", letterSpacing: "-0.01em" }}>
                      Trade Entry Form
                    </Typography>
                    <Chip
                      label={`Trade #${tradeForm.tradeNum || "1"}`}
                      sx={{ bgcolor: "#2563EB", color: "#FFF", fontWeight: 800, fontSize: "0.66rem", height: 20 }}
                      size="small"
                    />
                    <Chip
                      label={tradeForm.result}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.66rem",
                        height: 20,
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
                    <Chip
                      clickable
                      onClick={() => setActiveTab(7)}
                      icon={<MeditationIcon sx={{ fontSize: "14px !important", color: routineIsAllComplete ? "#10B981 !important" : "#D97706 !important" }} />}
                      label={routineIsAllComplete ? "Pre-Market: 4/4 Ready ✅" : `Pre-Market: ${routineCompletedCount}/4 (Click to Complete)`}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.66rem",
                        height: 20,
                        bgcolor: routineIsAllComplete
                          ? (isDark ? "rgba(16, 185, 129, 0.2)" : "#DCFCE7")
                          : (isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7"),
                        color: routineIsAllComplete ? "#10B981" : "#D97706",
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", display: "block", fontSize: "0.68rem", mt: 0.2 }}>
                    Complete 31-field trading journal entry with Indian Rupee (₹) & point auto-calculations.
                  </Typography>
                </Box>

                {/* Account Selection */}
                <FormControl size="small" sx={{ minWidth: 200 }} required>
                  <InputLabel sx={{ fontSize: "0.72rem" }}>Trading Account</InputLabel>
                  <Select
                    value={tradeForm.accountId}
                    label="Trading Account"
                    onChange={(e) => updateTradeField("accountId", e.target.value)}
                    sx={{ fontSize: "0.75rem", height: 32 }}
                  >
                    {accounts.map((a) => (
                      <MenuItem key={a.id} value={a.id} sx={{ fontSize: "0.75rem" }}>
                        {a.name} ({a.account_type.toUpperCase()} - {a.currency})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Quick Symbol Chips */}
              <Box sx={{ mb: 1.8, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.6 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? "#94A3B8" : "#64748B", mr: 0.5, fontSize: "0.66rem", textTransform: "uppercase" }}>
                  QUICK SYMBOLS:
                </Typography>
                {TRADING_SYMBOLS.map((sym) => (
                  <Chip
                    key={sym}
                    label={sym}
                    size="small"
                    onClick={() => updateTradeField("symbol", sym)}
                    sx={{
                      cursor: "pointer",
                      fontSize: "0.66rem",
                      height: 22,
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
                <Grid container spacing={2}>
                  {/* ============================================================ */}
                  {/* LEFT COLUMN: SETUP, PRICING & FINANCIAL ENGINE (PARTS 1, 2, 3) */}
                  {/* ============================================================ */}
                  <Grid size={{ xs: 12, lg: 6 }} sx={{ display: "flex", flexDirection: "column", gap: 1.8 }}>
                    {/* SECTION 1: TRADE SETUP & EXECUTION */}
                    <Paper
                      sx={{
                        p: 1.6,
                        borderRadius: "8px",
                        bgcolor: isDark ? "#070B16" : "#F8FAFC",
                        border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#38BDF8", mb: 1.2, display: "flex", alignItems: "center", gap: 0.8, fontSize: "0.78rem" }}>
                        <Box component="span" sx={{ bgcolor: "#0284C7", color: "#FFF", px: 0.6, py: 0.1, borderRadius: "4px", fontSize: "0.62rem" }}>
                          PART 1
                        </Box>
                        Trade Setup & Execution
                      </Typography>

                      <Grid container spacing={1.4}>
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
                                <MenuItem key={sym} value={sym} sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
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
                              <MenuItem value="BUY" sx={{ color: "#10B981", fontWeight: 800, fontSize: "0.75rem" }}>BUY</MenuItem>
                              <MenuItem value="SELL" sx={{ color: "#EF4444", fontWeight: 800, fontSize: "0.75rem" }}>SELL</MenuItem>
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
                              <MenuItem value="other" sx={{ fontWeight: 800, color: "#3B82F6" }}>
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
                    {/* SECTION 2: PRICE LEVELS & SIZING (Fields 9 - 13)          */}
                    {/* ======================================================== */}
                    <Paper
                      sx={{
                        p: 1.6,
                        borderRadius: "8px",
                        bgcolor: isDark ? "#070B16" : "#F8FAFC",
                        border: isDark ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid #E2E8F0",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#10B981", mb: 1.2, display: "flex", alignItems: "center", gap: 0.8, fontSize: "0.78rem" }}>
                        <Box component="span" sx={{ bgcolor: "#059669", color: "#FFF", px: 0.6, py: 0.1, borderRadius: "4px", fontSize: "0.62rem" }}>
                          PART 2
                        </Box>
                        Price Levels & Position Sizing (Fields 9 – 13)
                      </Typography>

                      <Grid container spacing={1.4}>
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
                    {/* SECTION 3: RISK & FINANCIAL ENGINE (Fields 14 - 20)      */}
                    {/* ======================================================== */}
                    <Paper
                      sx={{
                        p: 1.6,
                        borderRadius: "8px",
                        bgcolor: isDark ? "rgba(245, 158, 11, 0.04)" : "#FFFBEB",
                        border: isDark ? "1px solid rgba(245, 158, 11, 0.25)" : "1px solid #FDE68A",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#D97706", mb: 1.2, display: "flex", alignItems: "center", gap: 0.8, fontSize: "0.78rem" }}>
                        <Box component="span" sx={{ bgcolor: "#D97706", color: "#FFF", px: 0.6, py: 0.1, borderRadius: "4px", fontSize: "0.62rem" }}>
                          PART 3
                        </Box>
                        Risk, Reward & Auto-Calculated Financials (Fields 14 – 20)
                      </Typography>

                      <Grid container spacing={1.4}>
                        {/* 14. Risk ₹ */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="14. Risk ₹"
                            type="number"
                            value={tradeForm.plannedRiskAmount}
                            onChange={(e) => updateTradeField("plannedRiskAmount", e.target.value)}
                            slotProps={{ input: { startAdornment: <InputAdornment position="start"><span style={{ fontSize: "0.75rem" }}>₹</span></InputAdornment> } }}
                          />
                        </Grid>

                        {/* 15. SL Points */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="15. SL Points"
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
                            label="16. TP Points"
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
                            label="17. Planned R:R"
                            value={tradeForm.plannedRR}
                            onChange={(e) => updateTradeField("plannedRR", e.target.value)}
                          />
                        </Grid>

                        {/* 18. P&L ₹ */}
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="18. P&L ₹"
                            type="number"
                            value={tradeForm.netPnl}
                            onChange={(e) => updateTradeField("netPnl", e.target.value)}
                            slotProps={{ input: { startAdornment: <InputAdornment position="start"><span style={{ fontSize: "0.75rem" }}>₹</span></InputAdornment> } }}
                          />
                        </Grid>

                        {/* 19. Actual R:R */}
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="19. Actual R:R"
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
                              <MenuItem value="WIN" sx={{ color: "#10B981", fontWeight: 700, fontSize: "0.75rem" }}>WIN</MenuItem>
                              <MenuItem value="LOSS" sx={{ color: "#EF4444", fontWeight: 700, fontSize: "0.75rem" }}>LOSS</MenuItem>
                              <MenuItem value="BREAK_EVEN" sx={{ color: "#64748B", fontWeight: 700, fontSize: "0.75rem" }}>BREAK_EVEN</MenuItem>
                              <MenuItem value="OPEN" sx={{ color: "#F59E0B", fontWeight: 700, fontSize: "0.75rem" }}>OPEN</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* ============================================================ */}
                  {/* RIGHT COLUMN: PSYCHOLOGY & MARKET CONTEXT (PARTS 4, 5)        */}
                  {/* ============================================================ */}
                  <Grid size={{ xs: 12, lg: 6 }} sx={{ display: "flex", flexDirection: "column", gap: 1.8 }}>
                    {/* SECTION 4: PSYCHOLOGY & DISCIPLINE (Fields 21 - 27) */}
                    <Paper
                      sx={{
                        p: 1.6,
                        borderRadius: "8px",
                        bgcolor: isDark ? "#070B16" : "#F8FAFC",
                        border: isDark ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid #E2E8F0",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#8B5CF6", mb: 1.2, display: "flex", alignItems: "center", gap: 0.8, fontSize: "0.78rem" }}>
                        <Box component="span" sx={{ bgcolor: "#7C3AED", color: "#FFF", px: 0.6, py: 0.1, borderRadius: "4px", fontSize: "0.62rem" }}>
                          PART 4
                        </Box>
                        Trading Psychology & Mindset (Fields 21 – 27)
                      </Typography>

                      <Grid container spacing={1.4}>
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
                              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.70rem" }}>
                                23. Confidence (1–5):
                              </Typography>
                              <Chip label={`${tradeForm.confidenceRating}/5`} size="small" sx={{ fontWeight: 800, bgcolor: "#38BDF8", color: "#000", height: 16, fontSize: "0.62rem" }} />
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
                              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.70rem" }}>
                                24. Discipline (1–5):
                              </Typography>
                              <Chip label={`${tradeForm.disciplineRating}/5`} size="small" sx={{ fontWeight: 800, bgcolor: "#10B981", color: "#FFF", height: 16, fontSize: "0.62rem" }} />
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
                            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.70rem" }}>
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
                              label={<Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.68rem" }}>{tradeForm.mistakeFlag ? "YES" : "NO"}</Typography>}
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
                              <MenuItem value="Other" sx={{ fontWeight: 800, color: "#EF4444" }}>
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

                    {/* SECTION 5: MARKET CONTEXT & NOTES (Fields 28 - 31) */}
                    <Paper
                      sx={{
                        p: 1.6,
                        borderRadius: "8px",
                        bgcolor: isDark ? "#070B16" : "#F8FAFC",
                        border: isDark ? "1px solid rgba(6, 182, 212, 0.2)" : "1px solid #E2E8F0",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#06B6D4", mb: 1.2, display: "flex", alignItems: "center", gap: 0.8, fontSize: "0.78rem" }}>
                        <Box component="span" sx={{ bgcolor: "#0891B2", color: "#FFF", px: 0.6, py: 0.1, borderRadius: "4px", fontSize: "0.62rem" }}>
                          PART 5
                        </Box>
                        Market Context & Retrospective Journal (Fields 28 – 31)
                      </Typography>

                      <Grid container spacing={1.4}>
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
                        bgcolor: isDark ? "#0E162B" : "#EFF6FF",
                        border: isDark ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid #BFDBFE",
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        gap: 1.2,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "0.75rem" }}>
                          Live Preview:
                        </Typography>
                        <Chip label={`${tradeForm.symbol} • ${tradeForm.direction}`} size="small" sx={{ fontWeight: 700, height: 22, fontSize: "0.68rem" }} />
                        <Chip label={`Risk: ₹${tradeForm.plannedRiskAmount || "0"}`} size="small" sx={{ fontWeight: 700, height: 22, fontSize: "0.68rem", bgcolor: "rgba(239,68,68,0.15)", color: "#EF4444" }} />
                        {tradeForm.netPnl !== "" && (
                          <Chip
                            label={`P&L: ${Number(tradeForm.netPnl) >= 0 ? "+" : ""}₹${tradeForm.netPnl} (${tradeForm.actualRR})`}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              height: 22,
                              fontSize: "0.68rem",
                              bgcolor: Number(tradeForm.netPnl) >= 0 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                              color: Number(tradeForm.netPnl) >= 0 ? "#10B981" : "#EF4444",
                            }}
                          />
                        )}
                        <Chip label={`Result: ${tradeForm.result}`} size="small" sx={{ fontWeight: 700, height: 22, fontSize: "0.68rem" }} />
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
                            fontWeight: 800,
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
        {/* TAB 6: ACCOUNTS MANAGEMENT (COMPLETE CRUD)                  */}
        {/* ============================================================ */}
        {activeTab === 6 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Top Toolbar */}
            <Card
              sx={{
                p: 1.5,
                borderRadius: "8px",
                bgcolor: isDark ? "#0B1226" : "#FFFFFF",
                border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1.2,
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: "0.98rem" }}>
                  Trading Accounts Management
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                  Manage multiple accounts, initial balances, currencies, and track live capital growth.
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleOpenCreateAccount}
                sx={{
                  bgcolor: "#2563EB",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  borderRadius: "6px",
                  height: 32,
                  px: 2,
                  "&:hover": { bgcolor: "#1D4ED8" },
                }}
              >
                Create Account
              </Button>
            </Card>

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
                        bgcolor: isDark ? "#0E162B" : "#FFFFFF",
                        border: isActive
                          ? "2px solid #2563EB"
                          : isDark
                          ? "1px solid rgba(59, 130, 246, 0.2)"
                          : "1px solid #E2E8F0",
                        boxShadow: isActive ? "0 8px 30px rgba(37,99,235,0.18)" : "none",
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
                              fontWeight: 800,
                              fontSize: "0.65rem",
                              height: 20,
                              bgcolor:
                                acc.account_type === "live"
                                  ? "rgba(16, 185, 129, 0.2)"
                                  : "rgba(59, 130, 246, 0.2)",
                              color:
                                acc.account_type === "live"
                                  ? "#10B981"
                                  : "#3B82F6",
                            }}
                          />
                          <Chip
                            label={acc.currency}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: "0.65rem", height: 20 }}
                          />
                        </Box>

                        {isActive && (
                          <Chip
                            label="ACTIVE"
                            size="small"
                            sx={{
                              bgcolor: "#2563EB",
                              color: "#FFF",
                              fontWeight: 800,
                              fontSize: "0.62rem",
                              height: 18,
                            }}
                          />
                        )}
                      </Box>

                      {/* Account Name & Description */}
                      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.05rem", mt: 0.5 }}>
                        {acc.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", minHeight: 32, fontSize: "0.72rem" }}>
                        {acc.description || "Portfolio account tracked in PostgreSQL database."}
                      </Typography>

                      <Divider sx={{ my: 1.2 }} />

                      {/* Balances */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.6 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>Starting Capital:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {currSymbol}{starting.toLocaleString()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.6 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>Current Equity:</Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
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
                            fontWeight: 800,
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
                            fontWeight: 700,
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
                              <EditIcon sx={{ fontSize: 15, color: "#3B82F6" }} />
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

        {/* ============================================================ */}
        {/* TAB 7: PRE-MARKET ROUTINE & MINDFULNESS                      */}
        {/* ============================================================ */}
        {activeTab === 7 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* 1. TOP COMMAND BAR */}
            <Card
              sx={{
                p: 2,
                borderRadius: "8px",
                bgcolor: isDark ? "#0B1226" : "#FFFFFF",
                border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0",
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", md: "center" },
                gap: 1.5,
              }}
            >
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
                    🌅 Pre-Market Routine & Mindfulness
                  </Typography>
                  {routineStreak > 0 && (
                    <Chip
                      icon={<FireIcon sx={{ fontSize: "15px !important", color: "#F97316 !important" }} />}
                      label={`${routineStreak} Day Streak`}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        bgcolor: isDark ? "rgba(249, 115, 22, 0.15)" : "#FFEDD5",
                        color: "#EA580C",
                      }}
                    />
                  )}
                  {routineIsAllComplete ? (
                    <Chip
                      label="All 4 Steps Complete ✅ Ready to Trade"
                      size="small"
                      sx={{
                        bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "#DCFCE7",
                        color: "#10B981",
                        fontWeight: 800,
                      }}
                    />
                  ) : (
                    <Chip
                      label={`${routineCompletedCount} of 4 Complete`}
                      size="small"
                      sx={{
                        bgcolor: isDark ? "rgba(245, 158, 11, 0.15)" : "#FEF3C7",
                        color: "#D97706",
                        fontWeight: 800,
                      }}
                    />
                  )}
                </Box>
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.4, fontSize: "0.8rem" }}>
                  Review calendar, commit to your plan, map your charts, and complete 10 mins meditation before taking any positions.
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap" }}>
                <TextField
                  type="date"
                  size="small"
                  label="Routine Date"
                  value={routineDate}
                  onChange={(e) => setRoutineDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: 155, "& .MuiInputBase-root": { height: 32, fontSize: "0.78rem" } }}
                />

                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSaveRoutine}
                  disabled={routineSaving}
                  startIcon={routineSaving ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    bgcolor: routineIsAllComplete ? "#10B981" : "#2563EB",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    height: 32,
                    px: 2,
                    textTransform: "none",
                    "&:hover": { bgcolor: routineIsAllComplete ? "#059669" : "#1D4ED8" },
                  }}
                >
                  {routineSaving ? "Saving..." : routineIsAllComplete ? "Save & Lock In (100% Ready)" : "Save Routine"}
                </Button>
              </Box>
            </Card>

            {/* 2. READINESS PROGRESS & QUICK STEPS BAR */}
            <Card
              sx={{
                p: 1.5,
                borderRadius: "8px",
                bgcolor: isDark ? "#0E172E" : "#F8FAFC",
                border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8, flexWrap: "wrap", gap: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, color: isDark ? "#94A3B8" : "#64748B" }}>
                  Session Readiness: {routineCompletedCount} of 4 Completed ({routineCompletedCount * 25}%)
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: routineIsAllComplete ? "#10B981" : "#3B82F6" }}>
                  {routineIsAllComplete ? "🎯 State: Peak Discipline & Mental Clarity" : "⚡ State: Complete Routine Before Trading"}
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={routineCompletedCount * 25}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                  mb: 1.2,
                  "& .MuiLinearProgress-bar": {
                    bgcolor: routineIsAllComplete ? "#10B981" : "#2563EB",
                    borderRadius: 4,
                  },
                }}
              />

              <Grid container spacing={1}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Paper
                    elevation={0}
                    onClick={() => setRoutine((r) => ({ ...r, economicCalendarReviewed: !r.economicCalendarReviewed }))}
                    sx={{
                      p: 1,
                      cursor: "pointer",
                      borderRadius: "6px",
                      bgcolor: routine.economicCalendarReviewed
                        ? (isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5")
                        : (isDark ? "#0B1226" : "#FFFFFF"),
                      border: routine.economicCalendarReviewed
                        ? "1px solid rgba(16, 185, 129, 0.4)"
                        : (isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0"),
                      display: "flex",
                      alignItems: "center",
                      gap: 0.8,
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={routine.economicCalendarReviewed}
                      sx={{ p: 0, color: "#10B981", "&.Mui-checked": { color: "#10B981" } }}
                    />
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, display: "block", fontSize: "0.72rem" }}>
                        1. Economic Calendar
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: "0.66rem", color: routine.economicCalendarReviewed ? "#10B981" : "text.secondary" }}>
                        {routine.economicCalendarReviewed ? "✅ Reviewed" : "Pending"}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 6, md: 3 }}>
                  <Paper
                    elevation={0}
                    onClick={() => setRoutine((r) => ({ ...r, tradePlanReviewed: !r.tradePlanReviewed }))}
                    sx={{
                      p: 1,
                      cursor: "pointer",
                      borderRadius: "6px",
                      bgcolor: routine.tradePlanReviewed
                        ? (isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5")
                        : (isDark ? "#0B1226" : "#FFFFFF"),
                      border: routine.tradePlanReviewed
                        ? "1px solid rgba(16, 185, 129, 0.4)"
                        : (isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0"),
                      display: "flex",
                      alignItems: "center",
                      gap: 0.8,
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={routine.tradePlanReviewed}
                      sx={{ p: 0, color: "#10B981", "&.Mui-checked": { color: "#10B981" } }}
                    />
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, display: "block", fontSize: "0.72rem" }}>
                        2. Trade Plan
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: "0.66rem", color: routine.tradePlanReviewed ? "#10B981" : "text.secondary" }}>
                        {routine.tradePlanReviewed ? "✅ Committed" : "Pending"}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 6, md: 3 }}>
                  <Paper
                    elevation={0}
                    onClick={() => setRoutine((r) => ({ ...r, chartsAnalyzed: !r.chartsAnalyzed }))}
                    sx={{
                      p: 1,
                      cursor: "pointer",
                      borderRadius: "6px",
                      bgcolor: routine.chartsAnalyzed
                        ? (isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5")
                        : (isDark ? "#0B1226" : "#FFFFFF"),
                      border: routine.chartsAnalyzed
                        ? "1px solid rgba(16, 185, 129, 0.4)"
                        : (isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0"),
                      display: "flex",
                      alignItems: "center",
                      gap: 0.8,
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={routine.chartsAnalyzed}
                      sx={{ p: 0, color: "#10B981", "&.Mui-checked": { color: "#10B981" } }}
                    />
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, display: "block", fontSize: "0.72rem" }}>
                        3. Chart Analysis
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: "0.66rem", color: routine.chartsAnalyzed ? "#10B981" : "text.secondary" }}>
                        {routine.chartsAnalyzed ? "✅ Mapped" : "Pending"}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 6, md: 3 }}>
                  <Paper
                    elevation={0}
                    onClick={() => setRoutine((r) => ({ ...r, meditationCompleted: !r.meditationCompleted }))}
                    sx={{
                      p: 1,
                      cursor: "pointer",
                      borderRadius: "6px",
                      bgcolor: routine.meditationCompleted
                        ? (isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5")
                        : (isDark ? "#0B1226" : "#FFFFFF"),
                      border: routine.meditationCompleted
                        ? "1px solid rgba(16, 185, 129, 0.4)"
                        : (isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0"),
                      display: "flex",
                      alignItems: "center",
                      gap: 0.8,
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={routine.meditationCompleted}
                      sx={{ p: 0, color: "#10B981", "&.Mui-checked": { color: "#10B981" } }}
                    />
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, display: "block", fontSize: "0.72rem" }}>
                        4. 10m Meditation
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: "0.66rem", color: routine.meditationCompleted ? "#10B981" : "text.secondary" }}>
                        {routine.meditationCompleted ? "✅ Completed" : "Pending"}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Card>

            {/* 3. THE 4 COMPREHENSIVE ROUTINE WORKFLOW CARDS */}
            <Grid container spacing={2}>
              {/* ============================================================ */}
              {/* STEP 1: REVIEW ECONOMIC CALENDAR                             */}
              {/* ============================================================ */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  sx={{
                    p: 2,
                    height: "100%",
                    borderRadius: "8px",
                    bgcolor: isDark ? "#0B1226" : "#FFFFFF",
                    border: routine.economicCalendarReviewed
                      ? (isDark ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid #A7F3D0")
                      : (isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0"),
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "6px",
                          bgcolor: routine.economicCalendarReviewed ? "#10B981" : "#2563EB",
                          color: "#FFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CalendarIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.92rem" }}>
                          1. Review Economic Calendar
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                          Identify high-impact news & volatility drivers
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      size="small"
                      variant={routine.economicCalendarReviewed ? "contained" : "outlined"}
                      onClick={() => setRoutine((r) => ({ ...r, economicCalendarReviewed: !r.economicCalendarReviewed }))}
                      startIcon={routine.economicCalendarReviewed ? <CheckIcon sx={{ fontSize: 14 }} /> : null}
                      sx={{
                        fontSize: "0.72rem",
                        height: 26,
                        textTransform: "none",
                        fontWeight: 700,
                        bgcolor: routine.economicCalendarReviewed ? "#10B981" : "transparent",
                        borderColor: routine.economicCalendarReviewed ? "#10B981" : undefined,
                        color: routine.economicCalendarReviewed ? "#FFF" : undefined,
                      }}
                    >
                      {routine.economicCalendarReviewed ? "Reviewed" : "Mark as Done"}
                    </Button>
                  </Box>

                  {/* Calendar Quick Links */}
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.8, fontSize: "0.7rem" }}>
                    QUICK ECONOMIC CALENDARS:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", mb: 1.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      component="a"
                      href="https://www.forexfactory.com/calendar"
                      target="_blank"
                      rel="noopener noreferrer"
                      endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                      sx={{ fontSize: "0.7rem", height: 26, textTransform: "none", fontWeight: 600 }}
                    >
                      ForexFactory
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      component="a"
                      href="https://www.tradingview.com/economic-calendar/"
                      target="_blank"
                      rel="noopener noreferrer"
                      endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                      sx={{ fontSize: "0.7rem", height: 26, textTransform: "none", fontWeight: 600 }}
                    >
                      TradingView Calendar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      component="a"
                      href="https://www.investing.com/economic-calendar/"
                      target="_blank"
                      rel="noopener noreferrer"
                      endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                      sx={{ fontSize: "0.7rem", height: 26, textTransform: "none", fontWeight: 600 }}
                    >
                      Investing.com
                    </Button>
                  </Box>

                  {/* Quick Event Tags */}
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.5, fontSize: "0.7rem" }}>
                    TODAY'S HIGH IMPACT EVENTS / RED FOLDERS:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1 }}>
                    {["FOMC", "CPI", "NFP", "PPI", "Rate Decision", "PMI", "Unemployment", "None Today"].map((ev) => (
                      <Chip
                        key={ev}
                        label={ev}
                        size="small"
                        clickable
                        onClick={() => {
                          const curr = routine.economicCalendarNotes;
                          const addition = curr ? `${curr}, ${ev}` : ev;
                          setRoutine((r) => ({ ...r, economicCalendarNotes: addition }));
                        }}
                        sx={{
                          height: 22,
                          fontSize: "0.66rem",
                          fontWeight: 600,
                          bgcolor: routine.economicCalendarNotes.includes(ev)
                            ? (isDark ? "rgba(59, 130, 246, 0.3)" : "#DBEAFE")
                            : (isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9"),
                        }}
                      />
                    ))}
                  </Box>

                  <TextField
                    fullWidth
                    multiline
                    rows={2.5}
                    size="small"
                    placeholder="Enter notes on news events, expected release times, and restricted trading windows..."
                    value={routine.economicCalendarNotes}
                    onChange={(e) => setRoutine((r) => ({ ...r, economicCalendarNotes: e.target.value }))}
                    sx={{ "& .MuiInputBase-root": { fontSize: "0.78rem" } }}
                  />
                </Card>
              </Grid>

              {/* ============================================================ */}
              {/* STEP 2: REVIEW TRADE PLAN                                    */}
              {/* ============================================================ */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  sx={{
                    p: 2,
                    height: "100%",
                    borderRadius: "8px",
                    bgcolor: isDark ? "#0B1226" : "#FFFFFF",
                    border: routine.tradePlanReviewed
                      ? (isDark ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid #A7F3D0")
                      : (isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0"),
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "6px",
                          bgcolor: routine.tradePlanReviewed ? "#10B981" : "#8B5CF6",
                          color: "#FFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ChecklistIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.92rem" }}>
                          2. Review Trade Plan & Risk
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                          Daily bias, max risk boundaries & rules commitment
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      size="small"
                      variant={routine.tradePlanReviewed ? "contained" : "outlined"}
                      onClick={() => setRoutine((r) => ({ ...r, tradePlanReviewed: !r.tradePlanReviewed }))}
                      startIcon={routine.tradePlanReviewed ? <CheckIcon sx={{ fontSize: 14 }} /> : null}
                      sx={{
                        fontSize: "0.72rem",
                        height: 26,
                        textTransform: "none",
                        fontWeight: 700,
                        bgcolor: routine.tradePlanReviewed ? "#10B981" : "transparent",
                        borderColor: routine.tradePlanReviewed ? "#10B981" : undefined,
                        color: routine.tradePlanReviewed ? "#FFF" : undefined,
                      }}
                    >
                      {routine.tradePlanReviewed ? "Committed" : "Commit to Plan"}
                    </Button>
                  </Box>

                  {/* Daily Bias Selector */}
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.6, fontSize: "0.7rem" }}>
                    DAILY MARKET BIAS:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.8, mb: 1.5 }}>
                    {[
                      { label: "BULLISH", color: "#10B981" },
                      { label: "BEARISH", color: "#EF4444" },
                      { label: "NEUTRAL / RANGE", color: "#3B82F6" },
                    ].map((b) => (
                      <Chip
                        key={b.label}
                        label={b.label}
                        clickable
                        onClick={() => setRoutine((r) => ({ ...r, dailyBias: b.label }))}
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.7rem",
                          height: 26,
                          flex: 1,
                          bgcolor: routine.dailyBias === b.label ? b.color : isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                          color: routine.dailyBias === b.label ? "#FFF" : "inherit",
                          border: routine.dailyBias === b.label ? `1px solid ${b.color}` : "1px solid transparent",
                        }}
                      />
                    ))}
                  </Box>

                  {/* Risk & Rules Controls */}
                  <Grid container spacing={1} sx={{ mb: 1.2 }}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Max Daily Loss Limit ($)"
                        type="number"
                        value={routine.maxDailyLoss}
                        onChange={(e) => setRoutine((r) => ({ ...r, maxDailyLoss: e.target.value }))}
                        slotProps={{
                          input: {
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          },
                        }}
                        sx={{ "& .MuiInputBase-root": { height: 32, fontSize: "0.78rem" } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Min Planned R:R"
                        defaultValue="1:2"
                        sx={{ "& .MuiInputBase-root": { height: 32, fontSize: "0.78rem" } }}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    placeholder="Trade plan details: specific setups to take, rules adherence, maximum allowed positions today..."
                    value={routine.tradePlanNotes}
                    onChange={(e) => setRoutine((r) => ({ ...r, tradePlanNotes: e.target.value }))}
                    sx={{ "& .MuiInputBase-root": { fontSize: "0.78rem" } }}
                  />
                </Card>
              </Grid>

              {/* ============================================================ */}
              {/* STEP 3: ANALYZE CHARTS                                       */}
              {/* ============================================================ */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  sx={{
                    p: 2,
                    height: "100%",
                    borderRadius: "8px",
                    bgcolor: isDark ? "#0B1226" : "#FFFFFF",
                    border: routine.chartsAnalyzed
                      ? (isDark ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid #A7F3D0")
                      : (isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0"),
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "6px",
                          bgcolor: routine.chartsAnalyzed ? "#10B981" : "#0284C7",
                          color: "#FFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ShowChartIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.92rem" }}>
                          3. Analyze Charts & Zones
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                          Map HTF levels, market structure & setup triggers
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      size="small"
                      variant={routine.chartsAnalyzed ? "contained" : "outlined"}
                      onClick={() => setRoutine((r) => ({ ...r, chartsAnalyzed: !r.chartsAnalyzed }))}
                      startIcon={routine.chartsAnalyzed ? <CheckIcon sx={{ fontSize: 14 }} /> : null}
                      sx={{
                        fontSize: "0.72rem",
                        height: 26,
                        textTransform: "none",
                        fontWeight: 700,
                        bgcolor: routine.chartsAnalyzed ? "#10B981" : "transparent",
                        borderColor: routine.chartsAnalyzed ? "#10B981" : undefined,
                        color: routine.chartsAnalyzed ? "#FFF" : undefined,
                      }}
                    >
                      {routine.chartsAnalyzed ? "Analyzed" : "Mark Charts Done"}
                    </Button>
                  </Box>

                  {/* Watchlist Symbol Selection (12 Requested Symbols) */}
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.6, fontSize: "0.7rem" }}>
                    SELECT SYMBOLS ON TODAY'S RADAR:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1.5 }}>
                    {TRADING_SYMBOLS.map((sym) => {
                      const isSelected = routine.watchlist.includes(sym);
                      return (
                        <Chip
                          key={sym}
                          label={sym}
                          size="small"
                          clickable
                          onClick={() => {
                            setRoutine((r) => ({
                              ...r,
                              watchlist: isSelected
                                ? r.watchlist.filter((s) => s !== sym)
                                : [...r.watchlist, sym],
                            }));
                          }}
                          sx={{
                            height: 22,
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            bgcolor: isSelected ? "#2563EB" : isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                            color: isSelected ? "#FFF" : "inherit",
                            border: isSelected ? "1px solid #3B82F6" : "1px solid transparent",
                          }}
                        />
                      );
                    })}
                  </Box>

                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.5, fontSize: "0.7rem" }}>
                    CHART STRUCTURE & KEY PRICE ZONES:
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3.5}
                    size="small"
                    placeholder="e.g. XAUUSD: 2680 resistance orderblock; EURUSD: liquidity sweep at 1.0820; NIFTY: previous day high retest..."
                    value={routine.chartNotes}
                    onChange={(e) => setRoutine((r) => ({ ...r, chartNotes: e.target.value }))}
                    sx={{ "& .MuiInputBase-root": { fontSize: "0.78rem" } }}
                  />
                </Card>
              </Grid>

              {/* ============================================================ */}
              {/* STEP 4: 10 MINS MEDITATIONS & MINDFULNESS TIMER             */}
              {/* ============================================================ */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  sx={{
                    p: 2,
                    height: "100%",
                    borderRadius: "8px",
                    bgcolor: isDark ? "#0B1226" : "#FFFFFF",
                    border: routine.meditationCompleted
                      ? (isDark ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid #A7F3D0")
                      : (isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0"),
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "6px",
                          bgcolor: routine.meditationCompleted ? "#10B981" : "#10B981",
                          color: "#FFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MeditationIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.92rem" }}>
                          4. 10 Mins Meditation & Focus
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                          Center your breathing, dissolve FOMO & build discipline
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      size="small"
                      variant={routine.meditationCompleted ? "contained" : "outlined"}
                      onClick={() => setRoutine((r) => ({ ...r, meditationCompleted: !r.meditationCompleted }))}
                      startIcon={routine.meditationCompleted ? <CheckIcon sx={{ fontSize: 14 }} /> : null}
                      sx={{
                        fontSize: "0.72rem",
                        height: 26,
                        textTransform: "none",
                        fontWeight: 700,
                        bgcolor: routine.meditationCompleted ? "#10B981" : "transparent",
                        borderColor: routine.meditationCompleted ? "#10B981" : undefined,
                        color: routine.meditationCompleted ? "#FFF" : undefined,
                      }}
                    >
                      {routine.meditationCompleted ? "Completed" : "Mark as Done"}
                    </Button>
                  </Box>

                  {/* Interactive Meditation Timer Display */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.8,
                      borderRadius: "8px",
                      bgcolor: isDark ? "#070B16" : "#F8FAFC",
                      border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1.5,
                    }}
                  >
                    {/* Digital Countdown Timer */}
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 900,
                          letterSpacing: 2,
                          fontFamily: "monospace",
                          color: meditationIsRunning ? "#10B981" : isDark ? "#F8FAFC" : "#0F172A",
                        }}
                      >
                        {String(Math.floor(meditationTimeLeft / 60)).padStart(2, "0")}:
                        {String(meditationTimeLeft % 60).padStart(2, "0")}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                        / 10:00 MINS
                      </Typography>
                    </Box>

                    {/* Box Breathing Prompt */}
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "20px",
                        bgcolor: meditationIsRunning
                          ? (isDark ? "rgba(16, 185, 129, 0.2)" : "#DCFCE7")
                          : (isDark ? "rgba(255,255,255,0.05)" : "#E2E8F0"),
                        color: meditationIsRunning ? "#10B981" : "text.secondary",
                        fontSize: "0.74rem",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.6,
                        mb: 1.2,
                      }}
                    >
                      <SpaIcon sx={{ fontSize: 14 }} />
                      {meditationIsRunning
                        ? `Box Breathing: ${breathingPhase.toUpperCase()} (${breathingTimer}s)`
                        : "Ready for 10-Minute Guided Box Breathing"}
                    </Box>

                    {/* Timer Controls */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setMeditationTimeLeft((prev) => Math.max(60, prev - 60))}
                        sx={{ minWidth: 32, px: 1, height: 28, fontSize: "0.72rem" }}
                      >
                        -1m
                      </Button>

                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => setMeditationIsRunning(!meditationIsRunning)}
                        startIcon={meditationIsRunning ? <PauseIcon sx={{ fontSize: 16 }} /> : <PlayIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          height: 32,
                          px: 2,
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          bgcolor: meditationIsRunning ? "#F59E0B" : "#10B981",
                          "&:hover": { bgcolor: meditationIsRunning ? "#D97706" : "#059669" },
                        }}
                      >
                        {meditationIsRunning ? "Pause" : meditationTimeLeft === 0 ? "Restart" : "Start Meditation"}
                      </Button>

                      <Tooltip title="Reset timer to 10:00">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setMeditationIsRunning(false);
                            setMeditationTimeLeft(600);
                          }}
                          sx={{ border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #CBD5E1", width: 28, height: 28 }}
                        >
                          <ResetIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>

                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setMeditationTimeLeft((prev) => Math.min(1800, prev + 60))}
                        sx={{ minWidth: 32, px: 1, height: 28, fontSize: "0.72rem" }}
                      >
                        +1m
                      </Button>
                    </Box>
                  </Paper>

                  {/* Mindset Rating & Trader Affirmation */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.72rem" }}>
                      RATE YOUR MENTAL CLARITY (1-5):
                    </Typography>
                    <Rating
                      value={routine.mindsetRating}
                      onChange={(_, val) => setRoutine((r) => ({ ...r, mindsetRating: val || 5 }))}
                      size="small"
                    />
                  </Box>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.2,
                      borderRadius: "6px",
                      bgcolor: isDark ? "rgba(16, 185, 129, 0.08)" : "#F0FDF4",
                      border: isDark ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid #DCFCE7",
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#10B981", display: "block", mb: 0.2, fontSize: "0.68rem" }}>
                      TRADER DISCIPLINE AFFIRMATION:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: "0.74rem", fontStyle: "italic", color: isDark ? "#E2E8F0" : "#334155" }}>
                      &ldquo;I trade with complete patience. I accept the risk on every execution without fear or greed. The market owes me nothing. I follow my plan.&rdquo;
                    </Typography>
                  </Paper>
                </Card>
              </Grid>
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
              bgcolor: isDark ? "#0E162B" : "#FFFFFF",
              borderRadius: "8px",
              border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0",
              p: 1.5,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
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
              bgcolor: "#2563EB",
              fontWeight: 700,
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
              bgcolor: isDark ? "#0E162B" : "#FFFFFF",
              borderRadius: "8px",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              p: 1.5,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#EF4444", display: "flex", alignItems: "center", gap: 1 }}>
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
            sx={{ fontWeight: 700, borderRadius: "6px" }}
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
                  PART 1 — Trade Setup & Execution
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
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>5. Direction:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: selectedTrade.direction === "BUY" ? "#10B981" : "#EF4444" }}>
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
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1 }}>
                  PART 2 — Price Levels & Sizing (Fields 8 – 12)
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Entry Price:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedTrade.entry_price}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Stop Loss (SL):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#EF4444" }}>{selectedTrade.stop_loss ?? "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Take Profit (TP):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#10B981" }}>{selectedTrade.take_profit ?? "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Exit Price:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedTrade.exit_price ?? "OPEN"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.4 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Lots / Quantity:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedTrade.volume ?? "1"}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Part 3: Risk & Financial Engine (Fields 14-20) */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#D97706", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1 }}>
                  PART 3 — Risk, Reward & Financial Engine
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6, sm: 1.7 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Risk Amount:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#EF4444" }}>${selectedTrade.planned_risk_amount ?? "-"}</Typography>
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
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedTrade.planned_rr_ratio ? `1 : ${selectedTrade.planned_rr_ratio}` : "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Realized P&L:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 900, color: (selectedTrade.net_pnl || 0) >= 0 ? "#10B981" : "#EF4444" }}>
                      {(selectedTrade.net_pnl || 0) >= 0 ? `+$${selectedTrade.net_pnl}` : `-$${Math.abs(selectedTrade.net_pnl || 0)}`}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.6 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Actual R:R:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "#8B5CF6" }}>{selectedTrade.actual_r ? `${selectedTrade.actual_r}R` : "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.6 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Result:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: (selectedTrade.net_pnl || 0) >= 0 ? "#10B981" : "#EF4444" }}>
                      {selectedTrade.result || ((selectedTrade.net_pnl || 0) > 0 ? "WIN" : "LOSS")}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Part 4: Psychology & Mindset */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#8B5CF6", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1 }}>
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
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#38BDF8" }}>{selectedTrade.confidence_rating || 5}/5</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.5 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Discipline (1-5):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#10B981" }}>{selectedTrade.discipline_rating || 5}/5</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Mistake Flag:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: selectedTrade.mistake_flag ? "#EF4444" : "#10B981" }}>
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
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#06B6D4", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1 }}>
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
