/**
 * ApexBudget — Personal Monthly Budget Planner
 * Modern, responsive financial planner with localStorage persistence.
 */

(function () {
  'use strict';

  // --- Auth Guard ---
  const SESSION_KEY  = 'apexbudget_session';
  const REMEMBER_KEY = 'apexbudget_remember';
  const AUTH_PAGE    = 'auth.html';

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(REMEMBER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    window.location.href = AUTH_PAGE;
  }

  // Redirect to login if not authenticated
  const _session = getSession();
  if (!_session) {
    window.location.href = AUTH_PAGE;
  }

  // --- Constants & Category Definitions ---
  const STORAGE_KEY = 'APEX_BUDGET_APP_DATA_V1';

  const EXPENSE_CATEGORIES = [
    { id: 'housing', name: 'Housing & Rent', icon: '🏠', color: '#6366f1' },
    { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#f97316' },
    { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#10b981' },
    { id: 'transport', name: 'Transportation', icon: '🚗', color: '#3b82f6' },
    { id: 'utilities', name: 'Utilities & Bills', icon: '💡', color: '#eab308' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎮', color: '#ec4899' },
    { id: 'health', name: 'Health & Wellness', icon: '💊', color: '#14b8a6' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#a855f7' },
    { id: 'education', name: 'Education', icon: '📚', color: '#06b6d4' },
    { id: 'debt', name: 'Debt & Loans', icon: '💳', color: '#f43f5e' },
    { id: 'other_expense', name: 'Other Expenses', icon: '📦', color: '#64748b' }
  ];

  const INCOME_CATEGORIES = [
    { id: 'salary', name: 'Salary & Wages', icon: '💼', color: '#10b981' },
    { id: 'freelance', name: 'Freelance & Client', icon: '💻', color: '#3b82f6' },
    { id: 'investments', name: 'Investments', icon: '📈', color: '#8b5cf6' },
    { id: 'business', name: 'Business Revenue', icon: '🏢', color: '#0ea5e9' },
    { id: 'side_hustle', name: 'Side Hustle', icon: '⚡', color: '#f59e0b' },
    { id: 'gifts', name: 'Gifts & Grants', icon: '🎁', color: '#ec4899' },
    { id: 'other_income', name: 'Other Income', icon: '💵', color: '#64748b' }
  ];

  const ALL_CATEGORIES_MAP = {};
  [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].forEach(c => {
    ALL_CATEGORIES_MAP[c.id] = c;
  });

  // --- Initial / Default Demo State ---
  function getSampleData(yearMonth) {
    const [y, m] = yearMonth.split('-');
    return {
      currency: '$',
      theme: 'dark',
      budgets: {
        [yearMonth]: 3600
      },
      transactions: [
        {
          id: 'tx-1',
          type: 'income',
          description: 'Tech Corp Monthly Salary',
          amount: 4500,
          category: 'salary',
          date: `${y}-${m}-01`,
          notes: '#direct-deposit'
        },
        {
          id: 'tx-2',
          type: 'income',
          description: 'Design Consulting Client',
          amount: 850,
          category: 'freelance',
          date: `${y}-${m}-05`,
          notes: 'Invoice #104'
        },
        {
          id: 'tx-3',
          type: 'expense',
          description: 'Apartment Rent Payment',
          amount: 1450,
          category: 'housing',
          date: `${y}-${m}-02`,
          notes: 'Monthly Lease'
        },
        {
          id: 'tx-4',
          type: 'expense',
          description: 'Whole Foods Grocery Run',
          amount: 142.50,
          category: 'groceries',
          date: `${y}-${m}-04`,
          notes: 'Weekly pantry'
        },
        {
          id: 'tx-5',
          type: 'expense',
          description: 'Electricity & High-Speed Internet',
          amount: 135,
          category: 'utilities',
          date: `${y}-${m}-06`,
          notes: 'ConEd & Fiber'
        },
        {
          id: 'tx-6',
          type: 'expense',
          description: 'Weekend Dining & Sushi',
          amount: 88.50,
          category: 'food',
          date: `${y}-${m}-07`,
          notes: 'Family dinner'
        },
        {
          id: 'tx-7',
          type: 'expense',
          description: 'Subway & Transit Pass',
          amount: 65,
          category: 'transport',
          date: `${y}-${m}-08`,
          notes: 'Monthly pass refill'
        },
        {
          id: 'tx-8',
          type: 'expense',
          description: 'Cinema & Streaming Services',
          amount: 44.99,
          category: 'entertainment',
          date: `${y}-${m}-09`,
          notes: 'Netflix & Imax'
        }
      ]
    };
  }

  // --- App State ---
  const state = {
    currentYearMonth: getCurrentYearMonth(),
    currency: '$',
    theme: 'dark',
    budgets: {},
    transactions: [],
    filters: {
      type: 'all',
      search: '',
      category: 'all',
      sort: 'date-desc'
    }
  };

  // Helper date functions
  function getCurrentYearMonth() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  function getDaysInMonth(yearMonth) {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }

  function formatMonthLabel(yearMonth) {
    const [year, month] = yearMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function formatCurrency(amount) {
    const formatted = Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${state.currency}${formatted}`;
  }

  function getActiveStorageKey() {
    const session = getSession();
    if (session && session.email && !session.isGuest) {
      return `${STORAGE_KEY}_${session.email.toLowerCase()}`;
    }
    return STORAGE_KEY;
  }

  // --- LocalStorage Layer ---
  function loadFromStorage() {
    try {
      const key = getActiveStorageKey();
      let stored = localStorage.getItem(key);
      if (!stored && key !== STORAGE_KEY) {
        stored = localStorage.getItem(STORAGE_KEY);
      }
      if (stored) {
        const parsed = JSON.parse(stored);
        state.currency = parsed.currency || '$';
        state.theme = parsed.theme || 'dark';
        state.budgets = parsed.budgets || {};
        state.transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
      } else {
        // Pre-fill with sample data for initial wow factor
        const sample = getSampleData(state.currentYearMonth);
        state.currency = sample.currency;
        state.theme = sample.theme;
        state.budgets = sample.budgets;
        state.transactions = sample.transactions;
        saveToStorage();
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
  }

  function saveToStorage() {
    try {
      const payload = {
        currency: state.currency,
        theme: state.theme,
        budgets: state.budgets,
        transactions: state.transactions
      };
      localStorage.setItem(getActiveStorageKey(), JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
      showToast('Error saving data to local storage', 'error');
    }
  }

  // --- UI Elements ---
  const el = {
    // Theme
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    themeSunIcon: document.getElementById('theme-sun-icon'),
    themeMoonIcon: document.getElementById('theme-moon-icon'),

    // Month Navigation
    prevMonthBtn: document.getElementById('prev-month-btn'),
    nextMonthBtn: document.getElementById('next-month-btn'),
    currentMonthLabel: document.getElementById('current-month-label'),
    monthPickerInput: document.getElementById('month-picker-input'),

    // Currency
    currencySelect: document.getElementById('currency-select'),

    // Banner
    budgetStatusPill: document.getElementById('budget-status-pill'),
    budgetStatusText: document.getElementById('budget-status-text'),
    budgetStatusDetail: document.getElementById('budget-status-detail'),
    quickSetBudgetBtn: document.getElementById('quick-set-budget-btn'),

    // KPI Cards
    editBudgetBtn: document.getElementById('edit-budget-btn'),
    kpiBudgetAmount: document.getElementById('kpi-budget-amount'),
    budgetProgressFill: document.getElementById('budget-progress-fill'),
    budgetSpentPercent: document.getElementById('budget-spent-percent'),
    budgetAvailableLeft: document.getElementById('budget-available-left'),

    kpiIncomeAmount: document.getElementById('kpi-income-amount'),
    incomeCountBadge: document.getElementById('income-count-badge'),
    savingsRateIndicator: document.getElementById('savings-rate-indicator'),

    kpiExpenseAmount: document.getElementById('kpi-expense-amount'),
    expenseCountBadge: document.getElementById('expense-count-badge'),
    dailyAvgSpend: document.getElementById('daily-avg-spend'),

    kpiBalanceAmount: document.getElementById('kpi-balance-amount'),
    balanceStatusBadge: document.getElementById('balance-status-badge'),
    balanceSubtextDetail: document.getElementById('balance-subtext-detail'),
    safeDailySpend: document.getElementById('safe-daily-spend'),

    // Chart & Breakdown
    chartTotalTag: document.getElementById('chart-total-tag'),
    categoryDonutChart: document.getElementById('category-donut-chart'),
    topCategoryName: document.getElementById('top-category-name'),
    topCategoryValue: document.getElementById('top-category-value'),
    categoryLegendList: document.getElementById('category-legend-list'),
    monthDaysLeftTag: document.getElementById('month-days-left-tag'),
    pacingPercentage: document.getElementById('pacing-percentage'),
    timePacingBar: document.getElementById('time-pacing-bar'),
    budgetConsumedPercentage: document.getElementById('budget-consumed-percentage'),
    spendingPacingBar: document.getElementById('spending-pacing-bar'),
    topCategoriesBars: document.getElementById('top-categories-bars'),
    financialInsightText: document.getElementById('financial-insight-text'),

    // Transactions Workspace
    addTransactionBtn: document.getElementById('add-transaction-btn'),
    emptyAddBtn: document.getElementById('empty-add-btn'),
    filterAllBtn: document.getElementById('filter-all-btn'),
    filterExpenseBtn: document.getElementById('filter-expense-btn'),
    filterIncomeBtn: document.getElementById('filter-income-btn'),
    searchTransactionsInput: document.getElementById('search-transactions-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    filterCategorySelect: document.getElementById('filter-category-select'),
    sortTransactionsSelect: document.getElementById('sort-transactions-select'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    transactionsTableBody: document.getElementById('transactions-table-body'),
    noTransactionsState: document.getElementById('no-transactions-state'),
    summaryRecordsCount: document.getElementById('summary-records-count'),
    stripIncome: document.getElementById('strip-income'),
    stripExpense: document.getElementById('strip-expense'),
    stripNet: document.getElementById('strip-net'),

    // Modals
    transactionModal: document.getElementById('transaction-modal'),
    transactionForm: document.getElementById('transaction-form'),
    modalTitle: document.getElementById('modal-title'),
    modalSubtitle: document.getElementById('modal-subtitle'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalCancelBtn: document.getElementById('modal-cancel-btn'),
    modalSubmitBtn: document.getElementById('modal-submit-btn'),
    modalSubmitText: document.getElementById('modal-submit-text'),
    modalTypeBadge: document.getElementById('modal-type-badge'),
    modalBadgeEmoji: document.getElementById('modal-badge-emoji'),
    txModalHalo: document.getElementById('tx-modal-halo'),
    editTransactionId: document.getElementById('edit-transaction-id'),
    txTypeRadios: document.getElementsByName('tx-type'),
    txAmount: document.getElementById('tx-amount'),
    amountCurrencyIndicator: document.getElementById('amount-currency-indicator'),
    txDescription: document.getElementById('tx-description'),
    txDescCount: document.getElementById('tx-desc-count'),
    quickDescChips: document.getElementById('quick-desc-chips'),
    txCategory: document.getElementById('tx-category'),
    categoryChipsGrid: document.getElementById('category-chips-grid'),
    selectedCatLabel: document.getElementById('selected-cat-label'),
    txDate: document.getElementById('tx-date'),
    dateChipToday: document.getElementById('date-chip-today'),
    dateChipYesterday: document.getElementById('date-chip-yesterday'),
    txNotes: document.getElementById('tx-notes'),
    modalCurrencyAddon: document.getElementById('modal-currency-addon'),
    modalImpactCard: document.getElementById('modal-impact-card'),
    modalImpactBadge: document.getElementById('modal-impact-badge'),
    impactRemainingVal: document.getElementById('impact-remaining-val'),
    impactPercentVal: document.getElementById('impact-percent-val'),
    impactProgressBar: document.getElementById('impact-progress-bar'),
    impactCaptionText: document.getElementById('impact-caption-text'),
    impactMetricLabel1: document.getElementById('impact-metric-label-1'),
    impactMetricLabel2: document.getElementById('impact-metric-label-2'),

    budgetModal: document.getElementById('budget-modal'),
    budgetModalClose: document.getElementById('budget-modal-close'),
    budgetModalCancel: document.getElementById('budget-modal-cancel'),
    budgetForm: document.getElementById('budget-form'),
    budgetInput: document.getElementById('budget-input'),
    budgetModalMonthName: document.getElementById('budget-modal-month-name'),
    budgetModalCurrencyAddon: document.getElementById('budget-modal-currency-addon'),
    simSpentVal: document.getElementById('sim-spent-val'),
    simTargetVal: document.getElementById('sim-target-val'),
    simLeftVal: document.getElementById('sim-left-val'),
    simBarFill: document.getElementById('sim-bar-fill'),
    simBadge: document.getElementById('sim-badge'),
    simStatusNote: document.getElementById('sim-status-note'),

    dataOptionsBtn: document.getElementById('data-options-btn'),
    dataModal: document.getElementById('data-modal'),
    dataModalClose: document.getElementById('data-modal-close'),
    dataModalDone: document.getElementById('data-modal-done'),
    backupJsonBtn: document.getElementById('backup-json-btn'),
    exportAllCsvBtn: document.getElementById('export-all-csv-btn'),
    importJsonFile: document.getElementById('import-json-file'),
    loadSampleDataBtn: document.getElementById('load-sample-data-btn'),
    wipeAllDataBtn: document.getElementById('wipe-all-data-btn'),

    // Confirm Modal
    confirmModal: document.getElementById('confirm-modal'),
    confirmModalClose: document.getElementById('confirm-modal-close'),
    confirmModalCancel: document.getElementById('confirm-modal-cancel'),
    confirmModalAction: document.getElementById('confirm-modal-action'),
    confirmModalTitle: document.getElementById('confirm-modal-title'),
    confirmModalMessage: document.getElementById('confirm-modal-message'),
    confirmItemPreview: document.getElementById('confirm-item-preview'),

    // Footer actions
    quickSampleDataBtn: document.getElementById('quick-sample-data-btn'),
    quickClearMonthBtn: document.getElementById('quick-clear-month-btn'),

    // Toast Container
    toastContainer: document.getElementById('toast-container')
  };

  // --- Toast System ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // --- Theme Management ---
  function applyTheme(theme) {
    state.theme = theme;
    document.body.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      el.themeSunIcon.classList.remove('hidden');
      el.themeMoonIcon.classList.add('hidden');
    } else {
      el.themeSunIcon.classList.add('hidden');
      el.themeMoonIcon.classList.remove('hidden');
    }
    saveToStorage();
    renderDonutChart(); // redraw canvas with updated colors
  }

  // --- Category Population in Forms and Filter ---
  function populateCategoryOptions(selectedType = 'expense', selectedCatId = '') {
    const list = selectedType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    el.txCategory.innerHTML = list
      .map(c => `<option value="${c.id}" ${c.id === selectedCatId ? 'selected' : ''}>${c.icon} ${c.name}</option>`)
      .join('');

    const activeId = selectedCatId || (list[0] ? list[0].id : '');
    el.txCategory.value = activeId;

    renderCategoryChips(list, activeId);
    updateCategoryLabel(activeId);
  }

  function renderCategoryChips(list, activeId) {
    if (!el.categoryChipsGrid) return;
    el.categoryChipsGrid.innerHTML = list.map(c => {
      const isActive = c.id === activeId;
      return `
        <button type="button" class="category-chip-btn ${isActive ? 'active' : ''}" 
                data-cat-id="${c.id}" 
                style="--chip-accent: ${c.color}; --chip-accent-subtle: ${c.color}22; --chip-accent-glow: ${c.color}55;">
          <span class="cat-chip-icon">${c.icon}</span>
          <span class="cat-chip-name">${c.name}</span>
        </button>
      `;
    }).join('');

    el.categoryChipsGrid.querySelectorAll('.category-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const catId = btn.getAttribute('data-cat-id');
        el.txCategory.value = catId;
        updateSelectedCategoryChip(catId);
        updateCategoryLabel(catId);
      });
    });
  }

  function updateSelectedCategoryChip(activeId) {
    if (!el.categoryChipsGrid) return;
    el.categoryChipsGrid.querySelectorAll('.category-chip-btn').forEach(btn => {
      const isMatch = btn.getAttribute('data-cat-id') === activeId;
      btn.classList.toggle('active', isMatch);
    });
  }

  function updateCategoryLabel(catId) {
    if (!el.selectedCatLabel) return;
    const cat = ALL_CATEGORIES_MAP[catId];
    if (cat) {
      el.selectedCatLabel.textContent = `${cat.icon} ${cat.name}`;
      el.selectedCatLabel.style.color = cat.color;
    } else {
      el.selectedCatLabel.textContent = 'None selected';
      el.selectedCatLabel.style.color = 'var(--text-muted)';
    }
  }

  function populateFilterCategoryDropdown() {
    let optionsHtml = '<option value="all">All Categories</option>';
    optionsHtml += '<optgroup label="Expense Categories">';
    EXPENSE_CATEGORIES.forEach(c => {
      optionsHtml += `<option value="${c.id}">${c.icon} ${c.name}</option>`;
    });
    optionsHtml += '</optgroup><optgroup label="Income Categories">';
    INCOME_CATEGORIES.forEach(c => {
      optionsHtml += `<option value="${c.id}">${c.icon} ${c.name}</option>`;
    });
    optionsHtml += '</optgroup>';
    el.filterCategorySelect.innerHTML = optionsHtml;
  }

  // --- Core Computations for Currently Selected Month ---
  function getMonthTransactions() {
    return state.transactions.filter(t => t.date && t.date.startsWith(state.currentYearMonth));
  }

  function getMonthBudget() {
    // If not set for this month, default to 3000
    if (state.budgets[state.currentYearMonth] !== undefined) {
      return Number(state.budgets[state.currentYearMonth]);
    }
    return 3000;
  }

  function computeFinancials() {
    const monthTx = getMonthTransactions();
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    const categoryTotals = {};

    monthTx.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        totalIncome += amt;
        incomeCount++;
      } else {
        totalExpense += amt;
        expenseCount++;
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amt;
      }
    });

    const budget = getMonthBudget();
    const remainingBalance = totalIncome - totalExpense;
    const budgetLeft = budget - totalExpense;
    const budgetSpentPercent = budget > 0 ? (totalExpense / budget) * 100 : 0;

    // Days in current month & days passed
    const daysInMonth = getDaysInMonth(state.currentYearMonth);
    const today = new Date();
    const currentYM = getCurrentYearMonth();
    let dayOfMonth = daysInMonth; // default to end if past month
    if (state.currentYearMonth === currentYM) {
      dayOfMonth = today.getDate();
    } else if (state.currentYearMonth > currentYM) {
      dayOfMonth = 0; // future month
    }

    const daysRemaining = Math.max(1, daysInMonth - dayOfMonth);
    const monthProgressPct = Math.min(100, Math.round((dayOfMonth / daysInMonth) * 100));

    // Daily safe spend: budget left divided by remaining days
    const dailySafeSpend = budgetLeft > 0 ? budgetLeft / daysRemaining : 0;
    const dailyAvgSpend = dayOfMonth > 0 ? totalExpense / dayOfMonth : 0;

    // Savings rate
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    return {
      budget,
      totalIncome,
      totalExpense,
      incomeCount,
      expenseCount,
      remainingBalance,
      budgetLeft,
      budgetSpentPercent,
      daysInMonth,
      dayOfMonth,
      daysRemaining,
      monthProgressPct,
      dailySafeSpend,
      dailyAvgSpend,
      savingsRate,
      categoryTotals
    };
  }

  // --- Rendering UI ---
  function renderAll() {
    const f = computeFinancials();

    // 1. Month Header display
    el.currentMonthLabel.textContent = formatMonthLabel(state.currentYearMonth);
    el.monthPickerInput.value = state.currentYearMonth;
    el.currencySelect.value = state.currency;
    el.modalCurrencyAddon.textContent = state.currency;
    el.budgetModalCurrencyAddon.textContent = state.currency;

    // 2. Dynamic Status Banner
    renderStatusBanner(f);

    // 3. KPI Cards
    renderKPICards(f);

    // 4. Budget Health & Insights
    renderBudgetHealth(f);

    // 5. Category Donut Chart
    renderDonutChart(f);

    // 6. Transactions Table
    renderTransactionsTable();
  }

  function renderStatusBanner(f) {
    el.budgetStatusPill.className = 'banner-badge';
    let statusText = 'On Track';
    let detailText = '';

    if (f.totalExpense > f.budget) {
      el.budgetStatusPill.classList.add('danger');
      statusText = 'Over Budget';
      const overBy = f.totalExpense - f.budget;
      detailText = `You have exceeded your monthly budget by <strong>${formatCurrency(overBy)}</strong>. Review discretionary spending below.`;
    } else if (f.budgetSpentPercent >= 85) {
      el.budgetStatusPill.classList.add('warning');
      statusText = 'Budget Alert';
      detailText = `You have spent <strong>${Math.round(f.budgetSpentPercent)}%</strong> of your budget with <strong>${f.daysRemaining} days</strong> remaining in the month.`;
    } else {
      statusText = 'On Track';
      detailText = `You have <strong>${formatCurrency(f.budgetLeft)}</strong> remaining (${Math.round(100 - f.budgetSpentPercent)}% available). Spending pace is within target!`;
    }

    el.budgetStatusText.textContent = statusText;
    el.budgetStatusDetail.innerHTML = detailText;
  }

  function renderKPICards(f) {
    // Budget Card
    el.kpiBudgetAmount.textContent = formatCurrency(f.budget);
    const clampedPct = Math.min(100, Math.max(0, f.budgetSpentPercent));
    el.budgetProgressFill.style.width = `${clampedPct}%`;

    el.budgetProgressFill.className = 'budget-bar-fill';
    if (f.budgetSpentPercent > 100) {
      el.budgetProgressFill.classList.add('danger');
    } else if (f.budgetSpentPercent >= 80) {
      el.budgetProgressFill.classList.add('warning');
    }

    el.budgetSpentPercent.textContent = `${Math.round(f.budgetSpentPercent)}% spent`;
    el.budgetAvailableLeft.textContent = f.budgetLeft >= 0 
      ? `${formatCurrency(f.budgetLeft)} left` 
      : `${formatCurrency(Math.abs(f.budgetLeft))} over`;

    // Income Card
    el.kpiIncomeAmount.textContent = formatCurrency(f.totalIncome);
    el.incomeCountBadge.textContent = `${f.incomeCount} source${f.incomeCount === 1 ? '' : 's'}`;
    el.savingsRateIndicator.textContent = `Savings Rate: ${f.savingsRate}%`;

    // Expenses Card
    el.kpiExpenseAmount.textContent = formatCurrency(f.totalExpense);
    el.expenseCountBadge.textContent = `${f.expenseCount} record${f.expenseCount === 1 ? '' : 's'}`;
    el.dailyAvgSpend.textContent = `Daily avg: ${formatCurrency(f.dailyAvgSpend)}/day`;

    // Remaining Balance Card
    const balSign = f.remainingBalance < 0 ? '-' : '+';
    el.kpiBalanceAmount.textContent = `${balSign} ${formatCurrency(Math.abs(f.remainingBalance))}`;

    el.kpiBalanceAmount.className = 'kpi-value text-balance';
    if (f.remainingBalance >= 0) {
      el.kpiBalanceAmount.classList.add('positive');
      el.balanceStatusBadge.className = 'badge badge-income';
      el.balanceStatusBadge.textContent = 'Surplus';
    } else {
      el.kpiBalanceAmount.classList.add('negative');
      el.balanceStatusBadge.className = 'badge badge-expense';
      el.balanceStatusBadge.textContent = 'Deficit';
    }

    el.safeDailySpend.textContent = `Safe spend: ${formatCurrency(f.dailySafeSpend)}/day`;
  }

  function renderBudgetHealth(f) {
    el.monthDaysLeftTag.textContent = `Days left: ${f.daysRemaining}`;
    el.pacingPercentage.textContent = `${f.monthProgressPct}% of Month Passed`;
    el.timePacingBar.style.width = `${f.monthProgressPct}%`;

    const budgetPct = Math.min(100, Math.round(f.budgetSpentPercent));
    el.budgetConsumedPercentage.textContent = `${Math.round(f.budgetSpentPercent)}% of Budget Used`;
    el.spendingPacingBar.style.width = `${budgetPct}%`;
    el.spendingPacingBar.className = 'progress-bar-inner';
    if (f.budgetSpentPercent > 100) {
      el.spendingPacingBar.style.background = 'var(--expense-gradient)';
    } else if (f.budgetSpentPercent > 80) {
      el.spendingPacingBar.style.background = 'linear-gradient(90deg, #f59e0b, #ea580c)';
    } else {
      el.spendingPacingBar.style.background = 'var(--primary-gradient)';
    }

    // Top categories bars
    const sortedCats = Object.entries(f.categoryTotals).sort((a, b) => b[1] - a[1]);
    const top4 = sortedCats.slice(0, 4);

    if (top4.length === 0) {
      el.topCategoriesBars.innerHTML = '<p class="text-secondary" style="font-size:0.8rem; font-style:italic;">No expenses recorded yet this month.</p>';
    } else {
      let barsHtml = '';
      top4.forEach(([catId, amount]) => {
        const catInfo = ALL_CATEGORIES_MAP[catId] || { name: catId, icon: '🏷️', color: '#6366f1' };
        const pctOfTotal = f.totalExpense > 0 ? Math.round((amount / f.totalExpense) * 100) : 0;
        barsHtml += `
          <div class="cat-bar-item">
            <div class="cat-bar-info">
              <span>${catInfo.icon} ${catInfo.name}</span>
              <span><strong>${formatCurrency(amount)}</strong> <span style="color:var(--text-secondary); font-size:0.72rem;">(${pctOfTotal}%)</span></span>
            </div>
            <div class="cat-bar-track">
              <div class="cat-bar-fill" style="width: ${pctOfTotal}%; background: ${catInfo.color};"></div>
            </div>
          </div>
        `;
      });
      el.topCategoriesBars.innerHTML = barsHtml;
    }

    // Financial insight generator
    let insight = 'Add your income and expenses to unlock intelligent financial insights and suggestions.';
    if (f.totalExpense > 0) {
      if (f.budgetSpentPercent > f.monthProgressPct + 15) {
        insight = `⚠️ Caution: Spending pace (${Math.round(f.budgetSpentPercent)}%) is running faster than elapsed time (${f.monthProgressPct}%). Try to limit non-essential expenses for the remaining ${f.daysRemaining} days.`;
      } else if (f.savingsRate >= 25) {
        insight = `🌟 Great job! You are maintaining a healthy ${f.savingsRate}% savings rate. Consider allocating surplus to emergency savings or retirement investments.`;
      } else if (f.remainingBalance >= 0) {
        insight = `💡 Balanced spending! You have ${formatCurrency(f.budgetLeft)} remaining in your budget. Your safe daily spend is ${formatCurrency(f.dailySafeSpend)} per day.`;
      } else {
        insight = `⚠️ Expenses exceed income by ${formatCurrency(Math.abs(f.remainingBalance))}. Consider reviewing top expense categories like ${top4[0] ? ALL_CATEGORIES_MAP[top4[0][0]]?.name : 'housing'} to balance your cash flow.`;
      }
    }
    el.financialInsightText.textContent = insight;
  }

  // --- Donut Chart Custom Canvas Rendering ---
  function renderDonutChart(f = computeFinancials()) {
    const canvas = el.categoryDonutChart;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const width = 240;
    const height = 240;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = 100;
    const innerRadius = 66;

    el.chartTotalTag.textContent = `${formatCurrency(f.totalExpense)} total`;

    const sortedCats = Object.entries(f.categoryTotals).sort((a, b) => b[1] - a[1]);

    if (sortedCats.length === 0 || f.totalExpense <= 0) {
      // Empty state circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
      ctx.strokeStyle = state.theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = outerRadius - innerRadius;
      ctx.stroke();

      el.topCategoryName.textContent = 'None';
      el.topCategoryValue.textContent = formatCurrency(0);
      el.categoryLegendList.innerHTML = '<p class="text-secondary" style="padding: 1rem 0; font-size: 0.82rem; font-style: italic;">No expenses recorded for this month.</p>';
      return;
    }

    // Set top category overlay
    const [topId, topAmt] = sortedCats[0];
    const topCatObj = ALL_CATEGORIES_MAP[topId] || { name: topId, icon: '' };
    el.topCategoryName.textContent = `${topCatObj.icon} ${topCatObj.name}`;
    el.topCategoryValue.textContent = formatCurrency(topAmt);

    // Draw donut slices
    let startAngle = -Math.PI / 2;
    const sliceData = [];

    sortedCats.forEach(([catId, amount]) => {
      const sliceAngle = (amount / f.totalExpense) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;
      const catObj = ALL_CATEGORIES_MAP[catId] || { name: catId, color: '#6366f1', icon: '🏷️' };

      ctx.beginPath();
      ctx.arc(centerX, centerY, (outerRadius + innerRadius) / 2, startAngle, endAngle);
      ctx.strokeStyle = catObj.color;
      ctx.lineWidth = outerRadius - innerRadius;
      ctx.lineCap = 'butt';
      ctx.stroke();

      sliceData.push({
        catId,
        catObj,
        amount,
        percentage: Math.round((amount / f.totalExpense) * 100),
        startAngle,
        endAngle
      });

      startAngle = endAngle;
    });

    // Render legend list
    let legendHtml = '';
    sliceData.forEach(s => {
      legendHtml += `
        <div class="legend-item" title="${s.catObj.name}: ${formatCurrency(s.amount)} (${s.percentage}%)">
          <div class="legend-left">
            <span class="legend-color-dot" style="background: ${s.catObj.color}"></span>
            <span class="legend-name">${s.catObj.icon} ${s.catObj.name}</span>
          </div>
          <div class="legend-right">
            <span class="legend-amount">${formatCurrency(s.amount)}</span>
            <span class="legend-pct">${s.percentage}%</span>
          </div>
        </div>
      `;
    });
    el.categoryLegendList.innerHTML = legendHtml;
  }

  // --- Transactions Table & Filter Management ---
  function getFilteredTransactions() {
    let list = getMonthTransactions();

    // Filter by type
    if (state.filters.type !== 'all') {
      list = list.filter(t => t.type === state.filters.type);
    }

    // Filter by category
    if (state.filters.category !== 'all') {
      list = list.filter(t => t.category === state.filters.category);
    }

    // Search query
    if (state.filters.search.trim()) {
      const query = state.filters.search.toLowerCase().trim();
      list = list.filter(t => {
        const descMatch = (t.description || '').toLowerCase().includes(query);
        const notesMatch = (t.notes || '').toLowerCase().includes(query);
        const catInfo = ALL_CATEGORIES_MAP[t.category];
        const catMatch = catInfo && catInfo.name.toLowerCase().includes(query);
        return descMatch || notesMatch || catMatch;
      });
    }

    // Sort
    list.sort((a, b) => {
      if (state.filters.sort === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (state.filters.sort === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (state.filters.sort === 'amount-desc') return b.amount - a.amount;
      if (state.filters.sort === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    return list;
  }

  function renderTransactionsTable() {
    const list = getFilteredTransactions();

    if (list.length === 0) {
      el.transactionsTableBody.innerHTML = '';
      el.noTransactionsState.classList.remove('hidden');
    } else {
      el.noTransactionsState.classList.add('hidden');
      let rowsHtml = '';
      let subIncome = 0;
      let subExpense = 0;

      list.forEach(tx => {
        const isIncome = tx.type === 'income';
        const amt = Number(tx.amount) || 0;
        if (isIncome) subIncome += amt;
        else subExpense += amt;

        const cat = ALL_CATEGORIES_MAP[tx.category] || {
          name: tx.category,
          icon: isIncome ? '💵' : '📦',
          color: isIncome ? '#10b981' : '#64748b'
        };

        const formattedDate = new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        rowsHtml += `
          <tr data-id="${tx.id}">
            <td>
              <div class="tx-cat-cell">
                <div class="tx-cat-icon" style="background: ${cat.color}22; color: ${cat.color};">
                  ${cat.icon}
                </div>
                <div>
                  <span class="tx-cat-name">${escapeHtml(cat.name)}</span>
                  <span class="tx-cat-type">${tx.type}</span>
                </div>
              </div>
            </td>
            <td>
              <div class="tx-desc-cell">
                <span>${escapeHtml(tx.description)}</span>
                ${tx.notes ? `<span class="tx-tag-badge">${escapeHtml(tx.notes)}</span>` : ''}
              </div>
            </td>
            <td>
              <span class="tx-date-cell">${formattedDate}</span>
            </td>
            <td class="text-right">
              <span class="tx-amount-cell ${isIncome ? 'income' : 'expense'}">
                ${isIncome ? '+' : '-'}${formatCurrency(amt)}
              </span>
            </td>
            <td class="text-center">
              <div class="action-icon-group">
                <button class="table-icon-btn edit-tx-btn" data-id="${tx.id}" title="Edit Transaction" aria-label="Edit transaction">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="table-icon-btn delete-btn delete-tx-btn" data-id="${tx.id}" title="Delete Transaction" aria-label="Delete transaction">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      });
      el.transactionsTableBody.innerHTML = rowsHtml;

      // Summary strip
      el.summaryRecordsCount.textContent = `Showing ${list.length} transaction${list.length === 1 ? '' : 's'}`;
      el.stripIncome.textContent = formatCurrency(subIncome);
      el.stripExpense.textContent = formatCurrency(subExpense);
      const net = subIncome - subExpense;
      el.stripNet.textContent = `${net >= 0 ? '+' : '-'}${formatCurrency(Math.abs(net))}`;
      el.stripNet.style.color = net >= 0 ? 'var(--income)' : 'var(--expense)';
    }

    // Attach listeners on newly rendered action buttons
    attachTableActionListeners();
  }

  function attachTableActionListeners() {
    el.transactionsTableBody.querySelectorAll('.edit-tx-btn').forEach(btn => {
      btn.onclick = () => openEditTransactionModal(btn.getAttribute('data-id'));
    });
    el.transactionsTableBody.querySelectorAll('.delete-tx-btn').forEach(btn => {
      btn.onclick = () => handleDeleteTransaction(btn.getAttribute('data-id'));
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Smooth Modal Animation Helpers ---
  function openModalWithAnimation(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('modal-closing');
    modalEl.classList.remove('hidden');
  }

  function closeModalWithAnimation(modalEl) {
    if (!modalEl || modalEl.classList.contains('hidden')) return;
    modalEl.classList.add('modal-closing');
    setTimeout(() => {
      modalEl.classList.add('hidden');
      modalEl.classList.remove('modal-closing');
    }, 220);
  }

  // --- Custom High-End Confirmation Dialog System ---
  let confirmResolveCallback = null;

  function showConfirmModal({ title, message, itemDesc, itemAmount, itemMeta, confirmText = 'Confirm', isDanger = true }) {
    return new Promise(resolve => {
      confirmResolveCallback = resolve;

      el.confirmModalTitle.textContent = title || 'Confirm Action';
      el.confirmModalMessage.textContent = message || 'Are you sure you want to proceed?';
      el.confirmModalAction.querySelector('span').textContent = confirmText;

      if (isDanger) {
        el.confirmModalAction.className = 'action-btn danger-btn confirm-action-btn';
      } else {
        el.confirmModalAction.className = 'action-btn primary-btn confirm-action-btn';
      }

      if (itemDesc) {
        el.confirmItemPreview.classList.remove('hidden');
        el.confirmItemPreview.innerHTML = `
          <div class="confirm-item-info">
            <span class="confirm-item-desc">${escapeHtml(itemDesc)}</span>
            ${itemMeta ? `<span class="confirm-item-meta">${escapeHtml(itemMeta)}</span>` : ''}
          </div>
          ${itemAmount ? `<span class="confirm-item-amt">${escapeHtml(itemAmount)}</span>` : ''}
        `;
      } else {
        el.confirmItemPreview.classList.add('hidden');
        el.confirmItemPreview.innerHTML = '';
      }

      openModalWithAnimation(el.confirmModal);
    });
  }

  function closeConfirmModal(result = false) {
    closeModalWithAnimation(el.confirmModal);
    if (confirmResolveCallback) {
      confirmResolveCallback(result);
      confirmResolveCallback = null;
    }
  }

  // --- Transaction Modal Handling ---
  function syncModalTypeStyle(type) {
    if (el.txModalHalo) {
      el.txModalHalo.className = `modal-glow-halo ${type === 'income' ? 'income-mode' : 'expense-mode'}`;
    }
    if (el.modalTypeBadge) {
      el.modalTypeBadge.className = `modal-header-badge ${type === 'income' ? 'income-badge' : 'expense-badge'}`;
    }
    if (el.modalBadgeEmoji) {
      el.modalBadgeEmoji.textContent = type === 'income' ? '💰' : '💸';
    }
    if (el.modalSubmitText) {
      const isEditing = !!el.editTransactionId.value;
      el.modalSubmitText.textContent = isEditing 
        ? 'Update Record' 
        : (type === 'income' ? 'Save Income' : 'Save Expense');
    }
  }

  function openAddTransactionModal(defaultType = 'expense') {
    el.editTransactionId.value = '';
    el.modalTitle.textContent = 'Add Transaction';
    if (el.modalSubtitle) {
      el.modalSubtitle.textContent = 'Log your income or expense with real-time budget forecasting';
    }
    el.transactionForm.reset();

    // Select type radio
    const radio = document.querySelector(`input[name="tx-type"][value="${defaultType}"]`);
    if (radio) radio.checked = true;

    syncModalTypeStyle(defaultType);
    populateCategoryOptions(defaultType);

    // Default date to today in current month or 1st of viewed month
    const today = new Date();
    const todayYM = getCurrentYearMonth();
    if (state.currentYearMonth === todayYM) {
      el.txDate.value = today.toISOString().split('T')[0];
    } else {
      el.txDate.value = `${state.currentYearMonth}-01`;
    }

    el.modalCurrencyAddon.textContent = state.currency;
    if (el.amountCurrencyIndicator) {
      el.amountCurrencyIndicator.textContent = state.currency === '$' ? 'USD' : (state.currency === '€' ? 'EUR' : (state.currency === '£' ? 'GBP' : state.currency));
    }
    if (el.txDescCount) el.txDescCount.textContent = '0/80';

    updateLiveImpactCard();
    openModalWithAnimation(el.transactionModal);
    setTimeout(() => el.txAmount.focus(), 80);
  }

  function openEditTransactionModal(id) {
    const tx = state.transactions.find(t => t.id === id);
    if (!tx) return;

    el.editTransactionId.value = tx.id;
    el.modalTitle.textContent = 'Edit Transaction';
    if (el.modalSubtitle) {
      el.modalSubtitle.textContent = 'Update transaction details & recalculate budget';
    }

    const radio = document.querySelector(`input[name="tx-type"][value="${tx.type}"]`);
    if (radio) radio.checked = true;

    syncModalTypeStyle(tx.type);
    populateCategoryOptions(tx.type, tx.category);

    el.txAmount.value = tx.amount;
    el.txDescription.value = tx.description;
    el.txCategory.value = tx.category;
    el.txDate.value = tx.date;
    el.txNotes.value = tx.notes || '';
    el.modalCurrencyAddon.textContent = state.currency;
    if (el.amountCurrencyIndicator) {
      el.amountCurrencyIndicator.textContent = state.currency === '$' ? 'USD' : (state.currency === '€' ? 'EUR' : (state.currency === '£' ? 'GBP' : state.currency));
    }
    if (el.txDescCount) el.txDescCount.textContent = `${tx.description.length}/80`;

    updateLiveImpactCard();
    openModalWithAnimation(el.transactionModal);
  }

  function closeTransactionModal() {
    closeModalWithAnimation(el.transactionModal);
  }

  // --- Real-Time Impact Visualizer for Transaction Modal ---
  function updateLiveImpactCard() {
    if (!el.modalImpactCard) return;

    const selectedTypeRadio = document.querySelector('input[name="tx-type"]:checked');
    const type = selectedTypeRadio ? selectedTypeRadio.value : 'expense';
    const amountVal = parseFloat(el.txAmount.value) || 0;
    const currentBudget = getMonthBudget();

    const currentTxId = el.editTransactionId.value;
    const monthTxList = getMonthTransactions().filter(t => t.id !== currentTxId);

    const currentSpent = monthTxList.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const currentIncome = monthTxList.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

    if (type === 'expense') {
      const newSpent = currentSpent + amountVal;
      const remaining = currentBudget - newSpent;
      const spentPct = currentBudget > 0 ? Math.round((newSpent / currentBudget) * 100) : 0;

      el.impactMetricLabel1.textContent = 'Remaining Budget';
      el.impactMetricLabel2.textContent = 'Budget Used';
      el.impactRemainingVal.textContent = formatCurrency(remaining);
      el.impactPercentVal.textContent = `${spentPct}%`;

      el.impactProgressBar.style.width = `${Math.min(spentPct, 100)}%`;

      if (remaining < 0) {
        el.impactRemainingVal.className = 'impact-metric-val text-danger';
        el.impactProgressBar.className = 'impact-progress-bar bar-danger';
        el.modalImpactBadge.className = 'impact-badge badge-danger';
        el.modalImpactBadge.textContent = `Over budget by ${formatCurrency(Math.abs(remaining))}`;
        el.impactCaptionText.textContent = `⚠️ This expense will exceed your monthly budget threshold!`;
      } else if (spentPct >= 80) {
        el.impactRemainingVal.className = 'impact-metric-val text-warning';
        el.impactProgressBar.className = 'impact-progress-bar bar-warning';
        el.modalImpactBadge.className = 'impact-badge badge-warning';
        el.modalImpactBadge.textContent = 'Near Budget Limit';
        el.impactCaptionText.textContent = `Caution: spending pace will reach ${spentPct}% of monthly allowance.`;
      } else {
        el.impactRemainingVal.className = 'impact-metric-val text-success';
        el.impactProgressBar.className = 'impact-progress-bar';
        el.modalImpactBadge.className = 'impact-badge badge-safe';
        el.modalImpactBadge.textContent = 'Safe Spending';
        el.impactCaptionText.textContent = amountVal > 0 
          ? `Leaves ${formatCurrency(remaining)} safe balance for the rest of the month.`
          : 'Enter an amount to see live budget impact.';
      }
    } else {
      // Income
      const newIncome = currentIncome + amountVal;
      const netSavings = newIncome - currentSpent;

      el.impactMetricLabel1.textContent = 'Total Monthly Income';
      el.impactMetricLabel2.textContent = 'Projected Net Flow';
      el.impactRemainingVal.textContent = formatCurrency(newIncome);
      el.impactRemainingVal.className = 'impact-metric-val text-success';
      el.impactPercentVal.textContent = `${netSavings >= 0 ? '+' : ''}${formatCurrency(netSavings)}`;
      el.impactPercentVal.className = netSavings >= 0 ? 'impact-metric-val text-success' : 'impact-metric-val text-danger';

      el.impactProgressBar.style.width = '100%';
      el.impactProgressBar.className = 'impact-progress-bar';
      el.modalImpactBadge.className = 'impact-badge badge-income';
      el.modalImpactBadge.textContent = amountVal > 0 ? `+${formatCurrency(amountVal)} Cash Boost` : 'Income Inflow';
      el.impactCaptionText.textContent = amountVal > 0 
        ? `Increases your monthly cash flow cushion to ${formatCurrency(netSavings)}.`
        : 'Enter income to preview your total cash flow boost.';
    }
  }

  function handleSaveTransaction(e) {
    e.preventDefault();

    const id = el.editTransactionId.value;
    const type = document.querySelector('input[name="tx-type"]:checked').value;
    const amount = parseFloat(el.txAmount.value);
    const description = el.txDescription.value.trim();
    const category = el.txCategory.value;
    const date = el.txDate.value;
    const notes = el.txNotes.value.trim();

    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount greater than 0', 'error');
      el.txAmount.focus();
      return;
    }
    if (!description) {
      showToast('Please provide a brief description', 'error');
      el.txDescription.focus();
      return;
    }
    if (!date) {
      showToast('Please select a valid date', 'error');
      el.txDate.focus();
      return;
    }

    if (id) {
      // Edit
      const index = state.transactions.findIndex(t => t.id === id);
      if (index !== -1) {
        state.transactions[index] = {
          id,
          type,
          amount,
          description,
          category,
          date,
          notes
        };
        showToast('Transaction updated successfully', 'success');
      }
    } else {
      // Create new
      const newTx = {
        id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        type,
        amount,
        description,
        category,
        date,
        notes
      };
      state.transactions.unshift(newTx);
      showToast(`${type === 'income' ? 'Income' : 'Expense'} recorded!`, 'success');
    }

    // If transaction date is outside current viewed month, automatically switch to it or notify
    const txYM = date.substring(0, 7);
    if (txYM !== state.currentYearMonth) {
      state.currentYearMonth = txYM;
    }

    saveToStorage();
    closeTransactionModal();
    renderAll();
  }

  async function handleDeleteTransaction(id) {
    const tx = state.transactions.find(t => t.id === id);
    if (!tx) return;

    const cat = ALL_CATEGORIES_MAP[tx.category];
    const catName = cat?.name || tx.category;
    const catIcon = cat?.icon || '💳';

    const confirmed = await showConfirmModal({
      title: 'Delete Transaction?',
      message: 'This record will be permanently deleted from your budget history.',
      itemDesc: `${catIcon} ${tx.description}`,
      itemMeta: `${formatDate(tx.date)} • ${catName}`,
      itemAmount: `${tx.type === 'expense' ? '-' : '+'}${formatCurrency(tx.amount)}`,
      confirmText: 'Delete Record',
      isDanger: true
    });

    if (confirmed) {
      state.transactions = state.transactions.filter(t => t.id !== id);
      saveToStorage();
      renderAll();
      showToast('Transaction deleted', 'info');
    }
  }

  // --- Budget Modal Handling ---
  function openBudgetModal() {
    el.budgetModalMonthName.textContent = formatMonthLabel(state.currentYearMonth);
    el.budgetInput.value = getMonthBudget();
    el.budgetModalCurrencyAddon.textContent = state.currency;
    updateBudgetSimulation();
    openModalWithAnimation(el.budgetModal);
    setTimeout(() => el.budgetInput.focus(), 80);
  }

  function closeBudgetModal() {
    closeModalWithAnimation(el.budgetModal);
  }

  function updateBudgetSimulation() {
    if (!el.simTargetVal) return;

    const inputVal = parseFloat(el.budgetInput.value) || 0;
    const monthTxList = getMonthTransactions();
    const currentSpent = monthTxList.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    el.simSpentVal.textContent = formatCurrency(currentSpent);
    el.simTargetVal.textContent = formatCurrency(inputVal);

    const projectedLeft = inputVal - currentSpent;
    el.simLeftVal.textContent = `${projectedLeft >= 0 ? '' : '-'}${formatCurrency(Math.abs(projectedLeft))}`;
    el.simLeftVal.className = projectedLeft >= 0 ? 'sim-val text-success' : 'sim-val text-danger';

    const pct = inputVal > 0 ? Math.min(Math.round((currentSpent / inputVal) * 100), 100) : 100;
    el.simBarFill.style.width = `${pct}%`;

    // Highlight matching preset button
    document.querySelectorAll('.preset-chip').forEach(chip => {
      const amt = parseFloat(chip.getAttribute('data-amount'));
      chip.classList.toggle('active-preset', amt === inputVal);
    });

    if (inputVal <= 0) {
      el.simBadge.className = 'sim-badge badge-danger';
      el.simBadge.textContent = 'No Limit Set';
      el.simStatusNote.textContent = 'Please set a positive budget target for spending tracking.';
    } else if (projectedLeft < 0) {
      el.simBadge.className = 'sim-badge badge-danger';
      el.simBadge.textContent = 'Already Exceeded';
      el.simStatusNote.textContent = `Spent exceeds target by ${formatCurrency(Math.abs(projectedLeft))}.`;
    } else if (pct >= 85) {
      el.simBadge.className = 'sim-badge';
      el.simBadge.style.color = 'var(--warning)';
      el.simBadge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
      el.simBadge.textContent = 'Tight Allowance';
      el.simStatusNote.textContent = `${pct}% already consumed. Leaves ${formatCurrency(projectedLeft)} remaining.`;
    } else {
      el.simBadge.className = 'sim-badge';
      el.simBadge.style.color = 'var(--income)';
      el.simBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      el.simBadge.textContent = 'Healthy Buffer';
      el.simStatusNote.textContent = `${100 - pct}% of target still available (${formatCurrency(projectedLeft)} left).`;
    }
  }

  function handleSaveBudget(e) {
    e.preventDefault();
    const val = parseFloat(el.budgetInput.value);
    if (isNaN(val) || val < 0) {
      showToast('Please enter a valid non-negative budget limit', 'error');
      return;
    }

    state.budgets[state.currentYearMonth] = val;
    saveToStorage();
    closeBudgetModal();
    renderAll();
    showToast(`Monthly budget set to ${formatCurrency(val)}`, 'success');
  }

  // --- CSV & JSON Export / Import Handling ---
  function exportMonthCSV() {
    const list = getMonthTransactions();
    if (list.length === 0) {
      showToast('No transactions to export for this month', 'error');
      return;
    }

    let csvContent = 'Date,Type,Category,Description,Amount,Notes\n';
    list.forEach(t => {
      const catName = ALL_CATEGORIES_MAP[t.category]?.name || t.category;
      const desc = `"${(t.description || '').replace(/"/g, '""')}"`;
      const notes = `"${(t.notes || '').replace(/"/g, '""')}"`;
      csvContent += `${t.date},${t.type},${catName},${desc},${t.amount},${notes}\n`;
    });

    downloadFile(csvContent, `ApexBudget_${state.currentYearMonth}.csv`, 'text/csv');
    showToast(`Exported ${list.length} records to CSV`, 'success');
  }

  function exportAllCSV() {
    if (state.transactions.length === 0) {
      showToast('No transactions available in storage', 'error');
      return;
    }

    let csvContent = 'Date,Type,Category,Description,Amount,Notes\n';
    state.transactions.forEach(t => {
      const catName = ALL_CATEGORIES_MAP[t.category]?.name || t.category;
      const desc = `"${(t.description || '').replace(/"/g, '""')}"`;
      const notes = `"${(t.notes || '').replace(/"/g, '""')}"`;
      csvContent += `${t.date},${t.type},${catName},${desc},${t.amount},${notes}\n`;
    });

    downloadFile(csvContent, `ApexBudget_All_Transactions.csv`, 'text/csv');
    showToast(`Exported all ${state.transactions.length} records to CSV`, 'success');
  }

  function exportJSONBackup() {
    const payload = {
      version: 1,
      exportDate: new Date().toISOString(),
      currency: state.currency,
      budgets: state.budgets,
      transactions: state.transactions
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    downloadFile(jsonStr, `ApexBudget_Backup_${state.currentYearMonth}.json`, 'application/json');
    showToast('Full backup downloaded', 'success');
  }

  function handleImportJSON(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);
        if (data.transactions && Array.isArray(data.transactions)) {
          state.transactions = data.transactions;
          if (data.budgets && typeof data.budgets === 'object') {
            state.budgets = data.budgets;
          }
          if (data.currency) state.currency = data.currency;

          saveToStorage();
          renderAll();
          showToast(`Successfully restored ${data.transactions.length} transactions!`, 'success');
          el.dataModal.classList.add('hidden');
        } else {
          showToast('Invalid backup file format', 'error');
        }
      } catch (err) {
        showToast('Error parsing JSON backup file', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  }

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- Month Switcher Logic ---
  function changeMonth(offset) {
    const [year, month] = state.currentYearMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    state.currentYearMonth = `${y}-${m}`;
    renderAll();
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Theme toggle
    el.themeToggleBtn.addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });

    // Month Navigation
    el.prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    el.nextMonthBtn.addEventListener('click', () => changeMonth(1));
    el.monthPickerInput.addEventListener('change', (e) => {
      if (e.target.value) {
        state.currentYearMonth = e.target.value;
        renderAll();
      }
    });

    // Currency Switcher
    el.currencySelect.addEventListener('change', (e) => {
      state.currency = e.target.value;
      saveToStorage();
      renderAll();
      showToast(`Currency changed to ${state.currency}`, 'info');
    });

    // Add Transaction Buttons
    el.addTransactionBtn.addEventListener('click', () => openAddTransactionModal('expense'));
    el.emptyAddBtn.addEventListener('click', () => openAddTransactionModal('expense'));
    el.modalCloseBtn.addEventListener('click', closeTransactionModal);
    el.modalCancelBtn.addEventListener('click', closeTransactionModal);
    el.transactionForm.addEventListener('submit', handleSaveTransaction);

    // Dynamic type switcher in Modal (Expense vs Income changes available categories, halo & impact)
    Array.from(el.txTypeRadios).forEach(radio => {
      radio.addEventListener('change', (e) => {
        syncModalTypeStyle(e.target.value);
        populateCategoryOptions(e.target.value);
        updateLiveImpactCard();
      });
    });

    // Real-Time Amount & Live Impact Visualizer
    el.txAmount.addEventListener('input', updateLiveImpactCard);

    // Quick Amount Increment Chips (+10, +25, +50, +100, +500, Clear)
    document.querySelectorAll('.quick-amt-chip:not(.clear-chip)').forEach(chip => {
      chip.addEventListener('click', () => {
        const addVal = parseFloat(chip.getAttribute('data-add')) || 0;
        const currentVal = parseFloat(el.txAmount.value) || 0;
        el.txAmount.value = (currentVal + addVal).toFixed(2).replace(/\.00$/, '');
        updateLiveImpactCard();
        el.txAmount.focus();
      });
    });

    const clearAmtBtn = document.getElementById('quick-amt-clear');
    if (clearAmtBtn) {
      clearAmtBtn.addEventListener('click', () => {
        el.txAmount.value = '';
        updateLiveImpactCard();
        el.txAmount.focus();
      });
    }

    // Description char count & Quick Description Pills
    el.txDescription.addEventListener('input', (e) => {
      if (el.txDescCount) el.txDescCount.textContent = `${e.target.value.length}/80`;
    });

    if (el.quickDescChips) {
      el.quickDescChips.querySelectorAll('.quick-desc-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          el.txDescription.value = chip.getAttribute('data-desc');
          if (el.txDescCount) el.txDescCount.textContent = `${el.txDescription.value.length}/80`;
          el.txAmount.focus();
        });
      });
    }

    // Quick Date Shortcuts (Today, Yesterday)
    if (el.dateChipToday) {
      el.dateChipToday.addEventListener('click', () => {
        el.txDate.value = new Date().toISOString().split('T')[0];
      });
    }
    if (el.dateChipYesterday) {
      el.dateChipYesterday.addEventListener('click', () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        el.txDate.value = d.toISOString().split('T')[0];
      });
    }

    // Category Select Dropdown synchronization
    el.txCategory.addEventListener('change', (e) => {
      updateSelectedCategoryChip(e.target.value);
      updateCategoryLabel(e.target.value);
    });

    // Budget Editor & Live Simulation
    el.editBudgetBtn.addEventListener('click', openBudgetModal);
    el.quickSetBudgetBtn.addEventListener('click', openBudgetModal);
    el.budgetModalClose.addEventListener('click', closeBudgetModal);
    el.budgetModalCancel.addEventListener('click', closeBudgetModal);
    el.budgetForm.addEventListener('submit', handleSaveBudget);
    el.budgetInput.addEventListener('input', updateBudgetSimulation);

    // Preset Budget Chips
    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        el.budgetInput.value = chip.getAttribute('data-amount');
        updateBudgetSimulation();
      });
    });

    // Filters & Sorting in Transactions Workspace
    [el.filterAllBtn, el.filterExpenseBtn, el.filterIncomeBtn].forEach(btn => {
      btn.addEventListener('click', () => {
        [el.filterAllBtn, el.filterExpenseBtn, el.filterIncomeBtn].forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filters.type = btn.getAttribute('data-type');
        renderTransactionsTable();
      });
    });

    el.filterCategorySelect.addEventListener('change', (e) => {
      state.filters.category = e.target.value;
      renderTransactionsTable();
    });

    el.sortTransactionsSelect.addEventListener('change', (e) => {
      state.filters.sort = e.target.value;
      renderTransactionsTable();
    });

    el.searchTransactionsInput.addEventListener('input', (e) => {
      state.filters.search = e.target.value;
      if (e.target.value) {
        el.clearSearchBtn.classList.remove('hidden');
      } else {
        el.clearSearchBtn.classList.add('hidden');
      }
      renderTransactionsTable();
    });

    el.clearSearchBtn.addEventListener('click', () => {
      el.searchTransactionsInput.value = '';
      state.filters.search = '';
      el.clearSearchBtn.classList.add('hidden');
      renderTransactionsTable();
    });

    // CSV Exports
    el.exportCsvBtn.addEventListener('click', exportMonthCSV);
    el.exportAllCsvBtn.addEventListener('click', exportAllCSV);
    el.backupJsonBtn.addEventListener('click', exportJSONBackup);
    el.importJsonFile.addEventListener('change', handleImportJSON);

    // Manage Data Modal
    el.dataOptionsBtn.addEventListener('click', () => openModalWithAnimation(el.dataModal));
    el.dataModalClose.addEventListener('click', () => closeModalWithAnimation(el.dataModal));
    el.dataModalDone.addEventListener('click', () => closeModalWithAnimation(el.dataModal));

    // Sample data loader with custom confirm dialog
    const loadSampleHandler = async () => {
      const confirmed = await showConfirmModal({
        title: 'Load Demo Budget Data?',
        message: 'This will supplement your current month with realistic income, rent, dining, and utility records for a complete preview.',
        confirmText: 'Load Sample Data',
        isDanger: false
      });
      if (confirmed) {
        const sample = getSampleData(state.currentYearMonth);
        state.budgets[state.currentYearMonth] = sample.budgets[state.currentYearMonth];
        state.transactions = [...sample.transactions, ...state.transactions];
        saveToStorage();
        renderAll();
        showToast('Sample financial data loaded!', 'success');
        closeModalWithAnimation(el.dataModal);
      }
    };
    el.loadSampleDataBtn.addEventListener('click', loadSampleHandler);
    el.quickSampleDataBtn.addEventListener('click', loadSampleHandler);

    // Clear Month Data with custom confirm dialog
    el.quickClearMonthBtn.addEventListener('click', async () => {
      const confirmed = await showConfirmModal({
        title: 'Clear This Month\'s Records?',
        message: `Are you sure you want to delete all transactions recorded for ${formatMonthLabel(state.currentYearMonth)}? Other months will remain safe.`,
        confirmText: 'Clear Month Data',
        isDanger: true
      });
      if (confirmed) {
        state.transactions = state.transactions.filter(t => !t.date || !t.date.startsWith(state.currentYearMonth));
        saveToStorage();
        renderAll();
        showToast(`Cleared data for ${formatMonthLabel(state.currentYearMonth)}`, 'info');
      }
    });

    // Wipe All Data with custom confirm dialog
    el.wipeAllDataBtn.addEventListener('click', async () => {
      const confirmed = await showConfirmModal({
        title: '⚠️ Wipe ALL Financial Records?',
        message: 'This action is irreversible. All transactions across all months and all custom budget targets will be permanently deleted.',
        confirmText: 'Delete Everything',
        isDanger: true
      });
      if (confirmed) {
        state.transactions = [];
        state.budgets = {};
        saveToStorage();
        renderAll();
        showToast('All stored records cleared', 'error');
        closeModalWithAnimation(el.dataModal);
      }
    });

    // Confirm Modal Button Listeners
    if (el.confirmModalClose) el.confirmModalClose.addEventListener('click', () => closeConfirmModal(false));
    if (el.confirmModalCancel) el.confirmModalCancel.addEventListener('click', () => closeConfirmModal(false));
    if (el.confirmModalAction) el.confirmModalAction.addEventListener('click', () => closeConfirmModal(true));

    // Close modals on clicking backdrop
    window.addEventListener('click', (e) => {
      if (e.target === el.transactionModal) closeTransactionModal();
      if (e.target === el.budgetModal) closeBudgetModal();
      if (e.target === el.dataModal) closeModalWithAnimation(el.dataModal);
      if (e.target === el.confirmModal) closeConfirmModal(false);
    });

    // Escape key closes modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (el.confirmModal && !el.confirmModal.classList.contains('hidden')) {
          closeConfirmModal(false);
        } else {
          closeTransactionModal();
          closeBudgetModal();
          closeModalWithAnimation(el.dataModal);
        }
      }
    });
  }

  // --- User Profile & Session Controls ---
  function initUserProfile() {
    const session = getSession();
    if (!session) return;

    const name = session.name || (session.email ? session.email.split('@')[0] : 'User');
    const initials = name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0].toUpperCase())
      .slice(0, 2)
      .join('') || 'U';

    const userInitials = document.getElementById('user-initials');
    const userDropdownName = document.getElementById('user-dropdown-name');
    const userDropdownEmail = document.getElementById('user-dropdown-email');
    const userAvatarBtn = document.getElementById('user-avatar-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');

    if (userInitials) userInitials.textContent = initials;
    if (userDropdownName) userDropdownName.textContent = name;
    if (userDropdownEmail) userDropdownEmail.textContent = session.email || '';

    if (userAvatarBtn && userDropdown) {
      userAvatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
      });

      document.addEventListener('click', (e) => {
        if (!userDropdown.contains(e.target) && !userAvatarBtn.contains(e.target)) {
          userDropdown.classList.add('hidden');
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (userDropdown) userDropdown.classList.add('hidden');
        const confirmed = await showConfirmModal({
          title: 'Sign Out',
          message: 'Are you sure you want to sign out of your ApexBudget account?',
          confirmText: 'Sign Out',
          isDanger: false
        });
        if (confirmed) {
          logout();
        }
      });
    }
  }

  // --- Initialization ---
  function init() {
    loadFromStorage();
    applyTheme(state.theme);
    populateFilterCategoryDropdown();
    setupEventListeners();
    initUserProfile();
    renderAll();
  }

  // Launch when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
