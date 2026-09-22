/**
 * Somiti (অগ্রযাত্রা সমবায় সমিতি) - Core Application Logic
 * Full Real-Time Firebase Firestore Integration & Local Fallback
 */

// Bengali number formatting helper
function formatBengaliNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '০';
  const parsed = Number(num).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const bengaliDigits = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
    ',': ',', '.': '.'
  };
  return parsed.replace(/[0-9,\.]/g, match => bengaliDigits[match] || match);
}

// Convert English numbers to Bengali numerals string
function toBengaliDigits(str) {
  if (!str) return '';
  const bengaliDigits = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return String(str).replace(/[0-9]/g, match => bengaliDigits[match] || match);
}

// Toast notification helper
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'check-circle';
  if (type === 'error') icon = 'alert-circle';
  if (type === 'info') icon = 'info';

  toast.innerHTML = `
    <i data-lucide="${icon}" class="w-5 h-5 flex-shrink-0"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Local storage cache keys
const CACHE_KEYS = {
  members: 'somiti_cache_members',
  investments: 'somiti_cache_investments',
  profits: 'somiti_cache_profits',
  expenses: 'somiti_cache_expenses',
  otherIncome: 'somiti_cache_otherIncome',
  collections: 'somiti_cache_collections'
};

function getLocalCache(key, fallback = []) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setLocalCache(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

// Application State
const AppState = {
  currentUser: null,
  isCloudConnected: false,
  members: getLocalCache(CACHE_KEYS.members, []),
  investments: getLocalCache(CACHE_KEYS.investments, []),
  profits: getLocalCache(CACHE_KEYS.profits, []),
  expenses: getLocalCache(CACHE_KEYS.expenses, []),
  otherIncome: getLocalCache(CACHE_KEYS.otherIncome, []),
  collections: getLocalCache(CACHE_KEYS.collections, [])
};

// Calculation helper
function calculateTotals() {
  const totalSavings = AppState.members.reduce((sum, m) => sum + (Number(m.savings) || 0), 0);
  const totalFines = AppState.members.reduce((sum, m) => sum + (Number(m.fine) || 0), 0);
  const totalFees = AppState.members.reduce((sum, m) => sum + (Number(m.fee) || 0), 0);
  const totalShares = AppState.members.reduce((sum, m) => sum + (Number(m.shares) || 0), 0);

  const totalInvestment = AppState.investments.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const recoveredInvestment = AppState.investments.reduce((sum, inv) => sum + (Number(inv.recovered) || 0), 0);
  const pendingInvestment = totalInvestment - recoveredInvestment;

  const totalProfit = AppState.profits.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalExpenses = AppState.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalOtherIncome = AppState.otherIncome.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

  // Cash in hand = Total savings collected + fees + fines + profits collected + other income + recovered investments - total investments made - total expenses
  const cashInHand = (totalSavings + totalFines + totalFees + totalProfit + totalOtherIncome + recoveredInvestment) - (totalInvestment + totalExpenses);
  const profitPerShare = totalShares > 0 ? (totalProfit / totalShares) : 0;

  return {
    totalSavings,
    totalFines,
    totalFees,
    totalShares,
    totalInvestment,
    recoveredInvestment,
    pendingInvestment,
    totalProfit,
    totalExpenses,
    totalOtherIncome,
    cashInHand,
    profitPerShare
  };
}

// Tab Switching
function switchTab(tabId) {
  const tabs = ['dashboard', 'members', 'collections', 'investments', 'expenses', 'reports'];
  const titles = {
    'dashboard': 'ড্যাশবোর্ড ওভারভিউ',
    'members': 'সদস্য ব্যবস্থাপনা ও লেজার',
    'collections': 'সঞ্চয় ও কিস্তি আদায়',
    'investments': 'বিনিয়োগ ও লভ্যাংশ হিসাব',
    'expenses': 'আয় ও ব্যয় হিসাব',
    'reports': 'পূর্ণাঙ্গ অডিট ও ব্যালেন্স রিপোর্ট'
  };

  tabs.forEach(tab => {
    const viewEl = document.getElementById('view-' + tab);
    const navEl = document.getElementById('nav-' + tab);
    const mNavEl = document.getElementById('mobile-nav-' + tab);
    if (viewEl) viewEl.classList.add('hidden');
    if (navEl) {
      navEl.classList.remove('bg-emerald-600', 'text-white', 'shadow-md');
      navEl.classList.add('text-slate-300');
    }
    if (mNavEl) {
      mNavEl.classList.remove('bg-emerald-600', 'text-white');
      mNavEl.classList.add('text-slate-300');
    }
  });

  const activeView = document.getElementById('view-' + tabId);
  const activeNav = document.getElementById('nav-' + tabId);
  const activeMNav = document.getElementById('mobile-nav-' + tabId);

  if (activeView) activeView.classList.remove('hidden');
  if (activeNav) {
    activeNav.classList.add('bg-emerald-600', 'text-white', 'shadow-md');
    activeNav.classList.remove('text-slate-300');
  }
  if (activeMNav) {
    activeMNav.classList.add('bg-emerald-600', 'text-white');
    activeMNav.classList.remove('text-slate-300');
  }

  const pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.innerText = titles[tabId] || 'অগ্রযাত্রা সমবায় সমিতি';

  // Close mobile drawer on item click
  closeMobileMenu();

  if (window.lucide) lucide.createIcons();
}

// Render Dashboard
function renderDashboard() {
  const stats = calculateTotals();

  const elSavings = document.getElementById('stat-total-savings');
  if (elSavings) elSavings.innerText = '৳' + formatBengaliNumber(stats.totalSavings);

  const elShares = document.getElementById('stat-total-shares');
  if (elShares) elShares.innerText = formatBengaliNumber(stats.totalShares) + ' টি মোট শেয়ার';

  const elInv = document.getElementById('stat-total-investment');
  if (elInv) elInv.innerText = '৳' + formatBengaliNumber(stats.pendingInvestment);

  const elProfit = document.getElementById('stat-total-profit');
  if (elProfit) elProfit.innerText = '৳' + formatBengaliNumber(stats.totalProfit);

  const elCash = document.getElementById('stat-cash-in-hand');
  if (elCash) elCash.innerText = '৳' + formatBengaliNumber(stats.cashInHand);

  const elMemberCount = document.getElementById('stat-member-count');
  if (elMemberCount) elMemberCount.innerText = formatBengaliNumber(AppState.members.length) + ' জন';

  const elFees = document.getElementById('stat-fees-collected');
  if (elFees) elFees.innerText = '৳' + formatBengaliNumber(stats.totalFines + stats.totalFees);

  const elExp = document.getElementById('stat-total-expense');
  if (elExp) elExp.innerText = '৳' + formatBengaliNumber(stats.totalExpenses);

  const elProfitShare = document.getElementById('stat-profit-per-share');
  if (elProfitShare) elProfitShare.innerText = '৳' + formatBengaliNumber(stats.profitPerShare.toFixed(2));

  // Dividend Display
  const elCalcShare = document.getElementById('calc-profit-per-share-display');
  if (elCalcShare) elCalcShare.innerText = '৳' + formatBengaliNumber(stats.profitPerShare.toFixed(2));

  const elCalcSharesNote = document.getElementById('calc-total-shares-note');
  if (elCalcSharesNote) elCalcSharesNote.innerText = 'মোট শেয়ার: ' + formatBengaliNumber(stats.totalShares) + ' টি';

  // Dashboard preview of top 5 members
  const previewEl = document.getElementById('dashboard-members-preview');
  if (previewEl) {
    previewEl.innerHTML = '';
    if (AppState.members.length === 0) {
      previewEl.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400 text-xs">কোন সদস্য পাওয়া যায়নি। ক্লাউড সিঙ্ক করুন।</td></tr>`;
    } else {
      AppState.members.slice(0, 5).forEach(m => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
        tr.innerHTML = `
          <td class="py-2.5 px-3 text-xs font-semibold text-slate-500">${m.id || '–'}</td>
          <td class="py-2.5 px-3 font-semibold text-slate-800">${m.name}</td>
          <td class="py-2.5 px-3 text-center">
            <span class="px-2 py-0.5 bg-slate-100 font-bold rounded text-xs text-slate-700">${formatBengaliNumber(m.shares)}</span>
          </td>
          <td class="py-2.5 px-3 text-right font-bold text-slate-900">৳${formatBengaliNumber(m.savings)}</td>
          <td class="py-2.5 px-3 text-center">
            <button onclick="viewMemberLedger('${m._docId || m.id}')" class="text-xs text-emerald-600 hover:text-emerald-800 font-semibold underline">লেজার</button>
          </td>
        `;
        previewEl.appendChild(tr);
      });
    }
  }
}

