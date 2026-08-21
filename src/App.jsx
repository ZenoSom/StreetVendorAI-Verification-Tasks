import { useEffect, useState } from "react";
import "./App.css";

function App() {
  // Authentication State
  const [vendor, setVendor] = useState(null);
  const [formData, setFormData] = useState({
    name: "", mobile: "", location: "", business_name: "", business_type: "Food Vendor", monthly_income: "",
  });

  // Data Entry State
  const [todaySales, setTodaySales] = useState("");
  const [todayRevenue, setTodayRevenue] = useState("");
  const [currentStock, setCurrentStock] = useState("20");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liveTransactions, setLiveTransactions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dateTransactions, setDateTransactions] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  // Analytics & Hub States
  const [forecast, setForecast] = useState(null);
  const [inventoryPlan, setInventoryPlan] = useState(null);
  const [financeAdvice, setFinanceAdvice] = useState(null);
  
  const [hubSchemes, setHubSchemes] = useState([]);
  const [hubSuppliers, setHubSuppliers] = useState([]);
  const [hubLicense, setHubLicense] = useState(null);
  const [hubTraining, setHubTraining] = useState([]);
  const [marketAccess, setMarketAccess] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);

  // UI State
  const [activeTab, setActiveTab] = useState("schemes");
  const [activeModal, setActiveModal] = useState(null); // 'training', 'license', 'qr', 'orderSuccess', 'receipt'
  const [modalData, setModalData] = useState(null);

  const [cashAmount, setCashAmount] = useState("");
  const [cashItems, setCashItems] = useState("");

  // Check Local Storage on Load
  useEffect(() => {
    const savedVendor = localStorage.getItem("vendor");
    if (savedVendor) {
      setVendor(JSON.parse(savedVendor));
    }
  }, []);

  // Fetch Hub Data when Vendor logs in
  useEffect(() => {
    if (vendor && vendor.id) {
      fetchVendorHubData();
      fetchVendorSalesHistory();
    }
  }, [vendor]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        monthly_income: Number(formData.monthly_income) || 0,
        has_upi: true,
        has_bank_account: true,
        has_license: false, // Defaulting for demo to trigger FSSAI wizard
      };
      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setVendor(data);
      localStorage.setItem("vendor", JSON.stringify(data));
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Failed to register vendor. Please ensure backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    try {
      // 9876543210 is seeded by the backend script
      const payload = {
        name: "Demo", mobile: "9876543210", location: "Delhi", business_name: "Demo", business_type: "Demo", products: "Tea, Coffee, Snacks", monthly_income: 0, has_upi: true, has_bank_account: true, has_license: false
      };
      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Demo login failed");
      }
      const data = await response.json();
      setVendor(data);
      localStorage.setItem("vendor", JSON.stringify(data));
    } catch (e) {
      console.error(e);
      alert("Failed to login to demo account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vendor");
    setVendor(null);
    setForecast(null);
    setInventoryPlan(null);
    setFinanceAdvice(null);
  };

  const fetchVendorHubData = async () => {
    try {
      const [schemesRes, suppliersRes, licenseRes, trainingRes, marketRes] = await Promise.all([
        fetch(`/api/hub/eligibility/${vendor.id}`),
        fetch(`/api/hub/sourcing/all`),
        fetch(`/api/hub/license-guide/${vendor.id}`),
        fetch(`/api/hub/training`),
        fetch(`/api/market-access`)
      ]);
      if (schemesRes.ok) setHubSchemes(await schemesRes.json());
      if (suppliersRes.ok) setHubSuppliers(await suppliersRes.json());
      if (licenseRes.ok) setHubLicense(await licenseRes.json());
      if (trainingRes.ok) setHubTraining(await trainingRes.json());
      if (marketRes.ok) setMarketAccess(await marketRes.json());
    } catch (e) { console.error("Hub fetch error", e); }
  };

  const fetchVendorSalesHistory = async () => {
    try {
      const res = await fetch(`/api/sales/${vendor.id}`);
      if (res.ok) setSalesHistory(await res.json());
    } catch (e) { console.error("Sales history error", e); }
  };

  useEffect(() => {
    if (!vendor) return;
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`/api/transactions/${vendor.id}?date=${selectedDate}`);
        if (res.ok) {
          setDateTransactions(await res.json());
        }
      } catch (e) { console.error("Failed to fetch date transactions", e); }
    };
    fetchTransactions();
  }, [selectedDate, vendor, liveTransactions]);

  // Shared function to update AI insights (used by Manual Entry and Live Sync)
  const refreshAIInsights = async (unitsForFinance) => {
    try {
      // 1. Generate ML Forecast
      const forecastRes = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: vendor.id, auto_record: false }),
      });
      const forecastData = await forecastRes.json();
      setForecast(forecastData);

      // 2. Generate Inventory Plan
      const inventoryRes = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendor.id,
          forecast_demand: forecastData.forecast_demand,
          current_stock: Number(currentStock),
          safety_stock: 5,
        }),
      });
      setInventoryPlan(await inventoryRes.json());

      // 3. Financial Advice
      const financeRes = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cost_per_unit: 40.0, // Assuming static cost for demo
          target_margin_pct: 35.0,
          daily_sales_units: unitsForFinance || 100
        }),
      });
      setFinanceAdvice(await financeRes.json());

      // Refresh History
      fetchVendorSalesHistory();
    } catch (e) {
      console.error("AI Insight generation failed", e);
    }
  };

  const handleRecordSales = async (e) => {
    e.preventDefault();
    if (!todaySales || !todayRevenue) {
      alert("Please enter both units sold and revenue.");
      return;
    }
    setIsSubmitting(true);

    try {
      // Log Sales in DB
      await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendor.id,
          units_sold: Number(todaySales),
          revenue_amount: Number(todayRevenue),
          is_auto_recorded: false,
        }),
      });

      await refreshAIInsights(Number(todaySales));
      
      alert("Sales recorded and AI insights generated successfully!");
      setTodaySales("");
      setTodayRevenue("");

    } catch (error) {
      console.error("Action failed:", error);
      alert("Failed to process data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCashSale = async () => {
    if (!cashAmount || !cashItems) return alert("Please enter amount and items.");
    try {
      const res = await fetch("/api/cash-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: vendor.id, amount: parseFloat(cashAmount), items_sold: cashItems })
      });
      if (res.ok) {
        const newTxn = await res.json();
        setLiveTransactions(prev => [newTxn, ...prev]);
        setCashAmount("");
        setCashItems("");
        setModalData(newTxn);
        setActiveModal("receipt");
        fetchVendorSalesHistory();
      }
    } catch (e) { console.error(e); }
  };

  const handleSyncUPI = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/upi/sync/${vendor.id}`, { method: "POST" });
      if (res.ok) {
        const newTxns = await res.json();
        setLiveTransactions(prev => [...newTxns, ...prev].slice(0, 5));
        if (newTxns.length > 0) {
          setModalData(newTxns[0]);
          setActiveModal("receipt");
        }
        
        // Use an approximate number of units based on the transactions
        const approxUnits = newTxns.length * 2;
        await refreshAIInsights(approxUnits);
        fetchVendorSalesHistory();
      }
    } catch (e) {
      console.error("UPI sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePlaceOrder = async (units) => {
    setIsOrdering(true);
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendor.id,
          supplier_name: hubSuppliers[0]?.name || "Local Wholesale",
          item_name: "Daily Raw Materials",
          quantity: units,
          total_cost: units * 40
        })
      });
      setActiveModal("orderSuccess");
    } catch (e) {
      alert("Order failed.");
    } finally {
      setIsOrdering(false);
    }
  };


  // --- RENDER AUTH SCREEN ---
  if (!vendor) {
    return (
      <div className="app-container">
        <div className="auth-wrapper">
          <div className="auth-card">
            <div className="auth-header">
              <h1>StreetVendor AI</h1>
              <p>Empowering micro-entrepreneurs with AI insights</p>
            </div>
            
            <form onSubmit={handleRegister}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Full Name</label>
                  <input className="input-field" required name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Ramesh Kumar" />
                </div>
                <div className="input-group">
                  <label>Mobile Number</label>
                  <input className="input-field" required name="mobile" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} placeholder="e.g. 9876543210" />
                </div>
              </div>
              
              <div className="input-group">
                <label>Business Name</label>
                <input className="input-field" required name="business_name" value={formData.business_name} onChange={(e) => setFormData({...formData, business_name: e.target.value})} placeholder="e.g. Ramesh Special Tea" />
              </div>
              
              <div className="input-group">
                <label>Products Sold</label>
                <input className="input-field" required name="products" value={formData.products || ""} onChange={(e) => setFormData({...formData, products: e.target.value})} placeholder="e.g. Tea, Coffee, Biscuits" />
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Business Type</label>
                  <select className="input-field" value={formData.business_type} onChange={(e) => setFormData({...formData, business_type: e.target.value})}>
                    <option>Food Vendor</option>
                    <option>Fruit & Vegetable Vendor</option>
                    <option>Handicrafts</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Avg. Monthly Income (₹)</label>
                  <input className="input-field" type="number" required value={formData.monthly_income} onChange={(e) => setFormData({...formData, monthly_income: e.target.value})} placeholder="18000" />
                </div>
              </div>
              
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Creating Profile..." : "Register & Enter Dashboard"}
              </button>
            </form>

            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <p style={{ fontSize: "12px", color: "var(--color-slate-500)", marginBottom: "8px" }}>Want to skip registration?</p>
              <button className="btn-secondary" onClick={handleDemoLogin} disabled={isSubmitting}>
                🔑 Login as Demo Vendor (Ramesh Tea Stall)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER DASHBOARD ---
  return (
    <div className="dashboard-wrapper">
      <nav className="top-navbar">
        <div className="brand-title">StreetVendor AI</div>
        <div className="user-profile">
          <div className="user-details">
            <div className="user-name">{vendor.name}</div>
            <div className="user-biz">{vendor.business_name}</div>
          </div>
          <button className="btn-secondary" style={{ marginTop: 0, padding: "8px 16px" }} onClick={handleLogout}>Log Out</button>
        </div>
      </nav>

      <div className="dashboard-grid">
        {/* LEFT SIDEBAR: DATA ENTRY */}
        <aside className="glass-panel entry-widget">
          <h2 className="panel-title">📊 Activity Log</h2>

          {/* Quick Cash Register */}
          <div style={{ background: "rgba(16, 185, 129, 0.05)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.2)", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "14px", color: "var(--color-slate-800)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-accent-green)", boxShadow: "0 0 8px var(--color-accent-green)" }}></span>
              Quick Cash Register
            </h3>
            <p style={{ fontSize: "12px", color: "var(--color-slate-500)", marginBottom: "12px" }}>Instantly record a cash transaction.</p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <input type="number" className="input-field" placeholder="₹ Amount" value={cashAmount} onChange={e => setCashAmount(e.target.value)} style={{ flex: 1, padding: "8px" }} />
              <input type="text" className="input-field" placeholder="Items (e.g. 2x Tea)" value={cashItems} onChange={e => setCashItems(e.target.value)} style={{ flex: 2, padding: "8px" }} />
            </div>
            <button className="btn-primary" style={{ background: "var(--color-accent-green)", padding: "10px", width: "100%" }} onClick={handleCashSale}>
              Record Cash Sale
            </button>
          </div>

          {/* Daily Ledger & Calendar */}
          <div style={{ background: "rgba(59, 130, 246, 0.05)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.2)", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "14px", color: "var(--color-slate-800)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-brand-500)", boxShadow: "0 0 8px var(--color-brand-500)" }}></span>
                Daily Ledger & Activity
              </h3>
              <input type="date" className="input-field" style={{ width: "130px", padding: "4px 8px", fontSize: "12px" }} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
            </div>
            
            <p style={{ fontSize: "12px", color: "var(--color-slate-500)", marginBottom: "12px" }}>View historical transactions. Select a date above to scrub back in time.</p>

            <button className="btn-primary" style={{ background: "var(--color-accent-blue)", padding: "8px", width: "100%", fontSize: "12px", marginBottom: "12px" }} onClick={handleSyncUPI} disabled={isSyncing}>
              {isSyncing ? "Syncing with Bank..." : "Fetch New UPI Transactions (Today)"}
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto", paddingRight: "4px" }}>
              {dateTransactions.length > 0 ? dateTransactions.map(txn => (
                <div key={txn.transaction_id} style={{ fontSize: "12px", padding: "8px", background: "white", borderRadius: "6px", border: "1px solid var(--border-strong)", display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <strong style={{ color: "var(--color-slate-900)" }}>₹{txn.amount}</strong> from {txn.payer_name}
                    <div style={{ color: "var(--color-slate-500)", fontSize: "10px", marginTop: "2px" }}>{txn.payer_vpa}</div>
                    {txn.items_sold && (
                      <div style={{ color: "var(--color-brand-600)", fontSize: "11px", marginTop: "4px", fontWeight: "500" }}>
                        🛒 {txn.items_sold}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                    <span style={{ color: "var(--color-slate-500)", fontWeight: "500", fontSize: "10px" }}>
                      {new Date(txn.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <button onClick={() => { setModalData(txn); setActiveModal("receipt"); }} style={{ padding: "4px 8px", background: "var(--color-slate-100)", border: "1px solid var(--border-light)", borderRadius: "8px", cursor: "pointer", fontSize: "12px", display: "flex", gap: "4px", alignItems: "center" }}>
                      🖨️ Print
                    </button>
                  </div>
                </div>
              )) : (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--color-slate-400)", fontSize: "12px", background: "white", borderRadius: "8px", border: "1px dashed var(--border-light)" }}>
                  No transactions recorded for this date.
                </div>
              )}
            </div>
          </div>

          <h3 style={{ fontSize: "14px", color: "var(--color-slate-800)", marginBottom: "12px" }}>Manual Entry</h3>
          <form onSubmit={handleRecordSales}>
            <div className="input-group">
              <label>Units Sold Today</label>
              <input type="number" required className="input-field" value={todaySales} onChange={(e) => setTodaySales(e.target.value)} placeholder="e.g. 120" />
            </div>
            <div className="input-group">
              <label>Total Revenue (₹)</label>
              <input type="number" required className="input-field" value={todayRevenue} onChange={(e) => setTodayRevenue(e.target.value)} placeholder="e.g. 1500" />
            </div>
            <div className="input-group">
              <label>Current Remaining Stock</label>
              <input type="number" required className="input-field" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} placeholder="e.g. 20" />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: "10px" }} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Save & Generate Insights"}
            </button>
          </form>

          {salesHistory.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <h3 style={{ fontSize: "14px", color: "var(--color-slate-600)", marginBottom: "12px" }}>Recent History</h3>
              {salesHistory.slice(0, 3).map((sale, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "8px", borderBottom: "1px solid var(--border-strong)" }}>
                  <span>{new Date(sale.date).toLocaleDateString()}</span>
                  <strong>{sale.units_sold} units (₹{sale.revenue_amount})</strong>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* RIGHT MAIN CONTENT */}
        <main>
          {forecast ? (
            <div className="glass-panel" style={{ marginBottom: "24px" }}>
              <h2 className="panel-title">🤖 AI Business Insights for Tomorrow</h2>
              <div className="metrics-grid">
                <div className="metric-card">
                  <span className="metric-label">Predicted Demand</span>
                  <span className="metric-value highlight">{forecast.forecast_demand} units</span>
                </div>
                {inventoryPlan && (
                  <div className="metric-card">
                    <span className="metric-label">Recommended Purchase</span>
                    <span className="metric-value">{inventoryPlan.recommended_purchase} units</span>
                    {inventoryPlan.recommended_purchase > 0 && (
                      <button className="btn-secondary" style={{ marginTop: "12px", padding: "6px", fontSize: "12px", borderColor: "var(--color-brand-500)", color: "var(--color-brand-600)" }} onClick={() => handlePlaceOrder(inventoryPlan.recommended_purchase)} disabled={isOrdering}>
                        {isOrdering ? "Ordering..." : "⚡ Place Auto-Order"}
                      </button>
                    )}
                  </div>
                )}
                {financeAdvice && (
                  <div className="metric-card">
                    <span className="metric-label">Suggested Price</span>
                    <span className="metric-value highlight">₹{financeAdvice.suggested_price}</span>
                  </div>
                )}
                {financeAdvice && (
                  <div className="metric-card" style={{ gridColumn: "1 / -1", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <span className="metric-label">💰 Financial Health Tip</span>
                    <p style={{ fontSize: "14px", marginTop: "8px", fontWeight: "600", color: "var(--color-brand-600)" }}>
                      {financeAdvice.savings_tip} {financeAdvice.pricing_advice}
                    </p>
                  </div>
                )}
              </div>
              <p style={{ fontSize: "14px", color: "var(--color-slate-600)", lineHeight: 1.5 }}>
                Based on your recent sales pattern and {forecast.weather_adjustment_factor > 1 ? "positive" : "normal"} weather conditions, we expect a {forecast.forecast_demand > 100 ? "high" : "steady"} turnout tomorrow.
              </p>
            </div>
          ) : (
            <div className="glass-panel" style={{ marginBottom: "24px", textAlign: "center", padding: "40px" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>👋</div>
              <h3 style={{ color: "var(--color-slate-900)" }}>Welcome to your Dashboard</h3>
              <p style={{ color: "var(--color-slate-500)", fontSize: "14px", marginTop: "8px" }}>Record your first sale on the left to unlock AI predictions for tomorrow.</p>
            </div>
          )}

          {/* UNIFIED VENDOR HUB (TABBED) */}
          <div className="glass-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <h2 className="panel-title" style={{ margin: 0 }}>🏛️ Unified Vendor Hub</h2>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button className="badge-tag" style={{ cursor: "pointer", background: activeTab === 'schemes' ? 'var(--color-slate-900)' : 'var(--color-slate-200)', color: activeTab === 'schemes' ? 'white' : 'var(--color-slate-700)' }} onClick={() => setActiveTab('schemes')}>Gov Schemes</button>
                <button className="badge-tag" style={{ cursor: "pointer", background: activeTab === 'supply' ? 'var(--color-slate-900)' : 'var(--color-slate-200)', color: activeTab === 'supply' ? 'white' : 'var(--color-slate-700)' }} onClick={() => setActiveTab('supply')}>Sourcing</button>
                <button className="badge-tag" style={{ cursor: "pointer", background: activeTab === 'training' ? 'var(--color-slate-900)' : 'var(--color-slate-200)', color: activeTab === 'training' ? 'white' : 'var(--color-slate-700)' }} onClick={() => setActiveTab('training')}>Training</button>
                <button className="badge-tag" style={{ cursor: "pointer", background: activeTab === 'online' ? 'var(--color-slate-900)' : 'var(--color-slate-200)', color: activeTab === 'online' ? 'white' : 'var(--color-slate-700)' }} onClick={() => setActiveTab('online')}>Sell Online</button>
              </div>
            </div>

            <div className="hub-grid">
              
              {/* SCHEMES TAB */}
              {activeTab === 'schemes' && hubSchemes.map((scheme, idx) => (
                <div key={idx} className="hub-card">
                  <span className="badge-tag">{scheme.category}</span>
                  <h4>{scheme.title}</h4>
                  <p>{scheme.description}</p>
                  <strong style={{ fontSize: "13px", color: "var(--color-brand-600)", display: "block", marginBottom: "12px" }}>💰 {scheme.benefit}</strong>
                  <a href={scheme.apply_url} target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: "block", textAlign: "center", padding: "8px", fontSize: "13px", textDecoration: "none" }}>Apply Now</a>
                </div>
              ))}

              {/* SOURCING TAB */}
              {activeTab === 'supply' && (
                <>
                  {hubSuppliers.map((sup, idx) => (
                    <div key={`sup-${idx}`} className="hub-card" style={{ borderLeft: "4px solid var(--color-accent-blue)" }}>
                      <span className="badge-tag" style={{ background: "rgba(59, 130, 246, 0.1)", color: "var(--color-accent-blue)" }}>Wholesale Supplier</span>
                      <h4>{sup.name}</h4>
                      <p>Located at {sup.location_area}. Great for {sup.category.toLowerCase()}.</p>
                      <strong style={{ fontSize: "13px", color: "var(--color-slate-800)" }}>⭐ {sup.rating} | {sup.discount_info}</strong>
                    </div>
                  ))}
                  {/* Licensing Wizard inside Sourcing for space */}
                  {hubLicense && hubLicense.missing_licenses.length > 0 && (
                    <div className="hub-card" style={{ borderLeft: "4px solid var(--color-accent-amber)", background: "rgba(245, 158, 11, 0.02)" }}>
                      <span className="badge-tag" style={{ background: "rgba(245, 158, 11, 0.1)", color: "var(--color-accent-amber)" }}>Compliance Alert</span>
                      <h4>Missing: {hubLicense.missing_licenses.join(', ')}</h4>
                      <ul style={{ paddingLeft: "16px", marginTop: "8px", fontSize: "12px", color: "var(--color-slate-600)" }}>
                        {hubLicense.guide_steps.slice(0, 3).map((step, i) => <li key={i} style={{ marginBottom: "4px" }}>{step}</li>)}
                      </ul>
                      <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px", marginTop: "12px" }} onClick={() => setActiveModal("license")}>Start Application</button>
                    </div>
                  )}
                </>
              )}

              {/* TRAINING TAB */}
              {activeTab === 'training' && hubTraining.map((program, idx) => (
                <div key={`train-${idx}`} className="hub-card" style={{ borderLeft: "4px solid var(--color-accent-purple)" }}>
                  <span className="badge-tag" style={{ background: "rgba(139, 92, 246, 0.1)", color: "var(--color-accent-purple)" }}>{program.module_type}</span>
                  <h4>{program.title}</h4>
                  <p>{program.description}</p>
                  <strong style={{ fontSize: "12px", color: "var(--color-slate-500)", display: "block", marginBottom: "12px" }}>⏱️ {program.duration_mins} mins</strong>
                  <button className="btn-primary" style={{ padding: "8px", fontSize: "13px", background: "var(--color-accent-purple)" }} onClick={() => { setModalData(program); setActiveModal("training"); }}>Watch Video</button>
                </div>
              ))}

              {/* SELL ONLINE TAB */}
              {activeTab === 'online' && marketAccess?.online_channels.map((channel, idx) => (
                <div key={`chan-${idx}`} className="hub-card" style={{ borderLeft: "4px solid var(--color-brand-500)" }}>
                  <span className="badge-tag" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--color-brand-600)" }}>{channel.type}</span>
                  <h4>{channel.name}</h4>
                  <p>Status: <strong>{channel.status}</strong></p>
                  <button className="btn-secondary" style={{ padding: "8px", fontSize: "13px", marginTop: "12px" }} onClick={() => {
                    if (channel.action.includes("QR")) setActiveModal("qr");
                    else alert("Catalog Synced Successfully!");
                  }}>{channel.action}</button>
                </div>
              ))}

            </div>
          </div>

        </main>
      </div>

      {/* MODALS */}
      {activeModal === "orderSuccess" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: "center" }}>
            <button className="modal-close" onClick={() => setActiveModal(null)}>×</button>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
            <h3>Order Confirmed!</h3>
            <p style={{ color: "var(--color-slate-600)", marginBottom: "24px" }}>Your automated inventory order has been successfully placed with the supplier.</p>
            <button className="btn-primary" onClick={() => setActiveModal(null)}>Continue to Dashboard</button>
          </div>
        </div>
      )}

      {activeModal === "training" && modalData && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: "24px", maxWidth: "600px" }}>
            <button className="modal-close" onClick={() => setActiveModal(null)}>×</button>
            <h3 style={{ marginBottom: "8px" }}>{modalData.title}</h3>
            <span className="badge-tag" style={{ marginBottom: "16px", display: "inline-block" }}>{modalData.module_type}</span>
            <div style={{ width: "100%", height: "300px", borderRadius: "12px", overflow: "hidden", marginBottom: "16px", background: "black" }}>
              {modalData.video_url ? (
                <iframe width="100%" height="100%" src={modalData.video_url} title={modalData.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", color: "white" }}>
                  ▶️ Video Player Placeholder
                </div>
              )}
            </div>
            <p style={{ color: "var(--color-slate-600)", fontSize: "14px" }}>{modalData.description}</p>
            <button className="btn-primary" style={{ marginTop: "16px", width: "100%" }} onClick={() => setActiveModal(null)}>Mark as Completed</button>
          </div>
        </div>
      )}

      {activeModal === "qr" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: "center", padding: "40px" }}>
            <button className="modal-close" onClick={() => setActiveModal(null)}>×</button>
            <h3>Your Shop QR Code</h3>
            <p style={{ color: "var(--color-slate-500)", marginBottom: "24px", fontSize: "14px" }}>Customers can scan this to order from your WhatsApp shop directly.</p>
            <div style={{ width: "200px", height: "200px", margin: "0 auto", background: "white", padding: "16px", borderRadius: "16px", border: "1px solid var(--border-strong)" }}>
              {/* Fake QR using basic blocks for demo */}
              <div style={{ width: "100%", height: "100%", background: `repeating-conic-gradient(var(--color-slate-800) 0% 25%, transparent 0% 50%) 50% / 20px 20px` }}></div>
            </div>
            <button className="btn-primary" style={{ marginTop: "32px", width: "100%" }} onClick={() => setActiveModal(null)}>Download QR</button>
          </div>
        </div>
      )}

      {activeModal === "license" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveModal(null)}>×</button>
            <h3>FSSAI License Registration</h3>
            <p style={{ color: "var(--color-slate-500)", marginBottom: "24px", fontSize: "14px" }}>Fill out this quick form to automatically apply via the FoSCoS portal.</p>
            <div className="input-group">
              <label>Aadhaar / PAN Number</label>
              <input className="input-field" placeholder="e.g. 1234 5678 9012" />
            </div>
            <div className="input-group">
              <label>Upload Photo</label>
              <input type="file" className="input-field" style={{ padding: "8px" }} />
            </div>
            <div style={{ background: "rgba(59, 130, 246, 0.05)", padding: "12px", borderRadius: "8px", marginBottom: "24px", fontSize: "13px", color: "var(--color-slate-700)" }}>
              Fee: <strong>₹100</strong> (Will be deducted from linked UPI)
            </div>
            <button className="btn-primary" style={{ width: "100%" }} onClick={() => { alert("Application submitted to FSSAI!"); setActiveModal(null); }}>Pay & Submit Application</button>
          </div>
        </div>
      )}

      {activeModal === "receipt" && modalData && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)} style={{ background: "rgba(15,23,42,0.8)" }}>
          <div className="receipt-paper" onClick={e => e.stopPropagation()}>
            <div className="receipt-header">{vendor?.business_name || "Street Vendor"}</div>
            <div style={{ fontSize: "12px", marginBottom: "16px" }}>{vendor?.location || "India"}</div>
            
            <div className="receipt-divider"></div>
            
            <div style={{ fontSize: "12px", textAlign: "left", marginBottom: "12px" }}>
              <div>Date: {new Date(modalData.timestamp).toLocaleString()}</div>
              <div>Txn ID: {modalData.transaction_id}</div>
              <div>Mode: {modalData.payer_vpa === "CASH" ? "CASH" : "UPI"}</div>
            </div>

            <div className="receipt-divider"></div>
            
            <div style={{ textAlign: "left", marginBottom: "16px" }}>
              <strong style={{ fontSize: "14px" }}>ITEMS SOLD</strong>
              <div style={{ fontSize: "14px", marginTop: "4px", whiteSpace: "pre-wrap" }}>
                {modalData.items_sold ? modalData.items_sold.replace(/, /g, "\n") : "General Items"}
              </div>
            </div>

            <div className="receipt-divider"></div>
            
            <div className="receipt-item" style={{ fontSize: "18px", fontWeight: "bold" }}>
              <span>TOTAL</span>
              <span>₹{modalData.amount.toFixed(2)}</span>
            </div>
            
            <div className="receipt-divider"></div>
            
            <div style={{ fontSize: "12px", marginTop: "16px" }}>
              {modalData.payer_vpa === "CASH" ? "Thank you for paying by Cash!" : `Paid by: ${modalData.payer_name}`}
              <br/><br/>
              * Please visit again! *
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
