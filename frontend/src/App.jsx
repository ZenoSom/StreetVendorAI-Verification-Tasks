import { useEffect, useState } from "react";
import "./App.css";

const DEMO_VENDORS = [
  {
    name: "Ramesh Kumar",
    mobile: "9876543210",
    location: "Connaught Place, New Delhi",
    business_name: "Ramesh Special Tea & Snacks",
    business_type: "Food Vendor",
    products: "Tea, Samosa, Kachori",
    monthly_income: 18000,
    has_upi: true,
    has_bank_account: true,
    has_license: true,
  },
  {
    name: "Sunita Devi",
    mobile: "9812345678",
    location: "Dadar Market, Mumbai",
    business_name: "Fresh Seasons Fruit Cart",
    business_type: "Fruit & Vegetable Vendor",
    products: "Bananas, Apples, Mangoes",
    monthly_income: 22000,
    has_upi: true,
    has_bank_account: true,
    has_license: false,
  }
];

const VOICE_LANGUAGES = [
  { code: "en-IN", name: "English (India)" },
  { code: "hi-IN", name: "Hindi (हिन्दी)" },
  { code: "mr-IN", name: "Marathi (मराठी)" },
  { code: "ta-IN", name: "Tamil (தமிழ்)" },
];

function App() {
  const initialFormData = {
    name: "",
    mobile: "",
    location: "",
    business_name: "",
    business_type: "",
    products: "",
    monthly_income: "",
    has_upi: "Yes",
    has_bank_account: "Yes",
    has_license: "No",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [vendor, setVendor] = useState(null);

  // Real Database Persistence States
  const [salesHistory, setSalesHistory] = useState([]);
  const [ordersHistory, setOrdersHistory] = useState([]);

  // Workflow states
  const [yesterdaySales, setYesterdaySales] = useState("100");
  const [isAutoRecording, setIsAutoRecording] = useState(false);

  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  const [currentStock, setCurrentStock] = useState("20");
  const [inventoryPlan, setInventoryPlan] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  const [costPrice, setCostPrice] = useState("40");
  const [targetMargin, setTargetMargin] = useState(35);
  const [financeData, setFinanceData] = useState(null);
  const [financeLoading, setFinanceLoading] = useState(false);

  const [marketData, setMarketData] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);

  const [deliveryChannel, setDeliveryChannel] = useState("mobile"); // mobile, sms, voice
  const [deliveryData, setDeliveryData] = useState(null);
  const [selectedVoiceLang, setSelectedVoiceLang] = useState("en-IN");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  useEffect(() => {
    const savedVendor = localStorage.getItem("vendor");
    if (savedVendor) {
      const parsed = JSON.parse(savedVendor);
      setVendor(parsed);
    } else {
      registerDefaultDemoVendor(DEMO_VENDORS[0]);
    }
  }, []);

  useEffect(() => {
    if (vendor && vendor.id) {
      fetchVendorSalesHistory(vendor.id);
      fetchVendorOrders(vendor.id);
      fetchMarketAccess();
    }
  }, [vendor]);

  const registerDefaultDemoVendor = async (demo) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demo),
      });
      const data = await res.json();
      setVendor(data);
      localStorage.setItem("vendor", JSON.stringify(data));
    } catch (e) {
      setVendor(demo);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vendor");
    setVendor(null);
    setForecast(null);
    setInventoryPlan(null);
    setFinanceData(null);
    setSalesHistory([]);
    setOrdersHistory([]);
  };

  const loadDemoVendor = async (demo) => {
    await registerDefaultDemoVendor(demo);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        monthly_income: formData.monthly_income ? Number(formData.monthly_income) : 0,
        has_upi: formData.has_upi === "Yes",
        has_bank_account: formData.has_bank_account === "Yes",
        has_license: formData.has_license === "Yes",
      };

      const response = await fetch("http://127.0.0.1:8000/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Registration failed");

      setVendor(data);
      localStorage.setItem("vendor", JSON.stringify(data));
      alert("Vendor profile created successfully in SQLite Database!");
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed. Please check backend connection.");
    }
  };

  // Real Database Persistence: Fetch Past Sales & Orders
  const fetchVendorSalesHistory = async (vendorId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/sales/${vendorId}`);
      if (res.ok) {
        const data = await res.json();
        setSalesHistory(data);
      }
    } catch (e) {
      console.error("Fetch sales error:", e);
    }
  };

  const fetchVendorOrders = async (vendorId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/orders/${vendorId}`);
      if (res.ok) {
        const data = await res.json();
        setOrdersHistory(data);
      }
    } catch (e) {
      console.error("Fetch orders error:", e);
    }
  };

  // Stage 1 & 2: Sales Logging & Statistical ML Demand Forecast
  const autoRecordSalesFromUPI = async () => {
    setIsAutoRecording(true);
    const simulatedUpiSales = Math.floor(Math.random() * 40) + 110;
    setYesterdaySales(simulatedUpiSales.toString());

    // Save entry into SQLite DB
    if (vendor && vendor.id) {
      try {
        await fetch("http://127.0.0.1:8000/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendor_id: vendor.id,
            units_sold: simulatedUpiSales,
            revenue_amount: simulatedUpiSales * Number(costPrice || 40) * 1.35,
            is_auto_recorded: true,
          }),
        });
        fetchVendorSalesHistory(vendor.id);
      } catch (e) {
        console.error("Save sales record error:", e);
      }
    }

    setTimeout(() => {
      setIsAutoRecording(false);
      getDemandForecast(simulatedUpiSales, true);
    }, 600);
  };

  const getDemandForecast = async (salesVal = yesterdaySales, isAuto = false) => {
    if (!salesVal) {
      alert("Please enter yesterday's sales.");
      return;
    }
    setForecastLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendor?.id || null,
          yesterday_sales: Number(salesVal),
          auto_record: isAuto,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Forecast failed");

      setForecast(data);

      if (currentStock !== "") {
        calculateInventory(data.forecast_demand);
      }
      calculateFinance(data.forecast_demand);

    } catch (error) {
      console.error("Forecast error:", error);
      alert("Unable to generate demand forecast.");
    } finally {
      setForecastLoading(false);
    }
  };

  // Stage 3: Inventory Planner & Restock Purchase Orders
  const calculateInventory = async (forecastDemandVal = forecast?.forecast_demand) => {
    if (!forecastDemandVal) {
      alert("Please generate today's demand forecast first.");
      return;
    }

    setInventoryLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendor?.id || null,
          forecast_demand: Number(forecastDemandVal),
          current_stock: Number(currentStock || 0),
          safety_stock: 5,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Inventory calculation failed");

      setInventoryPlan(data);
    } catch (error) {
      console.error("Inventory error:", error);
      alert("Unable to calculate inventory requirements.");
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleOrderSupplier = async (supplierName, qty = inventoryPlan?.recommended_purchase || 50) => {
    if (!vendor || !vendor.id) {
      alert("Please select or register a vendor first.");
      return;
    }

    setOrderSubmitting(true);
    try {
      const unitCost = Number(costPrice || 40);
      const res = await fetch("http://127.0.0.1:8000/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendor.id,
          supplier_name: supplierName,
          item_name: vendor.products.split(",")[0] || "Restock Supplies",
          quantity: Number(qty),
          total_cost: Number(qty) * unitCost,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`✅ Purchase Order #${data.id} placed with ${supplierName}! Saved in SQLite Database.`);
        fetchVendorOrders(vendor.id);
      }
    } catch (e) {
      console.error("Order creation error:", e);
      alert("Unable to place purchase order.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Stage 4: Financial Assistant
  const calculateFinance = async (dailyUnitsVal = forecast?.forecast_demand || 100) => {
    setFinanceLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cost_per_unit: Number(costPrice || 40),
          target_margin_pct: Number(targetMargin || 35),
          daily_sales_units: Number(dailyUnitsVal),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Financial calculation failed");

      setFinanceData(data);
      triggerDeliveryInsights(data);

    } catch (error) {
      console.error("Finance error:", error);
    } finally {
      setFinanceLoading(false);
    }
  };

  // Stage 5: Market Access & Schemes
  const fetchMarketAccess = async () => {
    setMarketLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/market-access?business_type=${encodeURIComponent(vendor?.business_type || "Food")}`);
      const data = await response.json();
      if (response.ok) {
        setMarketData(data);
      }
    } catch (error) {
      console.error("Market access fetch error:", error);
    } finally {
      setMarketLoading(false);
    }
  };

  // Stage 6: Multi-Channel Insights & Multi-Language Voice Bot
  const triggerDeliveryInsights = async (fin = financeData) => {
    if (!vendor) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/delivery/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_name: vendor.name,
          forecast_demand: forecast?.forecast_demand || 110,
          recommended_purchase: inventoryPlan?.recommended_purchase || 95,
          suggested_price: fin?.suggested_price || 54,
          daily_savings: fin?.daily_savings_recommendation || 210,
          channel: deliveryChannel,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setDeliveryData(data);
      }
    } catch (error) {
      console.error("Delivery insights error:", error);
    }
  };

  const handleSpeakVoiceReport = () => {
    if (!deliveryData?.voice_script) return;

    if ("speechSynthesis" in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(deliveryData.voice_script);
      utterance.lang = selectedVoiceLang;
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Voice speech synthesis is not supported on this browser.");
    }
  };

  // If vendor logged in, show Dashboard
  if (vendor) {
    return (
      <div className="dashboard-container">
        {/* TOP NAVBAR */}
        <header className="navbar">
          <div className="brand-wrapper">
            <div className="brand-badge-icon">🛒</div>
            <div>
              <h1 className="brand-title">StreetVendorAI</h1>
              <span className="brand-tagline">AI Platform for Street Vendors • Real SQLite & ML Engine</span>
            </div>
          </div>

          <div className="user-nav-actions">
            <span className="location-pill">📍 {vendor.location}</span>
            <div className="vendor-chip">
              <span>👤</span>
              <span>{vendor.name}</span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* DEMO SWITCHER BAR */}
        <div className="demo-bar">
          <span>💡 Registered Profiles (DB Persisted):</span>
          {DEMO_VENDORS.map((v, idx) => (
            <button
              key={idx}
              className={`demo-pill-btn ${vendor.name === v.name ? "active" : ""}`}
              onClick={() => loadDemoVendor(v)}
            >
              {v.name} ({v.business_type})
            </button>
          ))}
        </div>

        {/* WORKFLOW STEPPER TRACKER */}
        <section className="workflow-stepper">
          <div className="step-card completed">
            <div className="step-num">1</div>
            <span>Sales History</span>
          </div>
          <div className={`step-card ${forecast ? "completed" : "active"}`}>
            <div className="step-num">2</div>
            <span>ML Forecast</span>
          </div>
          <div className={`step-card ${inventoryPlan ? "completed" : ""}`}>
            <div className="step-num">3</div>
            <span>Inventory & Orders</span>
          </div>
          <div className={`step-card ${financeData ? "completed" : ""}`}>
            <div className="step-num">4</div>
            <span>Pricing & Savings</span>
          </div>
          <div className={`step-card ${marketData ? "completed" : ""}`}>
            <div className="step-num">5</div>
            <span>Market & Schemes</span>
          </div>
          <div className={`step-card ${deliveryData ? "completed" : ""}`}>
            <div className="step-num">6</div>
            <span>Voice Bot Delivery</span>
          </div>
        </section>

        {/* MAIN DASHBOARD LAYOUT */}
        <main className="dashboard-layout">
          
          {/* STAGE 1 & 2: SALES LOGGING & ML FORECASTING */}
          <section className="ui-card ui-card-hero">
            <div className="card-header-flex">
              <div className="card-title-group">
                <h2>📊 Stage 1 & 2: Sales Logging & ML Demand Forecast</h2>
                <p className="card-subtitle">Exponential Smoothing model combining DB history + Live Weather API signals.</p>
              </div>
              <span className="badge-pill badge-ai">⚡ ML Engine</span>
            </div>

            <div className="forecast-layout-grid">
              <div className="form-group-custom">
                <label>Yesterday's Sales (Units)</label>
                <div className="input-group-row">
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    placeholder="e.g. 100"
                    value={yesterdaySales}
                    onChange={(e) => setYesterdaySales(e.target.value)}
                  />
                  <button
                    className="btn-blue"
                    onClick={autoRecordSalesFromUPI}
                    disabled={isAutoRecording}
                  >
                    {isAutoRecording ? "Saving to DB..." : "📲 Auto-Record (UPI & DB)"}
                  </button>
                </div>
                <div className="preset-row">
                  <span>Quick Presets:</span>
                  {[80, 100, 150, 200].map((preset) => (
                    <button key={preset} className="chip-btn" onClick={() => setYesterdaySales(preset.toString())}>
                      {preset} units
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  className="btn-emerald btn-full"
                  onClick={() => getDemandForecast()}
                  disabled={forecastLoading}
                >
                  {forecastLoading ? "Running ML Model..." : "✨ Calculate ML Forecast →"}
                </button>
              </div>
            </div>

            {/* FORECAST HERO RESULT BANNER */}
            {forecast && (
              <div className="forecast-hero-result">
                <div className="forecast-metric-card">
                  <span className="metric-title">EXPECTED TODAY DEMAND</span>
                  <div className="metric-val-num">{forecast.forecast_demand} <span style={{ fontSize: '15px', color: '#94a3b8' }}>Units</span></div>
                  <span className="metric-accuracy">Accuracy Confidence: {forecast.confidence}</span>
                </div>

                <div className="forecast-info-content">
                  <div className="weather-badge-pill">🌤️ Live Weather: {forecast.weather?.condition || "Clear"} ({forecast.weather?.temperature_c || 28}°C)</div>
                  <p className="forecast-desc"><strong>Model Insights:</strong> {forecast.trend}</p>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginTop: '6px' }}>{forecast.message}</span>
                </div>
              </div>
            )}

            {/* PERSISTED SALES LOGS */}
            {salesHistory.length > 0 && (
              <div style={{ marginTop: '20px', background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--color-brand-500)' }}>📁 Persisted Sales Logs in SQLite ({salesHistory.length} Entries):</h4>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
                  {salesHistory.slice(0, 5).map((log) => (
                    <div key={log.id} style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', minWidth: '130px' }}>
                      <div><strong>{log.units_sold} Units</strong></div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>{log.weather_condition} • {log.temperature_c}°C</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* STAGE 3: INVENTORY PLANNER & ORDERS */}
          <section className="ui-card">
            <div className="card-header-flex">
              <div className="card-title-group">
                <h2>📦 Stage 3: Inventory Planner & Orders</h2>
                <p className="card-subtitle">Calculates restocking requirements & saves purchase orders to SQLite DB.</p>
              </div>
              <span className="badge-pill badge-stock">Inventory DB</span>
            </div>

            <div className="inventory-action-flex">
              <div className="form-group-custom">
                <label>Current Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="Enter current stock"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                />
              </div>

              <button
                className="btn-emerald"
                onClick={() => calculateInventory()}
                disabled={inventoryLoading}
              >
                {inventoryLoading ? "Planning..." : "Calculate Stock →"}
              </button>
            </div>

            {inventoryPlan && (
              <div className="inventory-result-card">
                <div className="inv-qty-display">
                  <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1px', color: '#60a5fa' }}>RECOMMENDED PURCHASE</span>
                  <div className="inv-num">+{inventoryPlan.recommended_purchase} <span style={{ fontSize: '14px', color: '#94a3b8' }}>Units</span></div>
                </div>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 12px 0' }}>{inventoryPlan.message}</p>
                
                {inventoryPlan.recommended_purchase > 0 && (
                  <div className="reorder-supplier-banner">
                    <span>⚡ Place restock order to wholesale mandi:</span>
                    <button
                      className="btn-subtle"
                      onClick={() => handleOrderSupplier("Central Wholesale Mandi")}
                      disabled={orderSubmitting}
                    >
                      {orderSubmitting ? "Placing..." : "🛒 Save Order to DB"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {ordersHistory.length > 0 && (
              <div style={{ marginTop: '16px', background: 'rgba(15,23,42,0.5)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#60a5fa' }}>📋 Placed Purchase Orders (SQLite DB):</h4>
                {ordersHistory.slice(0, 3).map((ord) => (
                  <div key={ord.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span>Order #{ord.id}: {ord.quantity} units ({ord.supplier_name})</span>
                    <span style={{ color: '#34d399', fontWeight: 600 }}>● {ord.status}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* STAGE 4: FINANCIAL ASSISTANT */}
          <section className="ui-card">
            <div className="card-header-flex">
              <div className="card-title-group">
                <h2>💵 Stage 4: Financial Assistant & Savings</h2>
                <p className="card-subtitle">Optimal unit pricing, daily profit breakdown, and scheme savings goals.</p>
              </div>
              <span className="badge-pill badge-finance">Finance AI</span>
            </div>

            <div className="finance-slider-grid">
              <div className="form-group-custom">
                <label>Cost Price / Unit (₹)</label>
                <input
                  type="number"
                  className="input-field"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>

              <div className="form-group-custom">
                <label>Target Margin: {targetMargin}%</label>
                <input
                  type="range"
                  min="15"
                  max="60"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(e.target.value)}
                  style={{ width: '100%', marginTop: '10px' }}
                />
              </div>

              <button
                className="btn-emerald"
                onClick={() => calculateFinance()}
                disabled={financeLoading}
              >
                {financeLoading ? "Updating..." : "Recalculate"}
              </button>
            </div>

            {financeData && (
              <div className="finance-metrics-four">
                <div className="fin-metric-tile">
                  <span className="tile-label">Suggested Price</span>
                  <div className="tile-value">₹{financeData.suggested_price}</div>
                </div>
                <div className="fin-metric-tile">
                  <span className="tile-label">Daily Est. Revenue</span>
                  <div className="tile-value">₹{financeData.expected_daily_revenue}</div>
                </div>
                <div className="fin-metric-tile">
                  <span className="tile-label">Est. Net Profit</span>
                  <div className="tile-value profit">₹{financeData.expected_daily_profit}</div>
                </div>
                <div className="fin-metric-tile highlight">
                  <span className="tile-label">Daily Savings Goal</span>
                  <div className="tile-value savings">₹{financeData.daily_savings_recommendation}</div>
                </div>

                <div className="fin-advice-box">
                  <p style={{ margin: '0 0 4px 0' }}>💡 <strong>Pricing Strategy:</strong> {financeData.pricing_advice}</p>
                  <p style={{ margin: 0 }}>🎯 <strong>Savings Action:</strong> {financeData.savings_tip}</p>
                </div>
              </div>
            )}
          </section>

          {/* STAGE 5: MARKET ACCESS & SCHEMES */}
          <section className="ui-card full-span">
            <div className="card-header-flex">
              <div className="card-title-group">
                <h2>🏛️ Stage 5: Market Access & Government Scheme Navigator</h2>
                <p className="card-subtitle">Discover micro-credit loans, local supply chains, and online market channels.</p>
              </div>
              <span className="badge-pill badge-gov">Government Certified</span>
            </div>

            {marketLoading ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Loading schemes...</div>
            ) : marketData ? (
              <div>
                <div className="schemes-cards-grid">
                  {marketData.schemes.map((scheme, idx) => (
                    <div key={idx} className="scheme-card-item">
                      <div>
                        <span className="scheme-tag">{scheme.category}</span>
                        <h3>{scheme.title}</h3>
                        <p>{scheme.description}</p>
                        <div className="scheme-benefit-text">💰 {scheme.benefit}</div>
                        <div className="scheme-elig-text">📋 Eligibility: {scheme.eligibility}</div>
                      </div>
                      <a
                        href={scheme.apply_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-scheme-link"
                      >
                        Apply for Scheme →
                      </a>
                    </div>
                  ))}
                </div>

                <div className="suppliers-channels-grid">
                  <div className="sub-panel">
                    <h3>🏬 Nearby Wholesale Mandis & Suppliers</h3>
                    {marketData.local_suppliers.map((sup, idx) => (
                      <div key={idx} className="supplier-item-row">
                        <div>
                          <strong>{sup.name}</strong> ({sup.category})
                          <br />
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>📍 {sup.distance} away | 🎁 {sup.discount}</span>
                        </div>
                        <button className="btn-subtle" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => handleOrderSupplier(sup.name, 40)}>
                          Connect
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="sub-panel">
                    <h3>🌐 Online Marketplaces & Delivery</h3>
                    {marketData.online_channels.map((chan, idx) => (
                      <div key={idx} className="channel-item-row">
                        <div>
                          <strong>{chan.name}</strong>
                          <br />
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Type: {chan.type} | Status: {chan.status}</span>
                        </div>
                        <button className="btn-blue" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => alert(`Starting onboarding for ${chan.name}...`)}>
                          {chan.action}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          {/* STAGE 6: MULTI-CHANNEL VOICE BOT */}
          <section className="ui-card full-span">
            <div className="card-header-flex">
              <div className="card-title-group">
                <h2>📱 Stage 6: Multi-Channel Voice Bot & Insights</h2>
                <p className="card-subtitle">Access business recommendations via Mobile App, SMS alert, or Voice Bot in Indian languages.</p>
              </div>
              <div className="channel-tabs-bar">
                <button
                  className={`tab-btn ${deliveryChannel === "mobile" ? "active" : ""}`}
                  onClick={() => {
                    setDeliveryChannel("mobile");
                    triggerDeliveryInsights();
                  }}
                >
                  📱 Mobile App
                </button>
                <button
                  className={`tab-btn ${deliveryChannel === "sms" ? "active" : ""}`}
                  onClick={() => {
                    setDeliveryChannel("sms");
                    triggerDeliveryInsights();
                  }}
                >
                  💬 SMS Alert
                </button>
                <button
                  className={`tab-btn ${deliveryChannel === "voice" ? "active" : ""}`}
                  onClick={() => {
                    setDeliveryChannel("voice");
                    triggerDeliveryInsights();
                  }}
                >
                  🎙️ Voice Assistant
                </button>
              </div>
            </div>

            <div className="channel-stage-display">
              {deliveryChannel === "mobile" && (
                <div className="mobile-device-frame">
                  <div className="device-header">📱 StreetVendorAI Companion</div>
                  <div className="device-card-item">
                    <strong>Today's Target Sales:</strong> {forecast?.forecast_demand || 110} Units
                  </div>
                  <div className="device-card-item">
                    <strong>Restock Needed:</strong> {inventoryPlan?.recommended_purchase || 95} Units
                  </div>
                  <div className="device-card-item">
                    <strong>Selling Price:</strong> ₹{financeData?.suggested_price || 54} / unit
                  </div>
                  <div className="device-card-item gold">
                    <strong>Daily Savings Goal:</strong> ₹{financeData?.daily_savings_recommendation || 210}
                  </div>
                </div>
              )}

              {deliveryChannel === "sms" && (
                <div className="sms-phone-mockup">
                  <div className="sms-header-text">📩 Incoming SMS Alert</div>
                  <div className="sms-bubble-content">
                    {deliveryData?.sms_text || "Generating SMS notification..."}
                  </div>
                  <button className="btn-subtle" onClick={() => alert("Simulated SMS sent to " + vendor.mobile)}>
                    📲 Send SMS Alert to Vendor
                  </button>
                </div>
              )}

              {deliveryChannel === "voice" && (
                <div className="voice-bot-card">
                  <div className={`soundwave-bars ${isSpeaking ? "speaking" : ""}`}>
                    <div className="soundwave-bar"></div>
                    <div className="soundwave-bar"></div>
                    <div className="soundwave-bar"></div>
                    <div className="soundwave-bar"></div>
                    <div className="soundwave-bar"></div>
                  </div>

                  <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '8px' }}>Voice Assistant Audio Report</h3>

                  <div style={{ margin: '12px 0 16px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '13px', color: '#94a3b8' }}>Voice Accent / Language:</label>
                    <select
                      value={selectedVoiceLang}
                      onChange={(e) => setSelectedVoiceLang(e.target.value)}
                      className="input-field"
                      style={{ padding: '6px 12px', fontSize: '13px', width: 'auto' }}
                    >
                      {VOICE_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="voice-script-quote">
                    "{deliveryData?.voice_script || "Generating voice script..."}"
                  </p>
                  <button className="btn-play-voice" onClick={handleSpeakVoiceReport}>
                    {isSpeaking ? "⏹️ Stop Voice Report" : "▶️ Play Voice Report (Audio)"}
                  </button>
                  <span style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>Empowering low-literacy street vendors with real browser audio synthesis.</span>
                </div>
              )}
            </div>
          </section>

        </main>
      </div>
    );
  }

  // REGISTRATION FORM VIEW
  return (
    <div className="registration-wrapper">
      <div className="registration-card-box">
        <div className="reg-brand-head">
          <span className="reg-icon">🛒</span>
          <h1>StreetVendorAI</h1>
          <p>Digital Platform for Street Vendor Empowerment</p>
        </div>

        <form onSubmit={handleRegisterSubmit}>
          <div className="form-group-custom">
            <label>Vendor Full Name *</label>
            <input
              type="text"
              name="name"
              className="input-field"
              placeholder="e.g. Ramesh Kumar"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid-two-cols">
            <div className="form-group-custom">
              <label>Mobile Number *</label>
              <input
                type="tel"
                name="mobile"
                className="input-field"
                placeholder="10-digit mobile number"
                value={formData.mobile}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group-custom">
              <label>Location / City *</label>
              <input
                type="text"
                name="location"
                className="input-field"
                placeholder="e.g. Connaught Place, New Delhi"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid-two-cols">
            <div className="form-group-custom">
              <label>Business Name *</label>
              <input
                type="text"
                name="business_name"
                className="input-field"
                placeholder="e.g. Ramesh Samosa & Tea Stall"
                value={formData.business_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group-custom">
              <label>Business Type *</label>
              <select
                name="business_type"
                className="input-field"
                value={formData.business_type}
                onChange={handleChange}
                required
              >
                <option value="">Select business type</option>
                <option value="Food Vendor">Food Vendor</option>
                <option value="Fruit & Vegetable Vendor">Fruit & Vegetable Vendor</option>
                <option value="Clothing Vendor">Clothing Vendor</option>
                <option value="Handicraft Vendor">Handicraft Vendor</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group-custom">
            <label>Products / Items Sold *</label>
            <input
              type="text"
              name="products"
              className="input-field"
              placeholder="e.g. Tea, Samosa, Kachori"
              value={formData.products}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid-three-cols">
            <div className="form-group-custom">
              <label>UPI Available?</label>
              <select name="has_upi" className="input-field" value={formData.has_upi} onChange={handleChange}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-group-custom">
              <label>Bank Account?</label>
              <select name="has_bank_account" className="input-field" value={formData.has_bank_account} onChange={handleChange}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-group-custom">
              <label>Vending License?</label>
              <select name="has_license" className="input-field" value={formData.has_license} onChange={handleChange}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-emerald btn-full" style={{ marginTop: '10px' }}>
            Register Vendor & Start Real DB Session →
          </button>
        </form>

        <div className="shortcut-demo-footer">
          <p>Or launch directly with a demo vendor profile:</p>
          <div className="demo-pill-group">
            {DEMO_VENDORS.map((demo, idx) => (
              <button key={idx} className="btn-subtle" onClick={() => loadDemoVendor(demo)}>
                👤 Load {demo.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;



