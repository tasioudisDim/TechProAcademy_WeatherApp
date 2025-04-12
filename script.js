const lat = 40.5872;
const lon = 22.9482;
const API_URL = 'https://api.open-meteo.com/v1/forecast';
let rawDailyData = null;
let currentUnit = 'C';

const celsiusBtn = document.getElementById('celsiusBtn');
const fahrenheitBtn = document.getElementById('fahrenheitBtn');

celsiusBtn.onclick = () => {
  currentUnit = 'C';
  celsiusBtn.classList.add('active');
  fahrenheitBtn.classList.remove('active');
  updateUnits();
};

fahrenheitBtn.onclick = () => {
  currentUnit = 'F';
  fahrenheitBtn.classList.add('active');
  celsiusBtn.classList.remove('active');
  updateUnits();
};

function toFahrenheit(c) {
  return (c * 9 / 5 + 32).toFixed(1);
}

function updateUnits() {
  const temp = document.querySelector('#temperature');
  const feels = document.querySelector('#feels-like');
  const t = parseFloat(temp.dataset.celsius);
  const f = parseFloat(feels.dataset.celsius);
  temp.textContent = currentUnit === 'F' ? `${toFahrenheit(t)}°F` : `${t}°C`;
  feels.textContent = currentUnit === 'F' ? `${toFahrenheit(f)}°F` : `${f}°C`;
}

const slider = document.getElementById('modeSlider');
const thumb = slider.querySelector('.thumb');
let currentMode = 'light';

slider.addEventListener('click', () => {
  if (currentMode === 'light') {
    currentMode = 'dark';
    document.body.className = 'dark-mode';
    thumb.style.left = '30px';
  } else if (currentMode === 'dark') {
    currentMode = 'party';
    document.body.className = 'party-mode';
    thumb.style.left = '60px';
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
  } else {
    currentMode = 'light';
    document.body.className = '';
    thumb.style.left = '0px';
  }
});

const ctx = document.getElementById('tempChart').getContext('2d');
const tempChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      data: [],
      borderColor: '#A4D4AE',
      tension: 0.3,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.parsed.y}°C`
        }
      }
    },
    scales: {
      x: {
        ticks: {
          callback: function(value) {
            const d = new Date(this.getLabelForValue(value));
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
          }
        }
      },
      y: { beginAtZero: false }
    }
  }
});

function getLocalWeatherIcon(code) {
  if (code === 0) return 'clear.svg';
  if ([1, 2, 3].includes(code)) return 'cloudy.svg';
  if ([45, 48].includes(code)) return 'fog.svg';
  if (code >= 51 && code <= 67) return 'drizzle.svg';
  if (code >= 71 && code <= 77) return 'snow.svg';
  if (code >= 80 && code <= 82) return 'rain.svg';
  if (code >= 85 && code <= 86) return 'snow-showers.png';
  if (code >= 95 && code <= 99) return 'thunder.svg';
  return 'clear.svg';
}

function updateDayData(index) {
  const day = rawDailyData[index];
  document.getElementById('temperature').textContent = `${day.temp}°C`;
  document.getElementById('temperature').dataset.celsius = day.temp;
  document.getElementById('feels-like').textContent = `${day.feels_like}°C`;
  document.getElementById('feels-like').dataset.celsius = day.feels_like;
  document.getElementById('wind').textContent = `${day.wind} m/s`;
  document.getElementById('gusts').textContent = `${day.gusts} m/s`;
  document.getElementById('wind-deg').textContent = `${day.wind_deg}°`;
  document.getElementById('humidity').textContent = `${day.humidity}%`;
  document.getElementById('pressure').textContent = `${(day.pressure / 1000).toFixed(2)} hPa`;
  updateUnits();
}

function populateDropdown(data) {
  const dropdown = document.getElementById('dayDropdown');
  dropdown.innerHTML = '';
  rawDailyData = data.daily.time.map((t, i) => ({
    date: t,
    temp: data.daily.temperature_2m_max[i],
    feels_like: data.daily.apparent_temperature_max[i],
    wind: data.daily.windspeed_10m_max[i],
    gusts: data.daily.windgusts_10m_max[i],
    wind_deg: data.daily.winddirection_10m_dominant[i],
    humidity: data.daily.relative_humidity_2m_max[i],
    pressure: data.daily.surface_pressure_max[i]
  }));
  rawDailyData.forEach((d, i) => {
    const option = document.createElement('option');
    option.value = i;
    option.text = new Date(d.date).toDateString();
    dropdown.appendChild(option);
  });
  dropdown.onchange = e => updateDayData(e.target.value);
  updateDayData(0);
}

async function fetchWeather() {
  const url = `${API_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weathercode,windspeed_10m,windgusts_10m,winddirection_10m,relativehumidity_2m,surface_pressure` +
    `&daily=temperature_2m_max,apparent_temperature_max,windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant,relative_humidity_2m_max,surface_pressure_max` +
    `&timezone=auto`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const code = data.current.weathercode;
    const iconFile = getLocalWeatherIcon(code);
    document.getElementById('weather-icon').src = `icons/${iconFile}`;
    document.getElementById('weather-icon').style.display = 'block';
    const currentTemp = data.current.temperature_2m;
    document.getElementById('temperature').textContent = `${currentTemp}°C`;
    document.getElementById('temperature').dataset.celsius = currentTemp;
    document.getElementById('feels-like').textContent = `${currentTemp}°C`;
    document.getElementById('feels-like').dataset.celsius = currentTemp;
    document.getElementById('description').textContent = "Updated";
    document.getElementById('wind').textContent = `${data.current.windspeed_10m} m/s`;
    document.getElementById('gusts').textContent = `${data.current.windgusts_10m} m/s`;
    document.getElementById('wind-deg').textContent = `${data.current.winddirection_10m}°`;
    document.getElementById('humidity').textContent = `${data.current.relativehumidity_2m}%`;
    document.getElementById('pressure').textContent = `${(data.current.surface_pressure / 1000).toFixed(2)} hPa`;
    tempChart.data.labels = data.daily.time;
    tempChart.data.datasets[0].data = data.daily.temperature_2m_max;
    tempChart.update();
    populateDropdown(data);
  } catch (error) {
    console.error('Failed to load weather data:', error);
    document.getElementById('description').textContent = 'Failed to load weather data.';
  }
}

fetchWeather();
