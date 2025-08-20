const apiKey = "7ebbdcb8dfa0187af6c40a26d884fac9"; // replace with your OpenWeatherMap API key

const form = document.getElementById("weatherForm");
const input = document.getElementById("locationInput");
const countrySelect = document.getElementById("countrySelect");
const resultsDiv = document.getElementById("results");
const errorBox = document.getElementById("errorBox");
const darkModeToggle = document.getElementById("darkModeToggle");
const unitToggle = document.getElementById("unitToggle");

let isCelsius = false;

// ---------- Dark Mode Toggle ----------
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  darkModeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// ---------- Unit Toggle ----------
unitToggle.addEventListener("change", () => {
  isCelsius = unitToggle.checked;
  if (input.value.trim()) {
    fetchWeather();
  }
});

// ---------- Form Submit ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  fetchWeather();
});

// ---------- Fetch Current Weather ----------
async function fetchCurrentWeather(query, country) {
  let url;
  if (/^\d+$/.test(query)) {
    url = `https://api.openweathermap.org/data/2.5/weather?zip=${query},${country}&appid=${apiKey}&units=${isCelsius ? "metric" : "imperial"}`;
  } else {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${query},${country}&appid=${apiKey}&units=${isCelsius ? "metric" : "imperial"}`;
  }

  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error fetching current weather");
  return data;
}

// ---------- Display Current Weather ----------
function displayCurrentWeather(data) {
  const temp = Math.round(data.main.temp);
  const desc = data.weather[0].description;
  const icon = data.weather[0].icon;
  const city = data.name;

  const oldCurrent = resultsDiv.querySelector(".current-weather");
  if (oldCurrent) oldCurrent.remove();

  const card = document.createElement("div");
  card.className = "forecast-card current-weather";
  card.innerHTML = `
    <div>
      <h3>Current: ${city}</h3>
      <p>${desc}</p>
    </div>
    <div>
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
      <p>${temp}° ${isCelsius ? "C" : "F"}</p>
    </div>
  `;
  resultsDiv.prepend(card);
}

// ---------- Fetch Weather ----------
async function fetchWeather() {
  const query = input.value.trim();
  const country = countrySelect.value;
  if (!query) return;

  try {
    const currentData = await fetchCurrentWeather(query, country);
    displayCurrentWeather(currentData);

    const forecastUrl = /^\d+$/.test(query)
      ? `https://api.openweathermap.org/data/2.5/forecast?zip=${query},${country}&appid=${apiKey}&units=${isCelsius ? "metric" : "imperial"}`
      : `https://api.openweathermap.org/data/2.5/forecast?q=${query},${country}&appid=${apiKey}&units=${isCelsius ? "metric" : "imperial"}`;

    const res = await fetch(forecastUrl);
    const data = await res.json();

    if (!res.ok) {
      showError(data.message || "Error fetching forecast");
      return;
    }

    displayForecast(data);
  } catch (err) {
    showError(err.message);
  }
}

// ---------- Show Error ----------
function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = "block";
  input.addEventListener("input", () => errorBox.style.display = "none", { once: true });
}

// ---------- Display 5-Day Forecast ----------
function displayForecast(data) {
  const oldForecasts = resultsDiv.querySelectorAll(".forecast-card:not(.current-weather)");
  oldForecasts.forEach(c => c.remove());

  const daily = {};
  const today = new Date().toDateString();

  data.list.forEach(item => {
    const date = new Date(item.dt * 1000).toDateString();
    if (!daily[date] && item.dt_txt.includes("12:00:00")) {
      daily[date] = item;
    }
  });

  Object.keys(daily).slice(0, 5).forEach(date => {
    const item = daily[date];
    const temp = Math.round(item.main.temp);
    const icon = item.weather[0].icon;
    const desc = item.weather[0].description;

    const card = document.createElement("div");
    card.className = "forecast-card";
    if (date === today) card.classList.add("current-day");

    card.innerHTML = `
      <h3>${date}</h3>
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
      <p>${temp}° ${isCelsius ? "C" : "F"}</p>
      <p>${desc}</p>
      <div class="tooltip">${desc}</div>
    `;

    resultsDiv.appendChild(card);
  });
}
