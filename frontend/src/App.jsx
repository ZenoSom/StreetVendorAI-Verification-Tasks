import {useEffect, useState } from "react";
import "./App.css";

function App() {
  const initialFormData = {
    name: "",
    mobile: "",
    location: "",
    business_name: "",
    business_type: "",
    products: "",
    monthly_income: "",
    has_upi: "No",
    has_bank_account: "No",
    has_license: "No",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [vendor, setVendor] = useState(null);
  const [yesterdaySales, setYesterdaySales] = useState("");
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  const [currentStock, setCurrentStock] = useState("");
  const [inventoryPlan, setInventoryPlan] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [showSchemes, setShowSchemes] = useState(false);
  const [activeService, setActiveService] = useState("");

  useEffect(() => {
    const savedVendor = localStorage.getItem("vendor");

    if (savedVendor) {
      setVendor(JSON.parse(savedVendor));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("vendor");
    setVendor(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("http://127.0.0.1:8000/vendors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formData,
        monthly_income:
          formData.monthly_income === ""
            ? null
            : Number(formData.monthly_income),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Registration failed");
    }

    console.log("Saved Vendor:", data);

    setVendor(data);

    localStorage.setItem("vendor", JSON.stringify(data));

    alert("Vendor registered successfully!");

  } catch (error) {
    console.error("Error:", error);
    alert("Unable to register vendor. Please check the backend.");
  }
};


// ---------------- DEMAND FORECAST ----------------

const getDemandForecast = async () => {
  if (!yesterdaySales) {
    alert("Please enter yesterday's sales.");
    return;
  }

  const getInventoryPlan = async () => {
  if (!forecast) {
    alert("Please generate today's demand forecast first.");
    return;
  }

  if (currentStock === "") {
    alert("Please enter your current stock.");
    return;
  }

  setInventoryLoading(true);

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/inventory",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          forecast_demand: Number(forecast.forecast_demand),
          current_stock: Number(currentStock),
          safety_stock: 5,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Inventory planning failed"
      );
    }

    setInventoryPlan(data);

  } catch (error) {
    console.error("Inventory error:", error);

    alert(
      "Unable to calculate inventory requirement."
    );

  } finally {
    setInventoryLoading(false);
  }
};

  setForecastLoading(true);

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/forecast",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          yesterday_sales: Number(yesterdaySales),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Forecast failed");
    }

    setForecast(data);

  } catch (error) {
    console.error("Forecast error:", error);
    alert("Unable to generate demand forecast.");
  } finally {
    setForecastLoading(false);
  }
};


