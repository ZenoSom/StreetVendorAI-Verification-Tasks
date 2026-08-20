import { useState } from "react";
import "./App.css";

function App() {
  const [formData, setFormData] = useState({
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
  });

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

    alert("Vendor registered successfully!");

    console.log("Saved Vendor:", data);

    setFormData({
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
    });

  } catch (error) {
    console.error("Error:", error);
    alert("Unable to register vendor. Please check the backend.");
  }
};
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
              <option value="Clothing Vendor">Clothing Vendor</option>
              <option value="Handicraft Vendor">Handicraft Vendor</option>
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
            Register Vendor
          </button>

        </form>
      </div>
    </div>
  );
}

export default App;