// Render Members Table
function renderMembersTable() {
  const tbody = document.getElementById('members-table-body');
  if (!tbody) return;
  const searchInput = document.getElementById('memberSearchInput');
  const search = (searchInput ? searchInput.value : '').trim().toLowerCase();
  tbody.innerHTML = '';

  const filtered = AppState.members.filter(m => 
    (m.name && m.name.toLowerCase().includes(search)) || 
    (m.id && m.id.toLowerCase().includes(search)) || 
    (m.phone && m.phone.includes(search))
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-slate-400 text-sm">কোন সদস্য পাওয়া যায়নি</td></tr>`;
    return;
  }

  filtered.forEach(m => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/80 transition border-b border-slate-100';
    tr.innerHTML = `
      <td class="py-3 px-3 text-xs font-semibold text-slate-500">${m.id || '–'}</td>
      <td class="py-3 px-3">
        <div class="font-bold text-slate-800">${m.name}</div>
      </td>
      <td class="py-3 px-3 text-slate-500 text-xs">${m.phone || '–'}</td>
      <td class="py-3 px-3 text-center">
        <span class="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full">
          ${formatBengaliNumber(m.shares)} টি
        </span>
      </td>
      <td class="py-3 px-3 text-right font-bold text-slate-900">৳${formatBengaliNumber(m.savings)}</td>
      <td class="py-3 px-3 text-right text-rose-600 font-medium">৳${formatBengaliNumber(m.fine || 0)}</td>
      <td class="py-3 px-3 text-right text-slate-600">৳${formatBengaliNumber(m.fee || 0)}</td>
      <td class="py-3 px-3 text-center text-xs font-medium text-slate-600">${formatBengaliNumber(m.installments || 0)} টি</td>
      <td class="py-3 px-3 text-center space-x-1 whitespace-nowrap">
        <button onclick="viewMemberLedger('${m._docId || m.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition">
          লেজার
        </button>
        <button onclick="quickCollect('${m._docId || m.id}')" class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-semibold transition">
          জমা নিন
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Update Member Select dropdown in collection form
  const select = document.getElementById('collect-member-select');
  if (select) {
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- সদস্য নির্বাচন করুন --</option>';
    AppState.members.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m._docId || m.id;
      opt.innerText = `${m.id || ''}: ${m.name} (${formatBengaliNumber(m.shares)} শেয়ার)`;
      select.appendChild(opt);
    });
    select.value = currentVal;
  }
}

// Render Collections History Table
function renderCollections() {
  const tbody = document.getElementById('collection-history-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  const badge = document.getElementById('collection-count-badge');
  if (badge) badge.innerText = formatBengaliNumber(AppState.collections.length) + ' টি এন্ট্রি';

  if (AppState.collections.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-400 text-sm">কোন কিস্তি জমা রেকর্ড নেই</td></tr>`;
    return;
  }

  // Show latest first
  AppState.collections.slice().reverse().forEach(c => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
    tr.innerHTML = `
      <td class="py-2.5 px-3 text-xs font-bold text-slate-600">${c.receiptId || c.id || '–'}</td>
      <td class="py-2.5 px-3 text-xs text-slate-500">${c.date || '–'}</td>
      <td class="py-2.5 px-3 font-semibold text-slate-800">${c.memberName || '–'}</td>
      <td class="py-2.5 px-3 text-right font-medium text-emerald-700">৳${formatBengaliNumber(c.savings)}</td>
      <td class="py-2.5 px-3 text-right text-xs text-slate-500">৳${formatBengaliNumber((Number(c.fine) || 0) + (Number(c.fee) || 0))}</td>
      <td class="py-2.5 px-3 text-right font-bold text-slate-900">৳${formatBengaliNumber(c.total)}</td>
      <td class="py-2.5 px-3 text-center">
        <button onclick="showReceiptModal('${c.receiptId || c.id || c._docId}')" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded font-medium transition">
          রশিদ
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Investments & Profits
function renderInvestments() {
  const tbody = document.getElementById('investments-table-body');
  if (tbody) {
    tbody.innerHTML = '';
    if (AppState.investments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-400 text-xs">কোন বিনিয়োগ রেকর্ড নেই</td></tr>`;
    } else {
      AppState.investments.forEach(inv => {
        const pending = (Number(inv.amount) || 0) - (Number(inv.recovered) || 0);
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
        tr.innerHTML = `
          <td class="py-2.5 px-3 font-semibold text-slate-800">${inv.title}</td>
          <td class="py-2.5 px-3 text-right font-medium text-slate-700">৳${formatBengaliNumber(inv.amount)}</td>
          <td class="py-2.5 px-3 text-right text-emerald-600 font-medium">৳${formatBengaliNumber(inv.recovered)}</td>
          <td class="py-2.5 px-3 text-right font-bold text-amber-700">৳${formatBengaliNumber(pending)}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  const ptbody = document.getElementById('profits-table-body');
  if (ptbody) {
    ptbody.innerHTML = '';
    if (AppState.profits.length === 0) {
      ptbody.innerHTML = `<tr><td colspan="3" class="py-6 text-center text-slate-400 text-xs">কোন লাভ বা আয় রেকর্ড নেই</td></tr>`;
    } else {
      AppState.profits.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
        tr.innerHTML = `
          <td class="py-2.5 px-3 text-xs text-slate-500">${p.date || '–'}</td>
          <td class="py-2.5 px-3 font-medium text-slate-800">${p.title}</td>
          <td class="py-2.5 px-3 text-right font-bold text-blue-700">৳${formatBengaliNumber(p.amount)}</td>
        `;
        ptbody.appendChild(tr);
      });
    }
  }
}

// Render Expenses & Other Income
function renderExpensesAndIncome() {
  const expBody = document.getElementById('expenses-table-body');
  if (expBody) {
    expBody.innerHTML = '';
    if (AppState.expenses.length === 0) {
      expBody.innerHTML = `<tr><td colspan="3" class="py-6 text-center text-slate-400 text-xs">কোন খরচ রেকর্ড নেই</td></tr>`;
    } else {
      AppState.expenses.forEach(e => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
        tr.innerHTML = `
          <td class="py-2.5 px-3 text-xs text-slate-500">${e.date || '–'}</td>
          <td class="py-2.5 px-3 font-medium text-slate-800">${e.title}</td>
          <td class="py-2.5 px-3 text-right font-bold text-rose-600">৳${formatBengaliNumber(e.amount)}</td>
        `;
        expBody.appendChild(tr);
      });
    }
  }

  const incBody = document.getElementById('other-income-table-body');
  if (incBody) {
    incBody.innerHTML = '';
    if (AppState.otherIncome.length === 0) {
      incBody.innerHTML = `<tr><td colspan="3" class="py-6 text-center text-slate-400 text-xs">কোন বিবিধ আয় রেকর্ড নেই</td></tr>`;
    } else {
      AppState.otherIncome.forEach(inc => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
        tr.innerHTML = `
          <td class="py-2.5 px-3 text-xs text-slate-500">${inc.date || '–'}</td>
          <td class="py-2.5 px-3 font-medium text-slate-800">${inc.title}</td>
          <td class="py-2.5 px-3 text-right font-bold text-emerald-600">৳${formatBengaliNumber(inc.amount)}</td>
        `;
        incBody.appendChild(tr);
      });
    }
  }
}

// Render Printable Audit Statement & Reports
function renderReports() {
  const stats = calculateTotals();
  const totalInflow = stats.totalSavings + stats.totalFines + stats.totalFees + stats.totalProfit + stats.totalOtherIncome;
  const totalAllocated = stats.pendingInvestment + stats.totalExpenses + stats.cashInHand;

  const setEl = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };

  setEl('rep-savings', '৳' + formatBengaliNumber(stats.totalSavings));
  setEl('rep-fines', '৳' + formatBengaliNumber(stats.totalFines + stats.totalFees));
  setEl('rep-profit', '৳' + formatBengaliNumber(stats.totalProfit));
  setEl('rep-income', '৳' + formatBengaliNumber(stats.totalOtherIncome));
  setEl('rep-total-inflow', '৳' + formatBengaliNumber(totalInflow));

  setEl('rep-investment', '৳' + formatBengaliNumber(stats.pendingInvestment));
  setEl('rep-expenses', '৳' + formatBengaliNumber(stats.totalExpenses));
  setEl('rep-cash', '৳' + formatBengaliNumber(stats.cashInHand));
  setEl('rep-balance-check', '৳' + formatBengaliNumber(totalAllocated));

  // Member Dividend Statement Table
  const mDivBody = document.getElementById('report-members-dividend');
  if (mDivBody) {
    mDivBody.innerHTML = '';
    AppState.members.forEach(m => {
      const memberProfit = (Number(m.shares) || 1) * stats.profitPerShare;
      const totalWorth = (Number(m.savings) || 0) + memberProfit;

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
      tr.innerHTML = `
        <td class="py-2.5 px-3 font-semibold text-slate-800">${m.name} <span class="text-xs text-slate-400">(${m.id || ''})</span></td>
        <td class="py-2.5 px-3 text-center font-bold text-slate-700">${formatBengaliNumber(m.shares)}</td>
        <td class="py-2.5 px-3 text-right font-medium text-slate-700">৳${formatBengaliNumber(m.savings)}</td>
        <td class="py-2.5 px-3 text-right font-semibold text-emerald-600">৳${formatBengaliNumber(memberProfit.toFixed(2))}</td>
        <td class="py-2.5 px-3 text-right font-bold text-slate-900">৳${formatBengaliNumber(totalWorth.toFixed(2))}</td>
      `;
      mDivBody.appendChild(tr);
    });
  }
}

// Render All Components
function renderAll() {
  renderDashboard();
  renderMembersTable();
  renderCollections();
  renderInvestments();
  renderExpensesAndIncome();
  renderReports();
  if (window.lucide) lucide.createIcons();
}

// Modal Management
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// Mobile Drawer
function toggleMobileMenu() {
  const sidebar = document.getElementById('main-sidebar');
  if (sidebar) {
    sidebar.classList.toggle('hidden');
  }
}

function closeMobileMenu() {
  const sidebar = document.getElementById('main-sidebar');
  if (sidebar && window.innerWidth < 768) {
    sidebar.classList.add('hidden');
  }
}

// Quick Collect from Member Row
function quickCollect(memberIdentifier) {
  switchTab('collections');
  const select = document.getElementById('collect-member-select');
  if (select) {
    select.value = memberIdentifier;
    onMemberSelectChange();
  }
}

function onMemberSelectChange() {
  const select = document.getElementById('collect-member-select');
  if (!select) return;
  const memberId = select.value;
  const member = AppState.members.find(m => (m._docId === memberId || m.id === memberId));
  if (member) {
    // Preset 1000 per share
    const suggested = (Number(member.shares) || 1) * 1000;
    const amountInput = document.getElementById('collect-amount');
    if (amountInput) amountInput.value = suggested;
  }
}

// Handle Save Collection (Installment)
async function handleSaveCollection(e) {
  e.preventDefault();
  const select = document.getElementById('collect-member-select');
  const memberId = select.value;
  const date = document.getElementById('collect-date').value;
  const savings = Number(document.getElementById('collect-amount').value) || 0;
  const fine = Number(document.getElementById('collect-fine').value) || 0;
  const fee = Number(document.getElementById('collect-fee').value) || 0;
  const remarks = document.getElementById('collect-remarks').value || 'নিয়মিত কিস্তি জমা';

  if (!memberId || !date || savings <= 0) {
    showToast('দয়া করে সদস্য এবং সঠিক জমার পরিমাণ নির্বাচন করুন', 'error');
    return;
  }

  const member = AppState.members.find(m => (m._docId === memberId || m.id === memberId));
  if (!member) {
    showToast('সদস্য খুঁজে পাওয়া যায়নি', 'error');
    return;
  }

  const total = savings + fine + fee;
  const receiptId = 'REC-' + (AppState.collections.length + 101);

  const newCollection = {
    receiptId,
    id: receiptId,
    date,
    memberId: member.id || memberId,
    memberDocId: member._docId || null,
    memberName: member.name,
    savings,
    fine,
    fee,
    total,
    remarks
  };

  try {
    // 1. If Firebase is active, write to Cloud Firestore
    if (window.FirebaseService) {
      await window.FirebaseService.addDoc('collections', newCollection);

      // Update Member Balance in Firestore
      const newMemberSavings = (Number(member.savings) || 0) + savings;
      const newMemberFine = (Number(member.fine) || 0) + fine;
      const newMemberFee = (Number(member.fee) || 0) + fee;
      const newMemberInstallments = (Number(member.installments) || 0) + 1;

      if (member._docId) {
        await window.FirebaseService.updateDoc('members', member._docId, {
          savings: newMemberSavings,
          fine: newMemberFine,
          fee: newMemberFee,
          installments: newMemberInstallments
        });
      }
    } else {
      // Local fallback
      AppState.collections.push(newCollection);
      member.savings = (Number(member.savings) || 0) + savings;
      member.fine = (Number(member.fine) || 0) + fine;
      member.fee = (Number(member.fee) || 0) + fee;
      member.installments = (Number(member.installments) || 0) + 1;
      setLocalCache(CACHE_KEYS.collections, AppState.collections);
      setLocalCache(CACHE_KEYS.members, AppState.members);
      renderAll();
    }

    showToast(`কিস্তি সফলভাবে জমা হয়েছে! রশিদ নং: ${receiptId}`);

    // Reset Form
    document.getElementById('collectionForm').reset();
    document.getElementById('collect-date').valueAsDate = new Date();

    // Show Printable Receipt
    showReceiptModal(receiptId, newCollection);
  } catch (err) {
    console.error('Error saving collection:', err);
    showToast('কিস্তি সংরক্ষণে সমস্যা হয়েছে: ' + err.message, 'error');
  }
}

// Show Receipt Modal
function showReceiptModal(receiptId, directData = null) {
  const c = directData || AppState.collections.find(item => (item.receiptId === receiptId || item.id === receiptId || item._docId === receiptId));
  if (!c) return;

  const member = AppState.members.find(m => (m.id === c.memberId || m._docId === c.memberDocId || m.name === c.memberName)) || {};

  const setEl = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };

  setEl('rec-id', c.receiptId || c.id);
  setEl('rec-date', c.date);
  setEl('rec-member-name', c.memberName);
  setEl('rec-member-shares', `${c.memberId || ''} (${formatBengaliNumber(member.shares || 1)} টি শেয়ার)`);
  setEl('rec-savings', '৳' + formatBengaliNumber(c.savings));
  setEl('rec-fine', '৳' + formatBengaliNumber(c.fine || 0));
  setEl('rec-fee', '৳' + formatBengaliNumber(c.fee || 0));
  setEl('rec-total', '৳' + formatBengaliNumber(c.total));

  openModal('receiptModal');
}

// View Member Ledger
function viewMemberLedger(memberIdentifier) {
  const member = AppState.members.find(m => (m._docId === memberIdentifier || m.id === memberIdentifier));
  if (!member) return;

  const stats = calculateTotals();
  const memberProfit = (Number(member.shares) || 1) * stats.profitPerShare;

  const setEl = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };

  setEl('ledger-member-name', `${member.name} - এর খতিয়ান`);
  setEl('ledger-member-info', `আইডি: ${member.id || '–'} | শেয়ার: ${formatBengaliNumber(member.shares)} টি | মোবাইল: ${member.phone || '–'}`);
  setEl('ledger-total-savings', '৳' + formatBengaliNumber(member.savings));
  setEl('ledger-installments', formatBengaliNumber(member.installments || 0) + ' টি');
  setEl('ledger-dividend', '৳' + formatBengaliNumber(memberProfit.toFixed(2)));

  // Filter transactions
  const memberTx = AppState.collections.filter(c => (c.memberId === member.id || c.memberDocId === member._docId || c.memberName === member.name));
  const tbody = document.getElementById('ledger-history-body');
  if (tbody) {
    tbody.innerHTML = '';
    if (memberTx.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400 text-xs">কোন সাম্প্রতিক কিস্তি জমা রেকর্ড নেই (প্রাথমিক ব্যালেন্স সংরক্ষিত)</td></tr>`;
    } else {
      memberTx.forEach(tx => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
        tr.innerHTML = `
          <td class="py-2 px-3 text-xs text-slate-500">${tx.date}</td>
          <td class="py-2 px-3 text-slate-700">${tx.remarks || 'কিস্তি জমা'}</td>
          <td class="py-2 px-3 text-right font-medium text-emerald-700">৳${formatBengaliNumber(tx.savings)}</td>
          <td class="py-2 px-3 text-right text-xs text-slate-500">৳${formatBengaliNumber((Number(tx.fine) || 0) + (Number(tx.fee) || 0))}</td>
          <td class="py-2 px-3 text-right font-bold text-slate-800">৳${formatBengaliNumber(tx.total)}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  openModal('memberLedgerModal');
}

// Add New Member
async function handleSaveMember(e) {
  e.preventDefault();
  const name = document.getElementById('m-name').value.trim();
  const phone = document.getElementById('m-phone').value.trim();
  const shares = Number(document.getElementById('m-shares').value) || 1;
  const savings = Number(document.getElementById('m-savings').value) || 0;

  if (!name) {
    showToast('সদস্যের নাম আবশ্যক', 'error');
    return;
  }

  const newId = 'M-' + String(AppState.members.length + 1).padStart(2, '0');
  const newMember = {
    id: newId,
    name,
    phone,
    shares,
    savings,
    fine: 0,
    fee: 0,
    installments: savings > 0 ? 1 : 0
  };

  try {
    if (window.FirebaseService) {
      await window.FirebaseService.addDoc('members', newMember);
    } else {
      AppState.members.push(newMember);
      setLocalCache(CACHE_KEYS.members, AppState.members);
      renderAll();
    }
    showToast(`নতুন সদস্য "${name}" সফলভাবে যুক্ত হয়েছে!`);
    closeModal('memberModal');
    document.getElementById('memberForm').reset();
  } catch (err) {
    console.error('Error adding member:', err);
    showToast('সদস্য যোগ করতে ব্যর্থ: ' + err.message, 'error');
  }
}

// Add Investment
async function handleSaveInvestment(e) {
  e.preventDefault();
  const title = document.getElementById('inv-title').value.trim();
  const amount = Number(document.getElementById('inv-amount').value) || 0;
  const recovered = Number(document.getElementById('inv-recovered').value) || 0;

  if (!title || amount <= 0) {
    showToast('সঠিক শিরোনাম এবং পরিমাণ প্রদান করুন', 'error');
    return;
  }

  const newInv = {
    title,
    amount,
    recovered
  };

  try {
    if (window.FirebaseService) {
      await window.FirebaseService.addDoc('investments', newInv);
    } else {
      AppState.investments.push(newInv);
      setLocalCache(CACHE_KEYS.investments, AppState.investments);
      renderAll();
    }
    showToast('নতুন বিনিয়োগ সফলভাবে সংরক্ষিত হয়েছে!');
    closeModal('investmentModal');
    document.getElementById('investmentForm').reset();
  } catch (err) {
    showToast('বিনিয়োগ সংরক্ষণে সমস্যা হয়েছে: ' + err.message, 'error');
  }
}

// Add Profit
async function handleSaveProfit(e) {
  e.preventDefault();
  const date = document.getElementById('prf-date').value;
  const title = document.getElementById('prf-title').value.trim();
  const amount = Number(document.getElementById('prf-amount').value) || 0;

  if (!title || amount <= 0) {
    showToast('লাভের বিবরণ ও পরিমাণ দিন', 'error');
    return;
  }

  const newProfit = { date, title, amount };

  try {
    if (window.FirebaseService) {
      await window.FirebaseService.addDoc('profits', newProfit);
    } else {
      AppState.profits.push(newProfit);
      setLocalCache(CACHE_KEYS.profits, AppState.profits);
      renderAll();
    }
    showToast('লাভের এন্ট্রি সংরক্ষিত হয়েছে!');
    closeModal('profitModal');
    document.getElementById('profitForm').reset();
  } catch (err) {
    showToast('সংরক্ষণে সমস্যা: ' + err.message, 'error');
  }
}

// Add Expense
async function handleSaveExpense(e) {
  e.preventDefault();
  const date = document.getElementById('exp-date').value;
  const title = document.getElementById('exp-title').value.trim();
  const amount = Number(document.getElementById('exp-amount').value) || 0;

  if (!title || amount <= 0) {
    showToast('খরচের বিবরণ ও পরিমাণ দিন', 'error');
    return;
  }

  const newExp = { date, title, amount };

  try {
    if (window.FirebaseService) {
      await window.FirebaseService.addDoc('expenses', newExp);
    } else {
      AppState.expenses.push(newExp);
      setLocalCache(CACHE_KEYS.expenses, AppState.expenses);
      renderAll();
    }
    showToast('খরচ এন্ট্রি সফল হয়েছে!');
    closeModal('expenseModal');
    document.getElementById('expenseForm').reset();
  } catch (err) {
    showToast('খরচ সংরক্ষণে সমস্যা: ' + err.message, 'error');
  }
}

// Add Other Income
async function handleSaveIncome(e) {
  e.preventDefault();
  const date = document.getElementById('inc-date').value;
  const title = document.getElementById('inc-title').value.trim();
  const amount = Number(document.getElementById('inc-amount').value) || 0;

  if (!title || amount <= 0) {
    showToast('আয়ের বিবরণ ও পরিমাণ দিন', 'error');
    return;
  }

  const newInc = { date, title, amount };

  try {
    if (window.FirebaseService) {
      await window.FirebaseService.addDoc('other_income', newInc);
    } else {
      AppState.otherIncome.push(newInc);
      setLocalCache(CACHE_KEYS.otherIncome, AppState.otherIncome);
      renderAll();
    }
    showToast('বিবিধ আয় সংরক্ষিত হয়েছে!');
    closeModal('incomeModal');
    document.getElementById('incomeForm').reset();
  } catch (err) {
    showToast('আয় সংরক্ষণে সমস্যা: ' + err.message, 'error');
  }
}

// Export All Data JSON Backup
function exportDataJSON() {
  const data = {
    appName: 'Somiti Management System',
    exportedAt: new Date().toISOString(),
    members: AppState.members,
    investments: AppState.investments,
    profits: AppState.profits,
    expenses: AppState.expenses,
    otherIncome: AppState.otherIncome,
    collections: AppState.collections
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Somiti_Cloud_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে');
}

// Seed Cloud Database Helper
async function triggerCloudSeed() {
  if (!confirm('আপনি কি ক্লাউড ফায়ারবেস ডাটাবেসে প্রাথমিক সমিতির ডাটা যুক্ত করতে চান?')) return;
  try {
    showToast('ক্লাউড ডাটাবেস ইনিশিয়ালাইজ করা হচ্ছে...', 'info');
    if (window.FirebaseService) {
      const results = await window.FirebaseService.seedCloudDatabase();
      showToast(`ক্লাউড ডাটা সফলভাবে যুক্ত হয়েছে! (${results.members} সদস্য)`, 'success');
    }
  } catch (err) {
    console.error('Seed error:', err);
    showToast('ডাটা ইনিশিয়ালাইজেশনে সমস্যা: ' + err.message, 'error');
  }
}

// Authentication Logic
async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error-msg');
  const btn = document.getElementById('login-submit-btn');

  if (!email || !password) {
    if (errorEl) errorEl.innerText = 'ইমেইল ও পাসওয়ার্ড পূরণ করুন';
    return;
  }

  try {
    btn.disabled = true;
    btn.innerText = 'লগইন হচ্ছে...';
    if (errorEl) errorEl.innerText = '';

    await window.FirebaseService.signIn(email, password);
    showToast('সফলভাবে লগইন হয়েছে!');
    closeModal('authModal');
    document.getElementById('loginForm').reset();
  } catch (err) {
    console.error('Login error:', err);
    if (errorEl) {
      errorEl.innerText = 'ভুল ইমেইল বা পাসওয়ার্ড: ' + err.message;
    }
  } finally {
    btn.disabled = false;
    btn.innerText = 'লগইন করুন';
  }
}

async function handleAdminLogout() {
  try {
    await window.FirebaseService.logout();
    showToast('লগআউট সফল হয়েছে', 'info');
  } catch (err) {
    console.error('Logout error:', err);
  }
}

// Update UI on Auth State Change
function updateAuthUI(user) {
  AppState.currentUser = user;
  const userStatusBadge = document.getElementById('user-status-badge');
  const userEmailDisplay = document.getElementById('user-email-display');
  const loginTriggerBtn = document.getElementById('login-trigger-btn');
  const logoutTriggerBtn = document.getElementById('logout-trigger-btn');

  if (user) {
    if (userStatusBadge) {
      userStatusBadge.classList.remove('hidden');
      userStatusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> অ্যাডমিন মোড`;
    }
    if (userEmailDisplay) userEmailDisplay.innerText = user.email || 'অ্যাডমিন';
    if (loginTriggerBtn) loginTriggerBtn.classList.add('hidden');
    if (logoutTriggerBtn) logoutTriggerBtn.classList.remove('hidden');
  } else {
    if (userStatusBadge) {
      userStatusBadge.classList.remove('hidden');
      userStatusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-400"></span> ভিউয়ার মোড`;
    }
    if (userEmailDisplay) userEmailDisplay.innerText = 'লগইন করা নেই';
    if (loginTriggerBtn) loginTriggerBtn.classList.remove('hidden');
    if (logoutTriggerBtn) logoutTriggerBtn.classList.add('hidden');
  }
}

// Setup Cloud Listeners
function initializeFirebaseListeners() {
  const cloudStatusEl = document.getElementById('cloud-status-indicator');
  const seedPromptEl = document.getElementById('cloud-seed-prompt');

  const updateCloudStatus = (connected) => {
    AppState.isCloudConnected = connected;
    if (cloudStatusEl) {
      if (connected) {
        cloudStatusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ক্লাউড সিঙ্ক সচল (Firestore Live)`;
      } else {
        cloudStatusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500"></span> অফলাইন (লোকাল ক্যাশ)`;
      }
    }
  };

  // Auth state listener
  window.FirebaseService.onAuthState((user) => {
    updateAuthUI(user);
  });

  // Listen to members
  window.FirebaseService.listenToCollection('members', (items) => {
    updateCloudStatus(true);
    // Sort by id or createdAt
    AppState.members = items.sort((a, b) => (a.id || '').localeCompare(b.id || ''));
    setLocalCache(CACHE_KEYS.members, AppState.members);
    
    // Check if cloud has 0 members, show seed banner
    if (AppState.members.length === 0 && seedPromptEl) {
      seedPromptEl.classList.remove('hidden');
    } else if (seedPromptEl) {
      seedPromptEl.classList.add('hidden');
    }

    renderAll();
  }, () => {
    updateCloudStatus(false);
  });

  // Listen to collections
  window.FirebaseService.listenToCollection('collections', (items) => {
    AppState.collections = items;
    setLocalCache(CACHE_KEYS.collections, items);
    renderCollections();
    renderDashboard();
    renderReports();
  });

  // Listen to investments
  window.FirebaseService.listenToCollection('investments', (items) => {
    AppState.investments = items;
    setLocalCache(CACHE_KEYS.investments, items);
    renderInvestments();
    renderDashboard();
    renderReports();
  });

  // Listen to profits
  window.FirebaseService.listenToCollection('profits', (items) => {
    AppState.profits = items;
    setLocalCache(CACHE_KEYS.profits, items);
    renderInvestments();
    renderDashboard();
    renderReports();
  });

  // Listen to expenses
  window.FirebaseService.listenToCollection('expenses', (items) => {
    AppState.expenses = items;
    setLocalCache(CACHE_KEYS.expenses, items);
    renderExpensesAndIncome();
    renderDashboard();
    renderReports();
  });

  // Listen to other_income
  window.FirebaseService.listenToCollection('other_income', (items) => {
    AppState.otherIncome = items;
    setLocalCache(CACHE_KEYS.otherIncome, items);
    renderExpensesAndIncome();
    renderDashboard();
    renderReports();
  });
}

// Window Load Init
window.addEventListener('DOMContentLoaded', () => {
  // Set default today's date for inputs
  const todayStr = new Date().toISOString().slice(0, 10);
  ['collect-date', 'prf-date', 'exp-date', 'inc-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = todayStr;
  });

  // Initial render from local cache
  switchTab('dashboard');
  renderAll();

  // If Firebase is already loaded or wait for ready event
  if (window.FirebaseService) {
    initializeFirebaseListeners();
  } else {
    window.addEventListener('firebase-ready', () => {
      initializeFirebaseListeners();
    });
  }
});

// Expose functions to window for inline onclick / onsubmit
window.switchTab = switchTab;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.renderMembersTable = renderMembersTable;
window.quickCollect = quickCollect;
window.onMemberSelectChange = onMemberSelectChange;
window.handleSaveCollection = handleSaveCollection;
window.showReceiptModal = showReceiptModal;
window.viewMemberLedger = viewMemberLedger;
window.handleSaveMember = handleSaveMember;
window.handleSaveInvestment = handleSaveInvestment;
window.handleSaveProfit = handleSaveProfit;
window.handleSaveExpense = handleSaveExpense;
window.handleSaveIncome = handleSaveIncome;
window.exportDataJSON = exportDataJSON;
window.triggerCloudSeed = triggerCloudSeed;
window.handleAdminLogin = handleAdminLogin;
window.handleAdminLogout = handleAdminLogout;