const getInventoryPlan = async () => {
  if (!forecast) {
    alert("Please generate today's demand forecast first.");
    return;
  }

  if (currentStock === "") {
    alert("Please enter your current stock.");
    return;
  }

  setInventoryLoading(true);

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/inventory",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          forecast_demand: Number(forecast.forecast_demand),
          current_stock: Number(currentStock),
          safety_stock: 5,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Inventory planning failed");
    }

    setInventoryPlan(data);

  } catch (error) {
    console.error("Inventory error:", error);
    alert("Unable to calculate inventory requirement.");
  } finally {
    setInventoryLoading(false);
  }
};



  // ---------------- DASHBOARD ----------------

  if (vendor) {
    return (
      <div className="dashboard">

        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <h1>StreetVendorAI</h1>
            <p>Smart Business Dashboard</p>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </header>

        {/* WELCOME */}
        <section className="welcome-section">
          <h2>👋 Welcome, {vendor.name}</h2>
          <p>
            Here is your business overview and AI-powered assistance.
          </p>
        </section>

        {/* VENDOR INFORMATION */}
        <section className="vendor-profile card">
          <div className="section-title">
            <h2>👤 Vendor Information</h2>
            <span className="status active">● Active</span>
          </div>

          <div className="profile-grid">

            <div>
              <span>Vendor Name</span>
              <strong>{vendor.name}</strong>
            </div>

            <div>
              <span>Mobile</span>
              <strong>{vendor.mobile}</strong>
            </div>

            <div>
              <span>Business Name</span>
              <strong>{vendor.business_name}</strong>
            </div>

            <div>
              <span>Business Type</span>
              <strong>{vendor.business_type}</strong>
            </div>

            <div>
              <span>Location</span>
              <strong>{vendor.location}</strong>
            </div>

            <div>
              <span>Products / Services</span>
              <strong>{vendor.products}</strong>
            </div>

          </div>
        </section>

        {/* BUSINESS OVERVIEW */}
        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <span>Monthly Income</span>
            <h2>
              ₹{vendor.monthly_income || 0}
            </h2>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <span>Inventory Status</span>
            <h2>Good</h2>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <span>Today's Demand</span>
            <h2>145 Units</h2>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏛️</div>
            <span>Eligible Schemes</span>
            <h2>3</h2>
          </div>

        </section>

        {/* AI INSIGHTS */}
        {/* SALES & DEMAND FORECAST */}

<section className="card sales-forecast-card">

  <div className="section-title">
    <div>
      <h2>📊 Sales & Demand Forecast</h2>
      <p className="section-description">
        Enter yesterday's sales to estimate today's demand.
      </p>
    </div>

    <span className="ai-badge">
      AI Forecast
    </span>
  </div>

  <div className="sales-input-area">

    <div className="sales-input-box">

      <label>
        Yesterday's Sales
      </label>

      <div className="input-with-unit">

        <input
          type="number"
          min="0"
          placeholder="Example: 100"
          value={yesterdaySales}
          onChange={(e) => setYesterdaySales(e.target.value)}
        />

        <span>units</span>

      </div>

      <button
        className="forecast-btn"
        onClick={getDemandForecast}
        disabled={forecastLoading}
      >
        {forecastLoading
          ? "Generating..."
          : "Generate Forecast →"}
      </button>

    </div>


    <div className="forecast-result">

      <span className="forecast-label">
        TODAY'S EXPECTED DEMAND
      </span>

      <section className="inventory-card">

  <div className="card-header">
    <div>
      <span className="card-icon">📦</span>
      <h2>Inventory Planner</h2>
    </div>
  </div>

  <p className="card-description">
    Plan your stock based on today's AI demand forecast.
  </p>

  <div className="inventory-input">
    <label>Current Stock</label>

    <div className="input-with-unit">
      <input
        type="number"
        min="0"
        placeholder="Enter current stock"
        value={currentStock}
        onChange={(e) => setCurrentStock(e.target.value)}
      />
      <span>units</span>
    </div>
  </div>

  <button
    className="inventory-btn"
    onClick={getInventoryPlan}
    disabled={inventoryLoading}
  >
    {inventoryLoading
      ? "Calculating..."
      : "Calculate Stock Requirement →"}
  </button>

  {inventoryPlan && (
    <div className="inventory-result">

      <span>RECOMMENDED PURCHASE</span>

      <strong>
        {inventoryPlan.recommended_purchase}
      </strong>

      <p>units</p>

      <div className="inventory-message">
        {inventoryPlan.message}
      </div>

    </div>
  )}

</section>

      {forecast ? (
        <>
          <div className="forecast-number">
            {forecast.forecast_demand}
          </div>

          <p>
            units expected today
          </p>

          <div className="forecast-message">
            📈 Demand is expected to increase based on
            yesterday's sales.
          </div>
        </>
      ) : (
        <>
          <div className="forecast-placeholder">
            —
          </div>

          <p>
            Enter sales data to generate forecast
          </p>
        </>
      )}

    </div>

  </div>

</section>
        <section className="card">

          <div className="section-title">
            <h2>🤖 AI Business Insights</h2>
            <span className="ai-badge">AI Powered</span>
          </div>

          <div className="insights-grid">

            <div className="insight-card">
              <div className="insight-icon">📊</div>
              <h3>Demand Forecast</h3>
              <p>
                Expected demand for today
              </p>
              <strong>145 units</strong>
            </div>

            <div className="insight-card">
              <div className="insight-icon">📦</div>
              <h3>Inventory Planner</h3>
              <p>
                Recommended stock purchase
              </p>
              <strong>+20 units</strong>
            </div>

            <div className="insight-card">
              <div className="insight-icon">💵</div>
              <h3>Financial Assistant</h3>
              <p>
                Suggested selling price
              </p>
              <strong>₹95 / unit</strong>
            </div>

          </div>

        </section>

        {/* GOVERNMENT SCHEMES */}
        <section className="scheme-card">

          <div>
            <span className="scheme-label">
              GOVERNMENT SUPPORT
            </span>

            <h2>🏛️ Government Scheme Navigator</h2>

            <p>
              Discover government schemes and business support
              programs that may be suitable for your business.
            </p>
          </div>

          <button className="scheme-btn">
            onClick={() => setShowSchemes((visible) => !visible)}

            {showSchemes ? "Hide Schemes ↑" : "Explore Schemes →"}
          </button>

        </section>


        <section className="card">

          <div className="section-title">
            <h2>📱 Vendor Services</h2>
          </div>

          <div className="services-grid">

            <div className="service">
              📱
              <strong>Mobile App</strong>
              <span>View business insights</span>
            </div>

            <div className="service">
              💬
              <strong>SMS Alerts</strong>
              <span>Receive important updates</span>
            </div>

            <div className="service">
              🎙️
              <strong>Voice Assistant</strong>
              <span>Get insights through voice</span>
            </div>

          </div>

        </section>

      </div>
    );
  }

  // ---------------- REGISTRATION ----------------

  return (
    <div className="app">

      <div className="registration-card">

        <div className="header">
          <h1>StreetVendorAI</h1>
          <p>Empowering Street Vendors Through Technology</p>
        </div>

        <h2>Vendor Registration</h2>

        <p className="subtitle">
          Create your digital vendor profile
        </p>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Vendor Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <input
              type="tel"
              name="mobile"
              placeholder="Enter mobile number"
              value={formData.mobile}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              placeholder="City / Area"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Business Name</label>
            <input
              type="text"
              name="business_name"
              placeholder="Example: Ramesh Samosa Centre"
              value={formData.business_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Business Type</label>

            <select
              name="business_type"
              value={formData.business_type}
              onChange={handleChange}
              required
            >
              <option value="">Select business type</option>
              <option value="Food Vendor">Food Vendor</option>
              <option value="Fruit & Vegetable Vendor">
                Fruit & Vegetable Vendor
              </option>
              <option value="Clothing Vendor">
                Clothing Vendor
              </option>
              <option value="Handicraft Vendor">
                Handicraft Vendor
              </option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Products / Services</label>

            <input
              type="text"
              name="products"
              placeholder="Example: Samosa, Tea, Kachori"
              value={formData.products}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Monthly Income (₹)</label>

            <input
              type="number"
              name="monthly_income"
              placeholder="Enter approximate monthly income"
              value={formData.monthly_income}
              onChange={handleChange}
            />
          </div>

          <div className="option-section">

            <div className="form-group">
              <label>UPI Available?</label>

              <select
                name="has_upi"
                value={formData.has_upi}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-group">
              <label>Bank Account?</label>

              <select
                name="has_bank_account"
                value={formData.has_bank_account}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-group">
              <label>Vending License?</label>

              <select
                name="has_license"
                value={formData.has_license}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

          </div>

          <button type="submit">
            Register Vendor →
          </button>

        </form>

      </div>

    </div>
  );
}

export default App;
