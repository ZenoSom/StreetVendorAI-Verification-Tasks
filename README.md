<div align="center">
  <h1>🛒 StreetVendor AI</h1>
  <p><i>Empowering Micro-Entrepreneurs by Centralizing Operations, Finance, and Compliance</i></p>
</div>

---

## 🚨 The Problem

In India, street vendors form the backbone of local commerce. However, they face a massive operational hurdle: **Information and operations are entirely scattered.** 

*"Ek street vendor ko अलग-अलग काम के लिए अलग जगह जाना पड़ता है..."* 
(A street vendor has to go to different places for different tasks...)

- **Finance:** Managing daily cash and UPI transactions manually is chaotic.
- **Sourcing:** Finding reliable, affordable wholesale suppliers relies strictly on word-of-mouth.
- **Compliance & Support:** Applying for government schemes (like PM SVANidhi) or FSSAI licenses involves navigating complex, scattered government portals.
- **Skill Development:** Learning modern business practices (like WhatsApp marketing or digital payments) is inaccessible.

## 💡 The Solution

**StreetVendor AI** is a unified, intelligent platform designed specifically for micro-entrepreneurs. It brings every aspect of a street vendor's daily business into a single, beautifully designed, and easy-to-use dashboard. 

Instead of juggling multiple apps and physical ledgers, vendors can now manage their entire business lifecycle from one place.

---

## ✨ Key Features

### 1. 📊 Unified Activity Log & Live Sync
- **Live UPI Sync:** Automatically fetches real-time simulated UPI transactions, instantly giving vendors a digital ledger of their daily earnings.
- **Quick Cash Register:** A manual punch-in system for cash sales. 
- **Thermal Receipt Printer Simulation:** Every transaction triggers a satisfying, beautifully styled virtual "thermal receipt" that slides onto the screen, bridging the gap between digital software and physical retail.

### 2. 🏪 The Vendor Hub (Everything in One Place)
- **🏛️ Gov Schemes:** Browse and apply for relevant micro-credit loans and grants (e.g., PM SVANidhi, Mudra Yojana) directly from the app.
- **📦 Sourcing:** A centralized directory of wholesale suppliers offering bulk discounts for daily raw materials.
- **🎓 Training:** Embedded YouTube video modules that teach vendors essential skills like Digital Payments 101, FSSAI Hygiene, and WhatsApp Marketing.
- **📜 Licenses:** Simplified, step-by-step guides for obtaining necessary vending certificates and food safety licenses.

### 3. 🤖 AI-Powered Insights (Simulated)
- Evaluates recent sales volume and weather data to provide basic forecasting and inventory alerts (e.g., "High stock warning," "Reorder cups").

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite
- **Styling:** Pure CSS (Glassmorphism, Responsive Grid, Custom Animations like the Thermal Receipt)
- **Backend:** Python + FastAPI
- **Database:** SQLite (managed via SQLAlchemy & Pydantic)
- **API Integration:** Vite proxy configured for seamless frontend-to-backend communication without CORS issues.

---

## 🚀 How to Run Locally

### 1. Start the Backend (FastAPI)
```bash
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Seed the database with rich dummy data (90 days sales, UPI txns, etc.)
python seed_data.py

# Run the server
uvicorn main:app --reload --port 8000
```

### 2. Start the Frontend (Vite/React)
In a new terminal window:
```bash
# In the root directory
npm install
npm run dev
```

Open your browser to `http://localhost:5173`. Click **🔑 Login as Demo Vendor** to immediately explore the fully populated dashboard!
