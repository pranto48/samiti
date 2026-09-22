/**
 * Somiti (অগ্রযাত্রা সমবায় সমিতি) - High-Productivity Application Engine
 * Features:
 * - Real-time Firebase Firestore Sync with Local Fallback Cache
 * - Complete Backup & Restore Center (JSON Export/Import, Local Snapshots, CSV Excel Exports)
 * - Batch Installment Collection Matrix (এককালীন সকলের কিস্তি জমা)
 * - Digital Member Passbook & Membership ID Card
 * - Full CRUD Operations (Add, Edit, Delete with Confirmations)
 * - Animated Counters & Dynamic Chart.js Analytics
 * - Dual-role Auth: Admin + 1-Click Demo Director + Member Self-Service Lookup
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

// Animated Numeric Counter for WOW factor
function animateCounter(elementId, targetValue, prefix = '৳', suffix = '', duration = 500) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const start = 0;
  const target = Number(targetValue) || 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * easeOut;

    el.innerText = `${prefix}${formatBengaliNumber(Math.round(current))}${suffix}`;
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.innerText = `${prefix}${formatBengaliNumber(target)}${suffix}`;
    }
  }
  requestAnimationFrame(update);
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
  collections: 'somiti_cache_collections',
  authDemo: 'somiti_demo_admin_active',
  snapshots: 'somiti_local_snapshots'
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
  isDemoAdmin: localStorage.getItem(CACHE_KEYS.authDemo) === 'true',
  isCloudConnected: false,
  memberViewMode: 'table', // 'table' or 'cards'
  memberFilterShares: 'all', // 'all', '1', '2-3', '4+'
  memberSortBy: 'id', // 'id', 'name', 'shares', 'savings'
  deleteTarget: null, // { collectionName, identifier, title }
  charts: {
    allocation: null,
    trend: null
  },
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

// Tab Navigation
function switchTab(tabId) {
  const tabs = ['dashboard', 'members', 'collections', 'investments', 'expenses', 'reports', 'backup'];
  const titles = {
    'dashboard': 'ড্যাশবোর্ড ওভারভিউ',
    'members': 'সদস্য খতিয়ান ও তালিকা',
    'collections': 'সঞ্চয় ও কিস্তি আদায়',
    'investments': 'বিনিয়োগ ও লভ্যাংশ হিসাব',
    'expenses': 'আয় ও ব্যয় হিসাব',
    'reports': 'পূর্ণাঙ্গ অডিট ও ব্যালেন্স রিপোর্ট',
    'backup': 'ব্যাকআপ, রিস্টোর ও এক্সপোর্ট হাব'
  };

  tabs.forEach(tab => {
    const viewEl = document.getElementById('view-' + tab);
    const navEl = document.getElementById('nav-' + tab);
    if (viewEl) viewEl.classList.add('hidden');
    if (navEl) {
      navEl.classList.remove('bg-emerald-600', 'text-white', 'shadow-md');
      navEl.classList.add('text-slate-300');
    }
  });

  const activeView = document.getElementById('view-' + tabId);
  const activeNav = document.getElementById('nav-' + tabId);

  if (activeView) {
    activeView.classList.remove('hidden');
    activeView.classList.add('animate-fade-in');
  }
  if (activeNav) {
    activeNav.classList.add('bg-emerald-600', 'text-white', 'shadow-md');
    activeNav.classList.remove('text-slate-300');
  }

  const pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.innerText = titles[tabId] || 'অগ্রযাত্রা সমবায় সমিতি';

  closeMobileMenu();

  if (tabId === 'dashboard') {
    setTimeout(renderCharts, 80);
  } else if (tabId === 'backup') {
    renderSnapshotHistory();
  }

  if (window.lucide) lucide.createIcons();
}

// Dynamic Chart.js Analytics
function renderCharts() {
  if (typeof Chart === 'undefined') return;
  const stats = calculateTotals();

  // 1. Fund Allocation Doughnut
  const ctxAlloc = document.getElementById('fundAllocationChart');
  if (ctxAlloc) {
    if (AppState.charts.allocation) AppState.charts.allocation.destroy();
    AppState.charts.allocation = new Chart(ctxAlloc, {
      type: 'doughnut',
      data: {
        labels: ['বিনিয়োগ স্থিতি', 'সমিতির মোট ব্যয়', 'তহবিলে নগদ স্থিতি'],
        datasets: [{
          data: [
            Math.max(0, stats.pendingInvestment),
            Math.max(0, stats.totalExpenses),
            Math.max(0, stats.cashInHand)
          ],
          backgroundColor: ['#f59e0b', '#f43f5e', '#10b981'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: 'Hind Siliguri', size: 12 }, padding: 12 }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ৳${ctx.parsed.toLocaleString('en-US')}`
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  // 2. Collection Trends Bar Chart
  const ctxTrend = document.getElementById('collectionTrendChart');
  if (ctxTrend) {
    if (AppState.charts.trend) AppState.charts.trend.destroy();

    const dateMap = {};
    AppState.collections.forEach(c => {
      const d = (c.date || '').slice(0, 7) || 'পূর্বের';
      dateMap[d] = (dateMap[d] || 0) + (Number(c.savings) || 0);
    });

    const labels = Object.keys(dateMap).slice(-6);
    const dataVals = labels.map(k => dateMap[k]);

    AppState.charts.trend = new Chart(ctxTrend, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['রেকর্ড নেই'],
        datasets: [{
          label: 'মাসিক সঞ্চয় আদায়',
          data: dataVals.length > 0 ? dataVals : [0],
          backgroundColor: '#059669',
          borderRadius: 8,
          barThickness: 24
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (v) => '৳' + v.toLocaleString('en-US'),
              font: { family: 'Outfit', size: 10 }
            },
            grid: { color: '#f1f5f9' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Outfit', size: 11 } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` আদায়: ৳${ctx.parsed.y.toLocaleString('en-US')}`
            }
          }
        }
      }
    });
  }
}

// Render Dashboard View
function renderDashboard() {
  const stats = calculateTotals();

  animateCounter('stat-total-savings', stats.totalSavings, '৳');
  animateCounter('stat-total-investment', stats.pendingInvestment, '৳');
  animateCounter('stat-total-profit', stats.totalProfit, '৳');
  animateCounter('stat-cash-in-hand', stats.cashInHand, '৳');

  const setEl = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.innerText = txt;
  };

  setEl('stat-total-shares', formatBengaliNumber(stats.totalShares) + ' টি মোট শেয়ার');
  setEl('stat-member-count', formatBengaliNumber(AppState.members.length) + ' জন');
  setEl('stat-fees-collected', '৳' + formatBengaliNumber(stats.totalFines + stats.totalFees));
  setEl('stat-total-expense', '৳' + formatBengaliNumber(stats.totalExpenses));
  setEl('stat-profit-per-share', '৳' + formatBengaliNumber(stats.profitPerShare.toFixed(2)));

  setEl('calc-profit-per-share-display', '৳' + formatBengaliNumber(stats.profitPerShare.toFixed(2)));
  setEl('calc-total-shares-note', 'মোট শেয়ার: ' + formatBengaliNumber(stats.totalShares) + ' টি');

  // Preview table
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
          <td class="py-2.5 px-3 text-right font-bold text-slate-900 font-num">৳${formatBengaliNumber(m.savings)}</td>
          <td class="py-2.5 px-3 text-center">
            <button onclick="viewMemberLedger('${m._docId || m.id}')" class="text-xs text-emerald-600 hover:text-emerald-800 font-semibold underline">লেজার</button>
          </td>
        `;
        previewEl.appendChild(tr);
      });
    }
  }

  renderCharts();
}

// Member View Mode (Table vs Cards)
function setMemberViewMode(mode) {
  AppState.memberViewMode = mode;
  const btnTable = document.getElementById('btn-view-table');
  const btnCards = document.getElementById('btn-view-cards');
  const tableView = document.getElementById('members-table-container');
  const cardsView = document.getElementById('members-cards-container');

  if (mode === 'table') {
    if (btnTable) btnTable.className = 'px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1';
    if (btnCards) btnCards.className = 'px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1';
    if (tableView) tableView.classList.remove('hidden');
    if (cardsView) cardsView.classList.add('hidden');
  } else {
    if (btnTable) btnTable.className = 'px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1';
    if (btnCards) btnCards.className = 'px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1';
    if (tableView) tableView.classList.add('hidden');
    if (cardsView) cardsView.classList.remove('hidden');
  }
  renderMembersTable();
}

// Filter and Sort Member List
function getFilteredAndSortedMembers() {
  const searchInput = document.getElementById('memberSearchInput');
  const search = (searchInput ? searchInput.value : '').trim().toLowerCase();

  let list = AppState.members.filter(m => {
    const matchSearch = (m.name && m.name.toLowerCase().includes(search)) || 
      (m.id && m.id.toLowerCase().includes(search)) || 
      (m.phone && m.phone.includes(search));

    if (!matchSearch) return false;

    if (AppState.memberFilterShares === '1') return Number(m.shares) === 1;
    if (AppState.memberFilterShares === '2-3') return Number(m.shares) >= 2 && Number(m.shares) <= 3;
    if (AppState.memberFilterShares === '4+') return Number(m.shares) >= 4;

    return true;
  });

  list = list.slice().sort((a, b) => {
    if (AppState.memberSortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (AppState.memberSortBy === 'shares') return (Number(b.shares) || 0) - (Number(a.shares) || 0);
    if (AppState.memberSortBy === 'savings') return (Number(b.savings) || 0) - (Number(a.savings) || 0);
    return (a.id || '').localeCompare(b.id || '');
  });

  return list;
}

// Render Members View
function renderMembersTable() {
  const tbody = document.getElementById('members-table-body');
  const cardsContainer = document.getElementById('members-cards-container');
  const filtered = getFilteredAndSortedMembers();

  // 1. Table View
  if (tbody) {
    tbody.innerHTML = '';
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-slate-400 text-sm">কোন সদস্য পাওয়া যায়নি</td></tr>`;
    } else {
      filtered.forEach(m => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/80 transition border-b border-slate-100 text-xs md:text-sm';
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
          <td class="py-3 px-3 text-right font-bold text-slate-900 font-num">৳${formatBengaliNumber(m.savings)}</td>
          <td class="py-3 px-3 text-right text-rose-600 font-medium font-num">৳${formatBengaliNumber(m.fine || 0)}</td>
          <td class="py-3 px-3 text-right text-slate-600 font-num">৳${formatBengaliNumber(m.fee || 0)}</td>
          <td class="py-3 px-3 text-center text-xs font-medium text-slate-600">${formatBengaliNumber(m.installments || 0)} টি</td>
          <td class="py-3 px-3 text-center space-x-1 whitespace-nowrap">
            <button onclick="viewMemberLedger('${m._docId || m.id}')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition" title="লেজার">
              লেজার
            </button>
            <button onclick="quickCollect('${m._docId || m.id}')" class="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-semibold transition" title="কিস্তি জমা">
              জমা
            </button>
            <button onclick="openMemberIdCard('${m._docId || m.id}')" class="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-xs font-semibold transition" title="আইডি কার্ড">
              কার্ড
            </button>
            <button onclick="openEditMemberModal('${m._docId || m.id}')" class="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold transition" title="সংশোধন">
              এডিট
            </button>
            <button onclick="confirmDeleteRecord('members', '${m._docId || m.id}', '${m.name}')" class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-xs font-semibold transition" title="মুছুন">
              মুছুন
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  // 2. Card Grid View
  if (cardsContainer) {
    cardsContainer.innerHTML = '';
    if (filtered.length === 0) {
      cardsContainer.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-sm">কোন সদস্যের প্রোফাইল পাওয়া যায়নি</div>`;
    } else {
      filtered.forEach(m => {
        const initials = (m.name || 'স').slice(0, 2);
        const card = document.createElement('div');
        card.className = 'member-grid-card p-5 space-y-3';
        card.innerHTML = `
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                ${initials}
              </div>
              <div>
                <h4 class="font-bold text-slate-900 text-sm">${m.name}</h4>
                <p class="text-xs text-slate-500">${m.id} | ${m.phone || '–'}</p>
              </div>
            </div>
            <span class="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full">
              ${formatBengaliNumber(m.shares)} শেয়ার
            </span>
          </div>

          <div class="bg-slate-50 p-3 rounded-xl flex justify-between items-center text-xs">
            <div>
              <span class="text-slate-500 block">মোট সঞ্চয়</span>
              <span class="font-bold text-slate-900 text-base font-num">৳${formatBengaliNumber(m.savings)}</span>
            </div>
            <div class="text-right">
              <span class="text-slate-500 block">কিস্তি সংখ্যা</span>
              <span class="font-semibold text-slate-700">${formatBengaliNumber(m.installments || 0)} টি</span>
            </div>
          </div>

          <div class="flex gap-1.5 pt-1">
            <button onclick="viewMemberLedger('${m._docId || m.id}')" class="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition text-center">
              লেজার
            </button>
            <button onclick="quickCollect('${m._docId || m.id}')" class="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition text-center">
              জমা
            </button>
            <button onclick="openMemberIdCard('${m._docId || m.id}')" class="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold" title="ডিজিটাল কার্ড">
              কার্ড
            </button>
            <button onclick="openEditMemberModal('${m._docId || m.id}')" class="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold" title="এডিট">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        `;
        cardsContainer.appendChild(card);
      });
    }
  }

  // Update dropdown in single collection form
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
    tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-slate-400 text-sm">কোন কিস্তি জমা রেকর্ড নেই</td></tr>`;
    return;
  }

  AppState.collections.slice().reverse().forEach(c => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition border-b border-slate-100 text-xs md:text-sm';
    tr.innerHTML = `
      <td class="py-2.5 px-3 text-xs font-bold text-slate-600">${c.receiptId || c.id || '–'}</td>
      <td class="py-2.5 px-3 text-xs text-slate-500">${c.date || '–'}</td>
      <td class="py-2.5 px-3 font-semibold text-slate-800">${c.memberName || '–'}</td>
      <td class="py-2.5 px-3 text-right font-medium text-emerald-700 font-num">৳${formatBengaliNumber(c.savings)}</td>
      <td class="py-2.5 px-3 text-right text-xs text-slate-500 font-num">৳${formatBengaliNumber((Number(c.fine) || 0) + (Number(c.fee) || 0))}</td>
      <td class="py-2.5 px-3 text-right font-bold text-slate-900 font-num">৳${formatBengaliNumber(c.total)}</td>
      <td class="py-2.5 px-3 text-center space-x-1 whitespace-nowrap">
        <button onclick="showReceiptModal('${c.receiptId || c.id || c._docId}')" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded font-medium transition">
          রশিদ
        </button>
        <button onclick="confirmDeleteRecord('collections', '${c._docId || c.id || c.receiptId}', 'রশিদ ${c.receiptId || c.id}')" class="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 px-2 py-1 rounded font-medium transition" title="মুছুন">
          &times;
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
      tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400 text-xs">কোন বিনিয়োগ রেকর্ড নেই</td></tr>`;
    } else {
      AppState.investments.forEach(inv => {
        const pending = (Number(inv.amount) || 0) - (Number(inv.recovered) || 0);
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
        tr.innerHTML = `
          <td class="py-2.5 px-3 font-semibold text-slate-800">${inv.title}</td>
          <td class="py-2.5 px-3 text-right font-medium text-slate-700 font-num">৳${formatBengaliNumber(inv.amount)}</td>
          <td class="py-2.5 px-3 text-right text-emerald-600 font-medium font-num">৳${formatBengaliNumber(inv.recovered)}</td>
          <td class="py-2.5 px-3 text-right font-bold text-amber-700 font-num">৳${formatBengaliNumber(pending)}</td>
          <td class="py-2.5 px-3 text-center">
            <button onclick="confirmDeleteRecord('investments', '${inv._docId || inv.id}', '${inv.title}')" class="text-rose-600 hover:text-rose-800 text-xs font-bold">&times;</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  const ptbody = document.getElementById('profits-table-body');
  if (ptbody) {
    ptbody.innerHTML = '';
    if (AppState.profits.length === 0) {
      ptbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-400 text-xs">কোন লাভ বা আয় রেকর্ড নেই</td></tr>`;
    } else {
      AppState.profits.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
        tr.innerHTML = `
          <td class="py-2.5 px-3 text-xs text-slate-500">${p.date || '–'}</td>
          <td class="py-2.5 px-3 font-medium text-slate-800">${p.title}</td>
          <td class="py-2.5 px-3 text-right font-bold text-blue-700 font-num">৳${formatBengaliNumber(p.amount)}</td>
          <td class="py-2.5 px-3 text-center">
            <button onclick="confirmDeleteRecord('profits', '${p._docId || p.id}', '${p.title}')" class="text-rose-600 hover:text-rose-800 text-xs font-bold">&times;</button>
          </td>
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
      expBody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-400 text-xs">কোন খরচ রেকর্ড নেই</td></tr>`;
    } else {
      AppState.expenses.forEach(e => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
        tr.innerHTML = `
          <td class="py-2.5 px-3 text-xs text-slate-500">${e.date || '–'}</td>
          <td class="py-2.5 px-3 font-medium text-slate-800">${e.title}</td>
          <td class="py-2.5 px-3 text-right font-bold text-rose-600 font-num">৳${formatBengaliNumber(e.amount)}</td>
          <td class="py-2.5 px-3 text-center">
            <button onclick="confirmDeleteRecord('expenses', '${e._docId || e.id}', '${e.title}')" class="text-rose-600 hover:text-rose-800 text-xs font-bold">&times;</button>
          </td>
        `;
        expBody.appendChild(tr);
      });
    }
  }

  const incBody = document.getElementById('other-income-table-body');
  if (incBody) {
    incBody.innerHTML = '';
    if (AppState.otherIncome.length === 0) {
      incBody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-400 text-xs">কোন বিবিধ আয় রেকর্ড নেই</td></tr>`;
    } else {
      AppState.otherIncome.forEach(inc => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
        tr.innerHTML = `
          <td class="py-2.5 px-3 text-xs text-slate-500">${inc.date || '–'}</td>
          <td class="py-2.5 px-3 font-medium text-slate-800">${inc.title}</td>
          <td class="py-2.5 px-3 text-right font-bold text-emerald-600 font-num">৳${formatBengaliNumber(inc.amount)}</td>
          <td class="py-2.5 px-3 text-center">
            <button onclick="confirmDeleteRecord('other_income', '${inc._docId || inc.id}', '${inc.title}')" class="text-rose-600 hover:text-rose-800 text-xs font-bold">&times;</button>
          </td>
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
        <td class="py-2.5 px-3 text-right font-medium text-slate-700 font-num">৳${formatBengaliNumber(m.savings)}</td>
        <td class="py-2.5 px-3 text-right font-semibold text-emerald-600 font-num">৳${formatBengaliNumber(memberProfit.toFixed(2))}</td>
        <td class="py-2.5 px-3 text-right font-bold text-slate-900 font-num">৳${formatBengaliNumber(totalWorth.toFixed(2))}</td>
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
  if (el) {
    el.classList.remove('hidden');
    el.classList.add('animate-scale-in');
  }
  if (window.lucide) lucide.createIcons();
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// Mobile Drawer
function toggleMobileMenu() {
  const sidebar = document.getElementById('main-sidebar');
  if (sidebar) sidebar.classList.toggle('hidden');
}

function closeMobileMenu() {
  const sidebar = document.getElementById('main-sidebar');
  if (sidebar && window.innerWidth < 768) sidebar.classList.add('hidden');
}

// Quick Date buttons
function setQuickDate(inputId, target) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const now = new Date();
  if (target === 'today') {
    input.value = now.toISOString().slice(0, 10);
  } else if (target === 'yesterday') {
    now.setDate(now.getDate() - 1);
    input.value = now.toISOString().slice(0, 10);
  } else if (target === 'first_of_month') {
    input.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
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
    const suggested = (Number(member.shares) || 1) * 1000;
    const amountInput = document.getElementById('collect-amount');
    if (amountInput) amountInput.value = suggested;
  }
}

// Handle Save Single Collection
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
    showToast('সদস্য এবং সঠিক জমার পরিমাণ নির্বাচন করুন', 'error');
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
    if (window.FirebaseService) {
      await window.FirebaseService.addDoc('collections', newCollection);

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

    document.getElementById('collectionForm').reset();
    document.getElementById('collect-date').valueAsDate = new Date();

    showReceiptModal(receiptId, newCollection);
  } catch (err) {
    console.error('Error saving collection:', err);
    showToast('কিস্তি সংরক্ষণে সমস্যা: ' + err.message, 'error');
  }
}

// BATCH COLLECTION MATRIX (এককালীন সকলের মাসিক কিস্তি জমা)
function openBatchCollectionModal() {
  const container = document.getElementById('batch-members-list');
  if (!container) return;
  container.innerHTML = '';

  const todayStr = new Date().toISOString().slice(0, 10);
  document.getElementById('batch-date').value = todayStr;

  AppState.members.forEach(m => {
    const suggested = (Number(m.shares) || 1) * 1000;
    const row = document.createElement('tr');
    row.className = 'border-b border-slate-100 text-xs';
    row.innerHTML = `
      <td class="py-2 px-3 text-slate-500 font-semibold">${m.id}</td>
      <td class="py-2 px-3 font-bold text-slate-800">${m.name}</td>
      <td class="py-2 px-3 text-center">${formatBengaliNumber(m.shares)}</td>
      <td class="py-2 px-3 text-right">
        <input type="number" data-member-id="${m._docId || m.id}" class="batch-savings-input w-24 px-2 py-1 border border-slate-300 rounded text-right font-num" value="${suggested}" min="0" />
      </td>
      <td class="py-2 px-3 text-center">
        <input type="checkbox" checked data-member-id="${m._docId || m.id}" class="batch-include-check w-4 h-4 text-emerald-600 rounded" />
      </td>
    `;
    container.appendChild(row);
  });

  openModal('batchCollectionModal');
}

async function handleSaveBatchCollections() {
  const date = document.getElementById('batch-date').value;
  const remarks = document.getElementById('batch-remarks').value || 'মাসিক ব্যাচ কিস্তি আদায়';
  const checks = document.querySelectorAll('.batch-include-check:checked');

  if (checks.length === 0) {
    showToast('কমপক্ষে একজন সদস্য সিলেক্ট করুন', 'error');
    return;
  }

  try {
    let count = 0;
    for (const check of checks) {
      const memberId = check.getAttribute('data-member-id');
      const member = AppState.members.find(m => (m._docId === memberId || m.id === memberId));
      if (!member) continue;

      const input = document.querySelector(`.batch-savings-input[data-member-id="${memberId}"]`);
      const savings = Number(input ? input.value : 0) || 0;
      if (savings <= 0) continue;

      const receiptId = 'REC-' + (AppState.collections.length + 101 + count);
      const newCollection = {
        receiptId,
        id: receiptId,
        date,
        memberId: member.id || memberId,
        memberDocId: member._docId || null,
        memberName: member.name,
        savings,
        fine: 0,
        fee: 0,
        total: savings,
        remarks
      };

      if (window.FirebaseService) {
        await window.FirebaseService.addDoc('collections', newCollection);
        const newSavings = (Number(member.savings) || 0) + savings;
        const newInst = (Number(member.installments) || 0) + 1;
        if (member._docId) {
          await window.FirebaseService.updateDoc('members', member._docId, {
            savings: newSavings,
            installments: newInst
          });
        }
      } else {
        AppState.collections.push(newCollection);
        member.savings = (Number(member.savings) || 0) + savings;
        member.installments = (Number(member.installments) || 0) + 1;
      }
      count++;
    }

    if (!window.FirebaseService) {
      setLocalCache(CACHE_KEYS.collections, AppState.collections);
      setLocalCache(CACHE_KEYS.members, AppState.members);
      renderAll();
    }

    showToast(`একসাথে ${count} জন সদস্যের কিস্তি সফলভাবে জমা হয়েছে!`, 'success');
    closeModal('batchCollectionModal');
  } catch (err) {
    showToast('ব্যাচ কিস্তি জমার সময় ত্রুটি: ' + err.message, 'error');
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

  const memberTx = AppState.collections.filter(c => (c.memberId === member.id || c.memberDocId === member._docId || c.memberName === member.name));
  const tbody = document.getElementById('ledger-history-body');
  if (tbody) {
    tbody.innerHTML = '';
    if (memberTx.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400 text-xs">কোন সাম্প্রতিক কিস্তি জমা রেকর্ড নেই</td></tr>`;
    } else {
      memberTx.forEach(tx => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
        tr.innerHTML = `
          <td class="py-2 px-3 text-xs text-slate-500">${tx.date}</td>
          <td class="py-2 px-3 text-slate-700">${tx.remarks || 'কিস্তি জমা'}</td>
          <td class="py-2 px-3 text-right font-medium text-emerald-700 font-num">৳${formatBengaliNumber(tx.savings)}</td>
          <td class="py-2 px-3 text-right text-xs text-slate-500 font-num">৳${formatBengaliNumber((Number(tx.fine) || 0) + (Number(tx.fee) || 0))}</td>
          <td class="py-2 px-3 text-right font-bold text-slate-800 font-num">৳${formatBengaliNumber(tx.total)}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  openModal('memberLedgerModal');
}

// DIGITAL MEMBERSHIP CARD MODAL (ডিজিটাল সদস্য পরিচয়পত্র)
function openMemberIdCard(memberIdentifier) {
  const member = AppState.members.find(m => (m._docId === memberIdentifier || m.id === memberIdentifier));
  if (!member) return;

  const setEl = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };

  setEl('idcard-name', member.name);
  setEl('idcard-code', member.id);
  setEl('idcard-phone', member.phone || '–');
  setEl('idcard-shares', `${formatBengaliNumber(member.shares)} টি শেয়ার`);
  setEl('idcard-savings', '৳' + formatBengaliNumber(member.savings));

  openModal('memberIdCardModal');
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

// Edit Member Modal & Handler
function openEditMemberModal(memberIdentifier) {
  const member = AppState.members.find(m => (m._docId === memberIdentifier || m.id === memberIdentifier));
  if (!member) return;

  document.getElementById('edit-m-id').value = member._docId || member.id;
  document.getElementById('edit-m-code').value = member.id || '';
  document.getElementById('edit-m-name').value = member.name || '';
  document.getElementById('edit-m-phone').value = member.phone || '';
  document.getElementById('edit-m-shares').value = member.shares || 1;
  document.getElementById('edit-m-savings').value = member.savings || 0;

  openModal('editMemberModal');
}

async function handleUpdateMember(e) {
  e.preventDefault();
  const docIdOrCode = document.getElementById('edit-m-id').value;
  const name = document.getElementById('edit-m-name').value.trim();
  const phone = document.getElementById('edit-m-phone').value.trim();
  const shares = Number(document.getElementById('edit-m-shares').value) || 1;
  const savings = Number(document.getElementById('edit-m-savings').value) || 0;

  const member = AppState.members.find(m => (m._docId === docIdOrCode || m.id === docIdOrCode));
  if (!member) return;

  const updatedData = { name, phone, shares, savings };

  try {
    if (window.FirebaseService && member._docId) {
      await window.FirebaseService.updateDoc('members', member._docId, updatedData);
    } else {
      Object.assign(member, updatedData);
      setLocalCache(CACHE_KEYS.members, AppState.members);
      renderAll();
    }
    showToast('সদস্যের তথ্য সফলভাবে আপডেট হয়েছে!');
    closeModal('editMemberModal');
  } catch (err) {
    showToast('আপডেট ব্যর্থ: ' + err.message, 'error');
  }
}

// Delete Record Confirmation Modal
function confirmDeleteRecord(collectionName, identifier, title) {
  AppState.deleteTarget = { collectionName, identifier, title };
  const titleEl = document.getElementById('delete-modal-title');
  if (titleEl) {
    titleEl.innerText = `আপনি কি নিশ্চিত যে "${title}" মুছে ফেলতে চান?`;
  }
  openModal('deleteConfirmModal');
}

async function executeDelete() {
  if (!AppState.deleteTarget) return;
  const { collectionName, identifier, title } = AppState.deleteTarget;

  try {
    const listMap = {
      members: AppState.members,
      collections: AppState.collections,
      investments: AppState.investments,
      profits: AppState.profits,
      expenses: AppState.expenses,
      other_income: AppState.otherIncome
    };

    const targetList = listMap[collectionName] || [];
    const item = targetList.find(x => (x._docId === identifier || x.id === identifier || x.receiptId === identifier));

    if (window.FirebaseService && item && item._docId) {
      await window.FirebaseService.deleteDoc(collectionName, item._docId);
    } else if (item) {
      const idx = targetList.indexOf(item);
      if (idx > -1) targetList.splice(idx, 1);
      setLocalCache(CACHE_KEYS[collectionName] || collectionName, targetList);
      renderAll();
    }

    showToast(`"${title}" মুছে ফেলা হয়েছে`);
    closeModal('deleteConfirmModal');
    AppState.deleteTarget = null;
  } catch (err) {
    showToast('রেকর্ড মুছতে সমস্যা: ' + err.message, 'error');
  }
}

// Member Passbook Self-Service Portal Lookup
function handleMemberPortalLookup(e) {
  e.preventDefault();
  const query = document.getElementById('portal-query').value.trim().toLowerCase();
  const resultEl = document.getElementById('portal-result');
  const errorEl = document.getElementById('portal-error');

  if (!query) return;

  const member = AppState.members.find(m => 
    (m.phone && m.phone.includes(query)) || 
    (m.id && m.id.toLowerCase() === query)
  );

  if (!member) {
    errorEl.classList.remove('hidden');
    resultEl.classList.add('hidden');
    errorEl.innerText = 'কোন সদস্য পাওয়া যায়নি। আপনার সঠিক মোবাইল বা সদস্য কোড দিন।';
    return;
  }

  errorEl.classList.add('hidden');
  resultEl.classList.remove('hidden');

  const stats = calculateTotals();
  const memberProfit = (Number(member.shares) || 1) * stats.profitPerShare;
  const totalWorth = (Number(member.savings) || 0) + memberProfit;

  document.getElementById('portal-m-name').innerText = member.name;
  document.getElementById('portal-m-details').innerText = `সদস্য কোড: ${member.id} | মোবাইল: ${member.phone || '–'}`;
  document.getElementById('portal-m-shares').innerText = `${formatBengaliNumber(member.shares)} টি শেয়ার`;
  document.getElementById('portal-m-savings').innerText = '৳' + formatBengaliNumber(member.savings);
  document.getElementById('portal-m-profit').innerText = '৳' + formatBengaliNumber(memberProfit.toFixed(2));
  document.getElementById('portal-m-total').innerText = '৳' + formatBengaliNumber(totalWorth.toFixed(2));

  const txs = AppState.collections.filter(c => (c.memberId === member.id || c.memberDocId === member._docId));
  const tbody = document.getElementById('portal-history-body');
  tbody.innerHTML = '';
  if (txs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-slate-400 text-xs">কোন কিস্তি জমা রেকর্ড নেই</td></tr>`;
  } else {
    txs.slice(-5).reverse().forEach(tx => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 text-xs';
      tr.innerHTML = `
        <td class="py-2 px-2 text-slate-500">${tx.date}</td>
        <td class="py-2 px-2 font-medium text-slate-800">${tx.receiptId || tx.id}</td>
        <td class="py-2 px-2 text-right font-bold text-emerald-700 font-num">৳${formatBengaliNumber(tx.savings)}</td>
        <td class="py-2 px-2 text-center">
          <button onclick="showReceiptModal('${tx.receiptId || tx.id}')" class="text-emerald-600 underline font-semibold">রশিদ</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
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

  const newInv = { title, amount, recovered };

  try {
    if (window.FirebaseService) {
      await window.FirebaseService.addDoc('investments', newInv);
    } else {
      AppState.investments.push(newInv);
      setLocalCache(CACHE_KEYS.investments, AppState.investments);
      renderAll();
    }
    showToast('নতুন বিনিয়োগ সংরক্ষিত হয়েছে!');
    closeModal('investmentModal');
    document.getElementById('investmentForm').reset();
  } catch (err) {
    showToast('বিনিয়োগ সংরক্ষণে সমস্যা: ' + err.message, 'error');
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

// ==================== BACKUP & RESTORE CENTER ====================

// 1. Full System JSON Export
function exportDataJSON() {
  const data = {
    appName: 'Somiti Cooperative Management System',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    stats: calculateTotals(),
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
  a.download = `Somiti_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('সম্পূর্ণ JSON ব্যাকআপ ফাইল ডাউনলোড সম্পন্ন হয়েছে');
}

// 2. CSV Exports for Excel
function exportMembersCSV() {
  let csv = "\uFEFFসদস্য কোড,সদস্যের নাম,মোবাইল নম্বর,শেয়ার সংখ্যা,মোট সঞ্চয়,জরিমানা,ভর্তি ফি,মোট কিস্তি\n";
  AppState.members.forEach(m => {
    csv += `"${m.id}","${m.name}","${m.phone || ''}",${m.shares},${m.savings},${m.fine || 0},${m.fee || 0},${m.installments || 0}\n`;
  });
  downloadCSV(csv, `Somiti_Members_${new Date().toISOString().slice(0, 10)}.csv`);
  showToast('সদস্য তালিকা CSV ফাইল ডাউনলোড হয়েছে');
}

function exportCollectionsCSV() {
  let csv = "\uFEFFরশিদ নং,তারিখ,সদস্য কোড,সদস্যের নাম,সঞ্চয় জমা,জরিমানা,ফি,সর্বমোট,মন্তব্য\n";
  AppState.collections.forEach(c => {
    csv += `"${c.receiptId || c.id}","${c.date}","${c.memberId}","${c.memberName}",${c.savings},${c.fine || 0},${c.fee || 0},${c.total},"${c.remarks || ''}"\n`;
  });
  downloadCSV(csv, `Somiti_Collections_Log_${new Date().toISOString().slice(0, 10)}.csv`);
  showToast('কিস্তি আদায় খতিয়ান CSV ফাইল ডাউনলোড হয়েছে');
}

function exportAuditCSV() {
  const s = calculateTotals();
  let csv = "\uFEFFহিসাবের খাত,পরিমাণ (টাকা)\n";
  csv += `মোট সঞ্চয় জমা,${s.totalSavings}\n`;
  csv += `জরিমানা ও ফি আদায়,${s.totalFines + s.totalFees}\n`;
  csv += `অর্জিত মোট মুনাফা,${s.totalProfit}\n`;
  csv += `বিবিধ আয় ও সুদ,${s.totalOtherIncome}\n`;
  csv += `বর্তমান বিনিয়োগ স্থিতি,${s.pendingInvestment}\n`;
  csv += `সমিতির সর্বমোট ব্যয়,${s.totalExpenses}\n`;
  csv += `তহবিলে নগদ স্থিতি,${s.cashInHand}\n`;
  downloadCSV(csv, `Somiti_Financial_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
  showToast('আর্থিক অডিট রিপোর্ট CSV ফাইল ডাউনলোড হয়েছে');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// 3. Local Instant Snapshot (অফলাইন দ্রুত স্ন্যাপশট সংরক্ষণ)
function saveLocalSnapshot() {
  const snapshots = getLocalCache(CACHE_KEYS.snapshots, []);
  const newSnapshot = {
    id: 'SNAP-' + Date.now(),
    timestamp: new Date().toLocaleString('bn-BD'),
    memberCount: AppState.members.length,
    collectionCount: AppState.collections.length,
    data: {
      members: AppState.members,
      investments: AppState.investments,
      profits: AppState.profits,
      expenses: AppState.expenses,
      otherIncome: AppState.otherIncome,
      collections: AppState.collections
    }
  };
  snapshots.unshift(newSnapshot);
  // Keep last 5 snapshots
  if (snapshots.length > 5) snapshots.pop();
  setLocalCache(CACHE_KEYS.snapshots, snapshots);
  renderSnapshotHistory();
  showToast('ব্রাউজারে বর্তমান অবস্থার স্ন্যাপশট সংরক্ষিত হয়েছে!');
}

function renderSnapshotHistory() {
  const tbody = document.getElementById('snapshot-history-body');
  if (!tbody) return;
  const snapshots = getLocalCache(CACHE_KEYS.snapshots, []);
  tbody.innerHTML = '';

  if (snapshots.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-slate-400 text-xs">কোন স্থানীয় স্ন্যাপশট সংরক্ষিত নেই</td></tr>`;
    return;
  }

  snapshots.forEach((snap, idx) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-100 text-xs hover:bg-slate-50';
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-semibold text-slate-700">${snap.timestamp}</td>
      <td class="py-2.5 px-3 text-slate-600">${formatBengaliNumber(snap.memberCount)} জন সদস্য</td>
      <td class="py-2.5 px-3 text-slate-600">${formatBengaliNumber(snap.collectionCount)} টি কিস্তি</td>
      <td class="py-2.5 px-3 text-center space-x-2">
        <button onclick="restoreLocalSnapshot('${snap.id}')" class="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded text-[11px]">
          রিস্টোর
        </button>
        <button onclick="deleteLocalSnapshot('${snap.id}')" class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-[11px]">
          মুছুন
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function restoreLocalSnapshot(snapId) {
  if (!confirm('আপনি কি এই স্ন্যাপশট থেকে ডাটা রিস্টোর করতে চান?')) return;
  const snapshots = getLocalCache(CACHE_KEYS.snapshots, []);
  const snap = snapshots.find(s => s.id === snapId);
  if (!snap || !snap.data) return;

  AppState.members = snap.data.members || [];
  AppState.collections = snap.data.collections || [];
  AppState.investments = snap.data.investments || [];
  AppState.profits = snap.data.profits || [];
  AppState.expenses = snap.data.expenses || [];
  AppState.otherIncome = snap.data.otherIncome || [];

  setLocalCache(CACHE_KEYS.members, AppState.members);
  setLocalCache(CACHE_KEYS.collections, AppState.collections);
  setLocalCache(CACHE_KEYS.investments, AppState.investments);
  setLocalCache(CACHE_KEYS.profits, AppState.profits);
  setLocalCache(CACHE_KEYS.expenses, AppState.expenses);
  setLocalCache(CACHE_KEYS.otherIncome, AppState.otherIncome);

  renderAll();
  showToast('স্ন্যাপশট সফলভাবে রিস্টোর হয়েছে!', 'success');
}

function deleteLocalSnapshot(snapId) {
  let snapshots = getLocalCache(CACHE_KEYS.snapshots, []);
  snapshots = snapshots.filter(s => s.id !== snapId);
  setLocalCache(CACHE_KEYS.snapshots, snapshots);
  renderSnapshotHistory();
  showToast('স্ন্যাপশট মুছে ফেলা হয়েছে');
}

// 4. Import & Restore from JSON File
async function handleImportJSON(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const backupData = JSON.parse(e.target.result);
      if (!backupData.members && !backupData.collections) {
        throw new Error('অবৈধ ব্যাকআপ ফাইল ফরম্যাট');
      }

      if (window.FirebaseService) {
        showToast('ক্লাউড ডাটা রিস্টোর হচ্ছে...', 'info');
        const restoredCount = await window.FirebaseService.restoreFromJSON(backupData);
        showToast(`সফলভাবে ${restoredCount} টি রেকর্ড ক্লাউডে রিস্টোর করা হয়েছে!`, 'success');
      } else {
        AppState.members = backupData.members || [];
        AppState.collections = backupData.collections || [];
        AppState.investments = backupData.investments || [];
        AppState.profits = backupData.profits || [];
        AppState.expenses = backupData.expenses || [];
        AppState.otherIncome = backupData.otherIncome || [];
        setLocalCache(CACHE_KEYS.members, AppState.members);
        setLocalCache(CACHE_KEYS.collections, AppState.collections);
        renderAll();
        showToast('লোকাল ক্যাশে ব্যাকআপ রিস্টোর সফল হয়েছে!', 'success');
      }
      closeModal('backupRestoreModal');
      renderSnapshotHistory();
    } catch (err) {
      console.error('Import error:', err);
      showToast('ফাইল পড়তে সমস্যা: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
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
    AppState.isDemoAdmin = false;
    localStorage.removeItem(CACHE_KEYS.authDemo);
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

// 1-Click Demo Admin Mode
function loginAsDemoAdmin() {
  AppState.isDemoAdmin = true;
  AppState.currentUser = { email: 'demo.admin@somiti.org', displayName: 'ডেমো পরিচালক' };
  localStorage.setItem(CACHE_KEYS.authDemo, 'true');
  updateAuthUI(AppState.currentUser);
  closeModal('authModal');
  showToast('ডেমো পরিচালক মোডে সফলভাবে প্রবেশ করেছেন!', 'success');
}

async function handleAdminLogout() {
  AppState.isDemoAdmin = false;
  localStorage.removeItem(CACHE_KEYS.authDemo);
  try {
    if (window.FirebaseService) {
      await window.FirebaseService.logout();
    }
  } catch (err) {}
  updateAuthUI(null);
  showToast('লগআউট সফল হয়েছে', 'info');
}

// Update UI on Auth State Change
function updateAuthUI(user) {
  AppState.currentUser = user || (AppState.isDemoAdmin ? { email: 'demo.admin@somiti.org' } : null);
  const userStatusBadge = document.getElementById('user-status-badge');
  const userEmailDisplay = document.getElementById('user-email-display');
  const loginTriggerBtn = document.getElementById('login-trigger-btn');
  const logoutTriggerBtn = document.getElementById('logout-trigger-btn');

  if (AppState.currentUser) {
    if (userStatusBadge) {
      userStatusBadge.classList.remove('hidden');
      userStatusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> অ্যাডমিন সচল`;
    }
    if (userEmailDisplay) userEmailDisplay.innerText = AppState.currentUser.email || 'প্রধান পরিচালক';
    if (loginTriggerBtn) loginTriggerBtn.classList.add('hidden');
    if (logoutTriggerBtn) logoutTriggerBtn.classList.remove('hidden');
  } else {
    if (userStatusBadge) {
      userStatusBadge.classList.remove('hidden');
      userStatusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-400"></span> ভিউয়ার মোড`;
    }
    if (userEmailDisplay) userEmailDisplay.innerText = 'সাধারণ ভিউয়ার';
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
        cloudStatusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ক্লাউড সিঙ্ক সচল (Live)`;
      } else {
        cloudStatusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500"></span> অফলাইন (ক্যাশ মোড)`;
      }
    }
  };

  window.FirebaseService.onAuthState((user) => {
    if (user) {
      AppState.isDemoAdmin = false;
      localStorage.removeItem(CACHE_KEYS.authDemo);
      updateAuthUI(user);
    } else if (AppState.isDemoAdmin) {
      updateAuthUI({ email: 'demo.admin@somiti.org' });
    } else {
      updateAuthUI(null);
    }
  });

  window.FirebaseService.listenToCollection('members', (items) => {
    updateCloudStatus(true);
    AppState.members = items;
    setLocalCache(CACHE_KEYS.members, AppState.members);
    
    if (AppState.members.length === 0 && seedPromptEl) {
      seedPromptEl.classList.remove('hidden');
    } else if (seedPromptEl) {
      seedPromptEl.classList.add('hidden');
    }

    renderAll();
  }, () => {
    updateCloudStatus(false);
  });

  window.FirebaseService.listenToCollection('collections', (items) => {
    AppState.collections = items;
    setLocalCache(CACHE_KEYS.collections, items);
    renderCollections();
    renderDashboard();
    renderReports();
  });

  window.FirebaseService.listenToCollection('investments', (items) => {
    AppState.investments = items;
    setLocalCache(CACHE_KEYS.investments, items);
    renderInvestments();
    renderDashboard();
    renderReports();
  });

  window.FirebaseService.listenToCollection('profits', (items) => {
    AppState.profits = items;
    setLocalCache(CACHE_KEYS.profits, items);
    renderInvestments();
    renderDashboard();
    renderReports();
  });

  window.FirebaseService.listenToCollection('expenses', (items) => {
    AppState.expenses = items;
    setLocalCache(CACHE_KEYS.expenses, items);
    renderExpensesAndIncome();
    renderDashboard();
    renderReports();
  });

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
  const todayStr = new Date().toISOString().slice(0, 10);
  ['collect-date', 'prf-date', 'exp-date', 'inc-date', 'batch-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = todayStr;
  });

  if (AppState.isDemoAdmin) {
    updateAuthUI({ email: 'demo.admin@somiti.org' });
  }

  // Keyboard Shortcuts: Ctrl+K or / focuses search, Alt+N new member, Alt+C collection
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT')) {
      e.preventDefault();
      switchTab('members');
      const search = document.getElementById('memberSearchInput');
      if (search) search.focus();
    } else if (e.altKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      openModal('memberModal');
    } else if (e.altKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      openModal('collectionModal');
    }
  });

  switchTab('dashboard');
  renderAll();

  if (window.FirebaseService) {
    initializeFirebaseListeners();
  } else {
    window.addEventListener('firebase-ready', () => {
      initializeFirebaseListeners();
    });
  }
});

// Expose globals for UI inline attributes
window.switchTab = switchTab;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.renderMembersTable = renderMembersTable;
window.setMemberViewMode = setMemberViewMode;
window.quickCollect = quickCollect;
window.onMemberSelectChange = onMemberSelectChange;
window.setQuickDate = setQuickDate;
window.handleSaveCollection = handleSaveCollection;
window.openBatchCollectionModal = openBatchCollectionModal;
window.handleSaveBatchCollections = handleSaveBatchCollections;
window.showReceiptModal = showReceiptModal;
window.viewMemberLedger = viewMemberLedger;
window.openMemberIdCard = openMemberIdCard;
window.handleSaveMember = handleSaveMember;
window.openEditMemberModal = openEditMemberModal;
window.handleUpdateMember = handleUpdateMember;
window.confirmDeleteRecord = confirmDeleteRecord;
window.executeDelete = executeDelete;
window.handleMemberPortalLookup = handleMemberPortalLookup;
window.handleSaveInvestment = handleSaveInvestment;
window.handleSaveProfit = handleSaveProfit;
window.handleSaveExpense = handleSaveExpense;
window.handleSaveIncome = handleSaveIncome;
window.exportDataJSON = exportDataJSON;
window.exportMembersCSV = exportMembersCSV;
window.exportCollectionsCSV = exportCollectionsCSV;
window.exportAuditCSV = exportAuditCSV;
window.saveLocalSnapshot = saveLocalSnapshot;
window.restoreLocalSnapshot = restoreLocalSnapshot;
window.deleteLocalSnapshot = deleteLocalSnapshot;
window.handleImportJSON = handleImportJSON;
window.triggerCloudSeed = triggerCloudSeed;
window.handleAdminLogin = handleAdminLogin;
window.loginAsDemoAdmin = loginAsDemoAdmin;
window.handleAdminLogout = handleAdminLogout;
window.AppState = AppState;
