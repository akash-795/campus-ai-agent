import { useState, useRef, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════
//  CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════════════
const DEMAND_CFG = {
  high: { label: '🔥 High Demand', blend: 0.72, confidence: 92, color: 'bg-red-100 text-red-700 border-red-200', bar: 'bg-red-400' },
  medium: { label: '⚡ Medium Demand', blend: 0.50, confidence: 74, color: 'bg-amber-100 text-amber-700 border-amber-200', bar: 'bg-amber-400' },
  low: { label: '🟢 Low Demand', blend: 0.28, confidence: 55, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', bar: 'bg-emerald-400' },
};

const DEMANDS = ['low', 'medium', 'high'];

const BASE_ITEMS = [
  { id: 'event', name: 'Event Ticket', icon: '🎉', desc: 'Campus cultural / sports events', price: 200, minPrice: 140, demandLevel: 'high', gradient: 'from-pink-500 to-rose-500', activeBg: 'bg-gradient-to-r from-pink-500 to-rose-500', hoverBorder: 'hover:border-pink-300', shadow: 'shadow-pink-200/60', iconBg: 'from-pink-400 to-rose-500' },
  { id: 'food', name: 'Food Stall Meal', icon: '🍔', desc: 'Daily canteen meal combo', price: 120, minPrice: 84, demandLevel: 'medium', gradient: 'from-orange-400 to-amber-500', activeBg: 'bg-gradient-to-r from-orange-400 to-amber-500', hoverBorder: 'hover:border-orange-300', shadow: 'shadow-orange-200/60', iconBg: 'from-orange-400 to-amber-500' },
  { id: 'library', name: 'Library Late Fee', icon: '📚', desc: 'Overdue book fine clearance', price: 50, minPrice: 35, demandLevel: 'low', gradient: 'from-violet-500 to-purple-600', activeBg: 'bg-gradient-to-r from-violet-500 to-purple-600', hoverBorder: 'hover:border-violet-300', shadow: 'shadow-violet-200/60', iconBg: 'from-violet-500 to-purple-600' },
  { id: 'hostel', name: 'Hostel Room Upgrade', icon: '🏠', desc: 'Single AC room upgrade / month', price: 3500, minPrice: 2450, demandLevel: 'high', gradient: 'from-teal-500 to-cyan-500', activeBg: 'bg-gradient-to-r from-teal-500 to-cyan-500', hoverBorder: 'hover:border-teal-300', shadow: 'shadow-teal-200/60', iconBg: 'from-teal-500 to-cyan-500' },
  { id: 'campus', name: 'Campus Store', icon: '🛒', desc: 'Stationery & merchandise', price: 300, minPrice: 210, demandLevel: 'medium', gradient: 'from-blue-500 to-indigo-600', activeBg: 'bg-gradient-to-r from-blue-500 to-indigo-600', hoverBorder: 'hover:border-blue-300', shadow: 'shadow-blue-200/60', iconBg: 'from-blue-500 to-indigo-600' },
];

const CUSTOM_GRADIENT_OPTIONS = [
  { gradient: 'from-fuchsia-500 to-pink-600', activeBg: 'bg-gradient-to-r from-fuchsia-500 to-pink-600', hoverBorder: 'hover:border-fuchsia-300', shadow: 'shadow-fuchsia-200/60', iconBg: 'from-fuchsia-500 to-pink-600' },
  { gradient: 'from-lime-500 to-green-600', activeBg: 'bg-gradient-to-r from-lime-500 to-green-600', hoverBorder: 'hover:border-lime-300', shadow: 'shadow-lime-200/60', iconBg: 'from-lime-500 to-green-600' },
  { gradient: 'from-sky-500 to-cyan-600', activeBg: 'bg-gradient-to-r from-sky-500 to-cyan-600', hoverBorder: 'hover:border-sky-300', shadow: 'shadow-sky-200/60', iconBg: 'from-sky-500 to-cyan-600' },
  { gradient: 'from-amber-500 to-orange-600', activeBg: 'bg-gradient-to-r from-amber-500 to-orange-600', hoverBorder: 'hover:border-amber-300', shadow: 'shadow-amber-200/60', iconBg: 'from-amber-500 to-orange-600' },
  { gradient: 'from-rose-500 to-red-600', activeBg: 'bg-gradient-to-r from-rose-500 to-red-600', hoverBorder: 'hover:border-rose-300', shadow: 'shadow-rose-200/60', iconBg: 'from-rose-500 to-red-600' },
];

// ═══════════════════════════════════════════════════════════════════
//  PURE FUNCTIONS  (no hooks, no side-effects)
// ═══════════════════════════════════════════════════════════════════
function ts() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function aiGeneratePrice(cost) {
  return Math.round(cost * 1.3);
}

function randomDemand() {
  return DEMANDS[Math.floor(Math.random() * DEMANDS.length)];
}

/** Returns AI confidence 0-100 adjusted by the current budget ratio */
function calcConfidence(demandLevel, userBudget, currentPrice) {
  const base = DEMAND_CFG[demandLevel]?.confidence ?? 74;
  const ratio = userBudget / currentPrice;
  // confidence rises as user offer approaches price
  const boost = Math.round((ratio - 0.5) * 30);
  return Math.min(99, Math.max(30, base + boost));
}

/**
 * Smart negotiation engine — demand-aware, floor-safe
 * Returns { status, finalPrice, message, confidence }
 */
function negotiate(currentPrice, userBudget, minPrice, demandLevel, round) {
  const ratio = userBudget / currentPrice;
  const cfg = DEMAND_CFG[demandLevel] ?? DEMAND_CFG.medium;
  const conf = calcConfidence(demandLevel, userBudget, currentPrice);

  // ── Accept: budget ≥ 90% ──────────────────────────────────────
  if (ratio >= 0.9) {
    const final = Math.max(userBudget, minPrice);
    return {
      status: 'accepted', finalPrice: final, confidence: conf,
      message: `🤝 Deal accepted at ₹${final}! Great negotiating — you saved some cash! 💰`,
    };
  }

  // ── Reject: budget < 30% ──────────────────────────────────────
  if (ratio < 0.3) {
    const polite = Math.max(Math.round(currentPrice * 0.92), minPrice);
    return {
      status: 'rejected', finalPrice: polite, confidence: conf,
      message: `😅 That's way too low! I can go as low as ₹${polite}. How about that? ⚡`,
    };
  }

  // ── Final round ───────────────────────────────────────────────
  if (round >= 3) {
    const final = Math.max(Math.round(currentPrice * 0.85), minPrice);
    return {
      status: 'final', finalPrice: final, confidence: conf,
      message: `🤝 Absolute best: ₹${final} (${Math.round((1 - final / currentPrice) * 100)}% off). Take it or leave it! 🔥`,
    };
  }

  // ── Counter: demand-weighted blend ───────────────────────────
  const raw = Math.round(userBudget * (1 - cfg.blend) + currentPrice * cfg.blend);
  const counter = Math.max(raw, minPrice);
  const disc = Math.round((1 - counter / currentPrice) * 100);
  const tone = demandLevel === 'high'
    ? "High demand means I can't drop much, but"
    : demandLevel === 'low'
      ? "Demand is slow today, so"
      : "Let's be fair —";
  return {
    status: 'counter', finalPrice: counter, confidence: conf,
    message: `🤖 ${tone} I can offer ₹${counter} (${disc}% off). Deal? 😊`,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  SVG SPARKLINE  (Price Trend)
// ═══════════════════════════════════════════════════════════════════
function Sparkline({ history }) {
  if (!history || history.length < 2) {
    return (
      <div className="flex items-center justify-center h-16 text-slate-300 text-xs font-medium">
        Chart appears after 2+ offers
      </div>
    );
  }

  const W = 320, H = 64, PAD = 8;
  const prices = history.map(h => h.price);
  const mn = Math.min(...prices);
  const mx = Math.max(...prices);
  const range = mx - mn || 1;

  const pts = history.map((h, i) => {
    const x = PAD + (i / (history.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((h.price - mn) / range) * (H - PAD * 2);
    return { x, y, ...h };
  });

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const fillD = `${pathD} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#sg)" />
      <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={p.type === 'user' ? '#3b82f6' : '#6366f1'} stroke="white" strokeWidth="1.5" />
        </g>
      ))}
      {/* Price labels at first and last */}
      <text x={pts[0].x} y={H - 1} fontSize="9" fill="#94a3b8" textAnchor="middle">₹{pts[0].price}</text>
      <text x={pts[pts.length - 1].x} y={H - 1} fontSize="9" fill="#6366f1" fontWeight="700" textAnchor="middle">
        ₹{pts[pts.length - 1].price}
      </text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  AI CONFIDENCE BAR
// ═══════════════════════════════════════════════════════════════════
function ConfidenceBar({ confidence, demandLevel }) {
  const cfg = DEMAND_CFG[demandLevel] ?? DEMAND_CFG.medium;
  const label = confidence >= 85 ? 'Very Confident' : confidence >= 70 ? 'Confident' : confidence >= 55 ? 'Moderate' : 'Uncertain';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">AI Confidence</span>
        <span className="text-xs font-extrabold text-indigo-600">{confidence}% · {label}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  CHAT BUBBLE
// ═══════════════════════════════════════════════════════════════════
function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  const bubbleCls = isUser
    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-none shadow-lg shadow-blue-200/50'
    : msg.status === 'accepted'
      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-900 rounded-bl-none'
      : msg.status === 'final'
        ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-amber-900 rounded-bl-none'
        : msg.status === 'rejected'
          ? 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 text-red-900 rounded-bl-none'
          : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none';

  return (
    <div className={`flex items-end gap-2 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 shadow-md
        ${isUser ? 'bg-gradient-to-br from-blue-400 to-indigo-500' : 'bg-gradient-to-br from-slate-600 to-slate-800'}`}>
        {isUser ? '👤' : '🤖'}
      </div>
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${bubbleCls}`}>
        <p>{msg.text}</p>
        <p className={`text-[10px] mt-1.5 text-right ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
          {msg.time}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  ANALYTICS CARD
// ═══════════════════════════════════════════════════════════════════
function AnalyticsCard({ icon, label, value, sub, color }) {
  return (
    <div className={`glass-card flex-1 min-w-[120px] flex flex-col items-center justify-center py-4 px-3 rounded-2xl border ${color} shadow-sm`}>
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-2xl font-extrabold leading-none">{value}</span>
      <span className="text-xs font-bold opacity-70 mt-1 text-center">{label}</span>
      {sub && <span className="text-[10px] opacity-50 mt-0.5">{sub}</span>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  SECTION HEADER
// ═══════════════════════════════════════════════════════════════════
function SectionHeader({ icon, iconBg, title, sub }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center text-lg shadow-md shrink-0`}>
        {icon}
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-800 leading-tight">{title}</h2>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  MARKETPLACE ITEM BUTTON
// ═══════════════════════════════════════════════════════════════════
function MarketItem({ item, isActive, onClick }) {
  const cfg = DEMAND_CFG[item.demandLevel] ?? DEMAND_CFG.medium;
  return (
    <button
      id={`market-${item.id}`}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left
                 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
                 ${isActive
          ? `${item.activeBg} border-transparent text-white shadow-xl ${item.shadow}`
          : `border-slate-100 bg-white/60 ${item.hoverBorder} hover:bg-white`
        }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0
        ${isActive ? 'bg-white/25' : `bg-gradient-to-br ${item.iconBg} shadow-md`}`}>
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-800'}`}>{item.name}</div>
        <div className={`text-xs truncate mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-400'}`}>{item.desc}</div>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className={`font-extrabold text-sm px-2 py-0.5 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
          ₹{item.price}
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${isActive ? 'bg-white/20 text-white border-white/30' : cfg.color}`}>
          {item.demandLevel}
        </span>
      </div>
      {isActive && <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse shrink-0" />}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  PRICE CARDS  (Base | Current | Min)
// ═══════════════════════════════════════════════════════════════════
function PriceCards({ selected, currentOffer }) {
  if (!selected) return null;
  const saved = selected.basePrice - currentOffer;
  const savedPct = Math.round((saved / selected.basePrice) * 100);
  const atFloor = currentOffer <= selected.minPrice;

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {/* Base */}
      <div className="flex flex-col items-center py-3 px-2 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Base Price</span>
        <span className="text-xl font-extrabold text-slate-700">₹{selected.basePrice}</span>
        <span className="text-[10px] text-slate-400 mt-0.5 truncate px-1 text-center">{selected.icon} {selected.name}</span>
      </div>
      {/* Current */}
      <div className={`flex flex-col items-center py-3 px-2 rounded-xl border shadow-sm transition-all duration-500
        ${currentOffer < selected.basePrice ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Offer Price</span>
        <span className="text-xl font-extrabold text-emerald-600">₹{currentOffer}</span>
        {saved > 0
          ? <span className="text-[10px] font-bold text-emerald-500 mt-0.5 bg-emerald-100 px-1.5 rounded-full">−{savedPct}%</span>
          : <span className="text-[10px] text-slate-400 mt-0.5">Listed</span>
        }
      </div>
      {/* Min */}
      <div className={`flex flex-col items-center py-3 px-2 rounded-xl border shadow-sm transition-all duration-300
        ${atFloor ? 'border-amber-300 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">AI Floor</span>
        <span className={`text-xl font-extrabold ${atFloor ? 'text-amber-600' : 'text-slate-500'}`}>₹{selected.minPrice}</span>
        <span className="text-[10px] text-slate-400 mt-0.5">{atFloor ? '⚠️ Floor hit' : '70% base'}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  INPUT  (reusable styled input with validation)
// ═══════════════════════════════════════════════════════════════════
function Input({ id, type = 'text', value, onChange, placeholder, disabled, error, prefix }) {
  return (
    <div>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type={type}
          min={type === 'number' ? '1' : undefined}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full ${prefix ? 'pl-9' : 'pl-4'} pr-4 py-2.5 rounded-xl border-2 bg-slate-50/80 text-slate-700 
                     placeholder-slate-300 text-sm font-medium transition-all duration-200
                     focus:outline-none focus:bg-white focus:shadow-md
                     disabled:opacity-50 disabled:cursor-not-allowed
                     ${error ? 'border-red-300 focus:border-red-400 focus:shadow-red-100/60' : 'border-slate-100 focus:border-blue-400 focus:shadow-blue-100/60'}`}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1 font-medium">⚠️ {error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  APP  — main component
// ═══════════════════════════════════════════════════════════════════
export default function App() {

  // ── Marketplace items (base + custom) ───────────────────────────
  const [marketItems, setMarketItems] = useState(BASE_ITEMS);

  // ── Store form state ─────────────────────────────────────────────
  const [storeName, setStoreName] = useState('');
  const [storeCost, setStoreCost] = useState('');
  const [storeErrors, setStoreErrors] = useState({});

  // ── Selection ────────────────────────────────────────────────────
  const [selected, setSelected] = useState(null);

  // ── Negotiation ──────────────────────────────────────────────────
  const [budget, setBudget] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [currentOffer, setCurrentOffer] = useState(0);
  const [messages, setMessages] = useState([
    { role: 'ai', text: '👋 Welcome to Campus AI! Select a product from the Marketplace to start negotiating a deal. 🚀', time: ts(), status: 'info' },
  ]);
  const [round, setRound] = useState(0);
  const [dealDone, setDealDone] = useState(false);
  const [confidence, setConfidence] = useState(74);
  const [priceHistory, setPriceHistory] = useState([]);

  // ── Analytics ────────────────────────────────────────────────────
  const [analytics, setAnalytics] = useState({
    total: 0,
    accepted: 0,
    rejected: 0,
    counterOffers: 0,
    priceSum: 0,      // sum of all final accepted prices
  });

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Helpers ──────────────────────────────────────────────────────
  const push = useCallback((msg) => {
    setMessages(prev => [...prev, { ...msg, time: ts() }]);
  }, []);

  // ── Store: validate + add product ────────────────────────────────
  function handleAddProduct(e) {
    e.preventDefault();
    const errors = {};
    if (!storeName.trim()) errors.name = 'Product name is required.';
    if (!storeCost || isNaN(+storeCost)) errors.cost = 'Enter a valid cost.';
    else if (+storeCost <= 0) errors.cost = 'Cost must be greater than ₹0.';
    if (Object.keys(errors).length) { setStoreErrors(errors); return; }

    const cost = +storeCost;
    const aiPrice = aiGeneratePrice(cost);
    const demand = randomDemand();
    const minP = Math.round(aiPrice * 0.7);
    const colorIdx = marketItems.filter(i => i.source === 'store').length % CUSTOM_GRADIENT_OPTIONS.length;
    const style = CUSTOM_GRADIENT_OPTIONS[colorIdx];

    const newItem = {
      id: `custom-${Date.now()}`,
      name: storeName.trim(),
      icon: '🏷️',
      desc: `Cost ₹${cost} → AI price ₹${aiPrice} (+30%)`,
      price: aiPrice,
      basePrice: aiPrice,
      minPrice: minP,
      demandLevel: demand,
      source: 'store',
      ...style,
    };

    setMarketItems(prev => [...prev, newItem]);
    setStoreName('');
    setStoreCost('');
    setStoreErrors({});
  }

  // ── Select from marketplace ───────────────────────────────────────
  function handleSelect(raw) {
    const item = {
      ...raw,
      basePrice: raw.basePrice ?? raw.price,
      minPrice: raw.minPrice ?? Math.round(raw.price * 0.7),
      demandLevel: raw.demandLevel ?? 'medium',
    };
    const conf = calcConfidence(item.demandLevel, item.basePrice, item.basePrice);
    const cfg = DEMAND_CFG[item.demandLevel];
    const demandHint =
      item.demandLevel === 'high' ? `⚡ High demand — I won't drop much below ₹${item.price}.`
        : item.demandLevel === 'low' ? `🟢 Low demand — I'm feeling flexible!`
          : `⚡ Fair demand. Let's see what we can do!`;

    setSelected(item);
    setCurrentOffer(item.basePrice);
    setRound(0);
    setDealDone(false);
    setBudget('');
    setBudgetError('');
    setConfidence(conf);
    setPriceHistory([{ round: 0, price: item.basePrice, type: 'ai', label: 'Listed' }]);
    setMessages([{
      role: 'ai',
      text: `${item.icon} You selected **${item.name}** — ₹${item.price}. ${demandHint}\n💡 Offer ≥ ₹${Math.round(item.price * 0.9)} for instant accept!`,
      time: ts(),
      status: 'info',
    }]);
  }

  // ── Negotiate ────────────────────────────────────────────────────
  function handleNegotiate(e) {
    e.preventDefault();
    // validation
    if (!selected) { setBudgetError('Select a product first.'); return; }
    if (dealDone) return;
    if (!budget || !+budget) { setBudgetError('Enter a valid budget amount.'); return; }
    if (+budget <= 0) { setBudgetError('Budget must be greater than ₹0.'); return; }
    setBudgetError('');

    const offer = +budget;
    const result = negotiate(currentOffer, offer, selected.minPrice, selected.demandLevel, round);

    push({ role: 'user', text: `💰 User: My budget is ₹${offer}`, status: 'user' });

    setRound(r => r + 1);
    setCurrentOffer(result.finalPrice);
    setConfidence(result.confidence);
    setPriceHistory(prev => [
      ...prev,
      { round: round + 1, price: offer, type: 'user', label: `R${round + 1} offer` },
      { round: round + 1, price: result.finalPrice, type: 'ai', label: `R${round + 1} counter` },
    ]);

    setAnalytics(a => ({
      ...a,
      total: a.total + 1,
      accepted: result.status === 'accepted' ? a.accepted + 1 : a.accepted,
      rejected: result.status === 'rejected' ? a.rejected + 1 : a.rejected,
      counterOffers: (result.status === 'counter' || result.status === 'final') ? a.counterOffers + 1 : a.counterOffers,
      priceSum: result.status === 'accepted' ? a.priceSum + result.finalPrice : a.priceSum,
    }));

    setTimeout(() => {
      push({ role: 'ai', text: `AI: ${result.message}`, status: result.status });
      if (result.status === 'accepted') setDealDone(true);
    }, 400);

    setBudget('');
  }

  // ── Accept current offer ─────────────────────────────────────────
  function handleAccept() {
    if (!selected || dealDone) return;
    push({ role: 'user', text: '✅ User: I accept the current price!', status: 'user' });
    setTimeout(() => {
      push({
        role: 'ai',
        text: `AI: 🎊 Deal closed at ₹${currentOffer}! You're a great negotiator. Thanks for shopping with Campus AI! 🤝`,
        status: 'accepted',
      });
      setDealDone(true);
      setAnalytics(a => ({ ...a, accepted: a.accepted + 1, priceSum: a.priceSum + currentOffer }));
    }, 400);
  }

  // ── Reset price ──────────────────────────────────────────────────
  function handleReset() {
    if (!selected) return;
    setCurrentOffer(selected.basePrice);
    setRound(0);
    setDealDone(false);
    setBudget('');
    setBudgetError('');
    const conf = calcConfidence(selected.demandLevel, selected.basePrice, selected.basePrice);
    setConfidence(conf);
    setPriceHistory([{ round: 0, price: selected.basePrice, type: 'ai', label: 'Listed' }]);
    push({ role: 'ai', text: `AI: 🔄 Reset to ₹${selected.basePrice}. Fresh start! You've got this! 💪`, status: 'info' });
  }

  // ── Reshuffle demand of a marketplace item ────────────────────────
  function handleShuffleDemand(itemId) {
    setMarketItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, demandLevel: randomDemand() } : i
    ));
  }

  // ── Derived analytics values ─────────────────────────────────────
  const avgFinal = analytics.accepted > 0
    ? Math.round(analytics.priceSum / analytics.accepted)
    : 0;

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#eef2ff] font-sans">

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-300/8 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* ══════════════════════════════════════════════
            HEADER
        ══════════════════════════════════════════════ */}
        <header className="space-y-5">
          {/* Logo pill */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-xl px-7 py-3.5 rounded-2xl shadow-xl shadow-blue-100/60 border border-white/80">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-400/40">
                🚀
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Campus AI Pricing Agent
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Smart Marketplace · AI Negotiation · Demand Analytics
                </p>
              </div>
            </div>
          </div>

          {/* ── ANALYTICS DASHBOARD ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <AnalyticsCard
              icon="🔄" label="Total Negotiations" value={analytics.total}
              color="bg-blue-50 text-blue-700 border-blue-200"
            />
            <AnalyticsCard
              icon="✅" label="Deals Accepted" value={analytics.accepted}
              sub={analytics.total > 0 ? `${Math.round(analytics.accepted / analytics.total * 100)}% rate` : '—'}
              color="bg-emerald-50 text-emerald-700 border-emerald-200"
            />
            <AnalyticsCard
              icon="❌" label="Deals Rejected" value={analytics.rejected}
              color="bg-red-50 text-red-700 border-red-200"
            />
            <AnalyticsCard
              icon="💰" label="Avg Final Price" value={avgFinal ? `₹${avgFinal}` : '—'}
              sub={analytics.accepted > 0 ? `over ${analytics.accepted} deal${analytics.accepted > 1 ? 's' : ''}` : 'no deals yet'}
              color="bg-violet-50 text-violet-700 border-violet-200"
            />
          </div>
        </header>

        {/* ══════════════════════════════════════════════
            MAIN 3-COLUMN GRID
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* ════ LEFT: Store + Marketplace ════ */}
          <div className="lg:col-span-4 space-y-5">

            {/* ─── Campus Store ─── */}
            <div className="glass-card p-6 rounded-2xl">
              <SectionHeader
                icon="🛒"
                iconBg="bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-300/40"
                title="Campus Store"
                sub="Add products — AI prices at cost + 30%"
              />

              <form onSubmit={handleAddProduct} className="space-y-3" noValidate>
                <div className="space-y-1">
                  <label className="label-style">Product Name</label>
                  <Input
                    id="store-product-name"
                    value={storeName}
                    onChange={e => { setStoreName(e.target.value); setStoreErrors(p => ({ ...p, name: '' })); }}
                    placeholder="e.g. Campus Hoodie"
                    error={storeErrors.name}
                  />
                </div>

                <div className="space-y-1">
                  <label className="label-style">Cost Price (₹)</label>
                  <Input
                    id="store-cost-price"
                    type="number"
                    value={storeCost}
                    onChange={e => { setStoreCost(e.target.value); setStoreErrors(p => ({ ...p, cost: '' })); }}
                    placeholder="e.g. 500"
                    prefix="₹"
                    error={storeErrors.cost}
                  />
                </div>

                {/* Live AI price preview */}
                {storeCost && +storeCost > 0 && (
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 animate-fade-in">
                    <span className="text-xs text-blue-500 font-medium">AI Selling Price</span>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-blue-600">₹{aiGeneratePrice(+storeCost)}</span>
                      <span className="text-[10px] text-blue-400 font-bold ml-1">(+30%)</span>
                    </div>
                  </div>
                )}

                <button
                  id="add-product-btn"
                  type="submit"
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-white
                             bg-gradient-to-r from-blue-500 to-indigo-600
                             shadow-lg shadow-blue-400/30 hover:shadow-xl hover:shadow-blue-400/50
                             hover:scale-[1.02] hover:brightness-110 active:scale-[0.97]
                             transition-all duration-200"
                >
                  ✨ Generate AI Price & Add to Market
                </button>
              </form>
            </div>

            {/* ─── Campus Marketplace ─── */}
            <div className="glass-card p-6 rounded-2xl">
              <SectionHeader
                icon="🏪"
                iconBg="bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-300/40"
                title="Campus Marketplace"
                sub={`${marketItems.length} products · click to negotiate`}
              />

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                {marketItems.map(item => (
                  <div key={item.id} className="relative group">
                    <MarketItem
                      item={item}
                      isActive={selected?.id === item.id}
                      onClick={() => handleSelect({ ...item, source: item.source ?? 'marketplace' })}
                    />
                    {/* Demand shuffle button — visible on hover */}
                    <button
                      title="Randomize demand"
                      onClick={e => { e.stopPropagation(); handleShuffleDemand(item.id); }}
                      className="absolute top-1.5 right-10 opacity-0 group-hover:opacity-100 transition-opacity
                                 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-xs text-slate-500 hover:bg-slate-50"
                    >
                      🎲
                    </button>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                {Object.entries(DEMAND_CFG).map(([k, v]) => (
                  <span key={k} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${v.color}`}>{v.label}</span>
                ))}
                <span className="text-[10px] text-slate-400 ml-auto self-center">🎲 hover to reshuffle</span>
              </div>
            </div>
          </div>

          {/* ════ RIGHT: Negotiation Panel (8 cols) ════ */}
          <div className="lg:col-span-8">
            <div className="glass-card p-6 rounded-2xl flex flex-col" style={{ minHeight: '700px' }}>

              {/* Panel header row */}
              <div className="flex items-start justify-between mb-4">
                <SectionHeader
                  icon="🤝"
                  iconBg="bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-300/40"
                  title="AI Negotiation Panel"
                  sub="Demand-aware · Auto-accept at 90% · Min-price floor"
                />
                {selected && !dealDone && (
                  <div className="flex gap-1 shrink-0 ml-3 mt-0.5">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className={`h-1.5 w-7 rounded-full transition-all duration-500 ${i < round ? 'bg-blue-500' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                )}
              </div>

              {/* Demand badge + Price Cards */}
              {selected && (
                <div className="space-y-3 mb-4">
                  {/* Demand badge */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${DEMAND_CFG[selected.demandLevel]?.color}`}>
                      {DEMAND_CFG[selected.demandLevel]?.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      Round <strong className="text-slate-700">{round}</strong> of 3 &nbsp;·&nbsp;
                      Floor <strong className="text-amber-600">₹{selected.minPrice}</strong>
                    </span>
                  </div>
                  <PriceCards selected={selected} currentOffer={currentOffer} />
                </div>
              )}

              {/* AI Confidence */}
              {selected && (
                <div className="mb-4">
                  <ConfidenceBar confidence={confidence} demandLevel={selected.demandLevel} />
                </div>
              )}

              {/* Price Trend Chart */}
              {selected && (
                <div className="mb-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">📈 Price Trend</span>
                    <span className="text-[10px] text-slate-400">{priceHistory.length} data points</span>
                  </div>
                  <Sparkline history={priceHistory} />
                </div>
              )}

              {/* Deal closed banner */}
              {dealDone && (
                <div className="mb-4 flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white shadow-xl shadow-emerald-300/40">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl shrink-0">🎊</div>
                  <div className="flex-1">
                    <div className="font-extrabold text-lg leading-tight">Deal Closed!</div>
                    <div className="text-sm text-white/80">Final price: ₹{currentOffer} · Great negotiation! 🏆</div>
                  </div>
                  <div className="text-4xl font-extrabold text-white/20 shrink-0">✓</div>
                </div>
              )}

              {/* Chat Window */}
              <div className="flex-1 rounded-xl bg-gradient-to-b from-slate-50/80 to-white border border-slate-100 p-4 overflow-y-auto space-y-3.5 mb-4 shadow-inner min-h-[200px] custom-scrollbar">
                {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
                <div ref={bottomRef} />
              </div>

              {/* Input Row */}
              <form onSubmit={handleNegotiate} noValidate>
                <div className="flex gap-2.5">
                  <div className="flex-1">
                    <Input
                      id="budget-input"
                      type="number"
                      value={budget}
                      onChange={e => { setBudget(e.target.value); setBudgetError(''); }}
                      disabled={!selected || dealDone}
                      placeholder={
                        !selected ? 'Select a product first…'
                          : dealDone ? 'Deal complete!'
                            : `Your budget (listed ₹${selected.basePrice})`
                      }
                      prefix="₹"
                      error={budgetError}
                    />
                  </div>

                  {/* Submit Budget */}
                  <button
                    id="negotiate-btn"
                    type="submit"
                    disabled={!selected || dealDone || !budget || +budget <= 0}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-white shrink-0
                               bg-gradient-to-r from-emerald-500 to-teal-500
                               shadow-lg shadow-emerald-300/40
                               hover:shadow-xl hover:shadow-emerald-400/50 hover:scale-105 hover:brightness-110
                               active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                               transition-all duration-200 flex items-center gap-2"
                  >
                    <span>🤝</span>
                    <span className="hidden sm:inline">Submit</span>
                  </button>

                  {/* Accept */}
                  {selected && !dealDone && (
                    <button
                      id="accept-btn"
                      type="button"
                      onClick={handleAccept}
                      className="px-5 py-2.5 rounded-xl font-bold text-sm text-white shrink-0
                                 bg-gradient-to-r from-blue-500 to-indigo-600
                                 shadow-lg shadow-blue-300/40
                                 hover:shadow-xl hover:shadow-blue-400/50 hover:scale-105 hover:brightness-110
                                 active:scale-95 transition-all duration-200 flex items-center gap-2"
                    >
                      <span>✅</span>
                      <span className="hidden sm:inline">Accept</span>
                    </button>
                  )}

                  {/* Reset */}
                  {selected && (
                    <button
                      id="reset-btn"
                      type="button"
                      onClick={handleReset}
                      title="Reset to base price"
                      className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 shrink-0
                                 bg-white border-2 border-slate-200
                                 hover:border-slate-300 hover:bg-slate-50 hover:scale-105
                                 active:scale-95 transition-all duration-200 flex items-center gap-1.5"
                    >
                      <span>🔄</span>
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  )}
                </div>

                {/* Tip bar */}
                {selected && !dealDone && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="text-xs text-slate-400">
                      💡 Offer ≥{' '}
                      <strong className="text-emerald-500">₹{Math.round(currentOffer * 0.9)}</strong>
                      {' '}for instant deal
                    </span>
                    <span className="text-xs text-slate-400">
                      🛡️ AI floor:{' '}
                      <strong className="text-amber-500">₹{selected.minPrice}</strong>
                    </span>
                    <span className="text-xs text-slate-400 ml-auto">
                      {Math.max(0, 3 - round)} rounds left
                    </span>
                  </div>
                )}
              </form>

              {/* Empty state */}
              {!selected && (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner animate-float">
                    👆
                  </div>
                  <div>
                    <p className="text-slate-600 font-semibold">Nothing selected yet</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Pick from the Marketplace or add a product<br />in the Campus Store to start negotiating
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════ */}
        <footer className="text-center text-slate-400 text-xs pb-4 space-y-1">
          <p>
            Built with <span className="text-pink-500">♥</span> for Hackathon 2025 &nbsp;·&nbsp;
            Campus AI Pricing Agent &nbsp;·&nbsp; React + Tailwind CSS
          </p>
          <p className="text-slate-300 text-[10px]">
            🔥 High demand = smaller discounts &nbsp;|&nbsp; 🟢 Low demand = generous AI &nbsp;|&nbsp; ⚡ Reset anytime
          </p>
        </footer>

      </div>
    </div>
  );
}
