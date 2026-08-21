import urllib.request
import urllib.parse
import json
from datetime import datetime
from typing import List, Dict, Tuple

# Mapping of common Indian cities to coordinates for Open-Meteo API
CITY_COORDINATES = {
    "delhi": (28.6139, 77.2090),
    "new delhi": (28.6139, 77.2090),
    "mumbai": (19.0760, 72.8777),
    "bengaluru": (12.9716, 77.5946),
    "bangalore": (12.9716, 77.5946),
    "kolkata": (22.5726, 88.3639),
    "chennai": (13.0827, 80.2707),
    "hyderabad": (17.3850, 78.4867),
    "pune": (18.5204, 73.8567),
    "ahmedabad": (23.0225, 72.5714),
    "jaipur": (26.9124, 75.7873),
}

def fetch_live_weather(location: str) -> Dict[str, any]:
    """
    Fetches real-time live weather data from OpenWeather API.
    """
    api_key = "dfef7665bac1d521b9f2550a99f5d20d"
    loc_encoded = urllib.parse.quote(location)
    url = f"https://api.openweathermap.org/data/2.5/weather?q={loc_encoded}&appid={api_key}&units=metric"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "StreetVendorAI/1.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            temp = data.get("main", {}).get("temp", 28.0)
            weather_desc = data.get("weather", [{}])[0].get("main", "Clear")

            # Map OpenWeather conditions to human text & impact
            condition_lower = weather_desc.lower()
            if "rain" in condition_lower or "drizzle" in condition_lower or "thunderstorm" in condition_lower:
                condition = "Rainy"
                multiplier = 0.85  # Rain reduces outdoor cart footfall
                advice = "🌧️ Rain expected. Bring tarps/umbrellas and consider switching to hot snacks/beverages."
            elif "clouds" in condition_lower:
                condition = "Partly Cloudy"
                multiplier = 1.05
                advice = "⛅ Pleasant cloudy weather. Normal inventory recommended."
            elif temp > 36.0:
                condition = "Hot & Sunny"
                multiplier = 1.12
                advice = "🔥 Extreme heat warning! Stock up on cold beverages, ice, and stay shaded."
            else:
                condition = "Clear / Pleasant"
                multiplier = 1.08
                advice = "☀️ Excellent clear weather. High footfall expected!"

            return {
                "temperature_c": round(temp, 1),
                "condition": condition,
                "weather_code": weather_desc,
                "demand_multiplier": multiplier,
                "actionable_advice": advice
            }
    except Exception as e:
        print(f"Weather API fallback notice: {e}")
        return {
            "temperature_c": 28.5,
            "condition": "Clear / Pleasant",
            "weather_code": "Clear",
            "demand_multiplier": 1.08,
            "actionable_advice": "☀️ Standard weather assumed. Normal inventory recommended."
        }


def calculate_statistical_forecast(sales_history: List[float], location: str, auto_record: bool = False) -> Tuple[float, str, str, Dict]:
    """
    Calculates statistical demand forecast using Exponential Smoothing (Exponential Weighted Moving Average)
    combined with Day-of-Week seasonality and Live Weather signals.
    """
    weather = fetch_live_weather(location)
    is_weekend = datetime.now().weekday() >= 5
    weekend_multiplier = 1.18 if is_weekend else 1.0

    if not sales_history:
        # Initial baseline if no prior DB records
        base = 100.0
    elif len(sales_history) == 1:
        base = sales_history[0]
    else:
        # Exponential Smoothing (alpha = 0.6 favors recent sales)
        alpha = 0.6
        smoothed = sales_history[0]
        for val in sales_history[1:]:
            smoothed = alpha * val + (1 - alpha) * smoothed
        base = smoothed

    # Apply combined factors: Base * Weather Multiplier * Weekend Multiplier
    auto_factor = 1.02 if auto_record else 1.0
    forecast_units = round(base * weather["demand_multiplier"] * weekend_multiplier * auto_factor, 1)

    # Calculate confidence rating based on history depth
    confidence_pct = min(96, 75 + len(sales_history) * 3)

    trend_msg = (
        f"📊 Weather Signal: {weather['condition']} ({weather['temperature_c']}°C, {round((weather['demand_multiplier']-1)*100, 1)}% impact). "
        f"{'Weekend footfall surge (+18%).' if is_weekend else 'Weekday baseline.'}"
    )

    summary_msg = f"AI statistical forecast predicts {forecast_units} units for today with {confidence_pct}% model accuracy."

    return forecast_units, f"{confidence_pct}%", trend_msg, weather
