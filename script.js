// ===============================
// 1. 탭 전환
// ===============================
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.tab;

    tabButtons.forEach((btn) => btn.classList.remove("active"));
    tabContents.forEach((content) => content.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(target).classList.add("active");
  });
});


// ===============================
// 2. 실시간 시계
// ===============================
function updateClock() {
  const now = new Date();

  const dateText = now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });

  const clockText = now.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  document.getElementById("dateText").textContent = dateText;
  document.getElementById("clockText").textContent = clockText;
}

updateClock();
setInterval(updateClock, 1000);


// ===============================
// 3. 날씨 기능 - Open-Meteo API
// ===============================
const cities = {
  busan: {
    name: "부산",
    latitude: 35.1796,
    longitude: 129.0756
  },
  gimhae: {
    name: "김해",
    latitude: 35.2285,
    longitude: 128.8893
  },
  seoul: {
    name: "서울",
    latitude: 37.5665,
    longitude: 126.9780
  }
};

let currentCity = "busan";
let tempChart = null;

const weatherCodeMap = {
  0: "맑음",
  1: "대체로 맑음",
  2: "부분적으로 흐림",
  3: "흐림",
  45: "안개",
  48: "서리 안개",
  51: "약한 이슬비",
  53: "이슬비",
  55: "강한 이슬비",
  61: "약한 비",
  63: "비",
  65: "강한 비",
  71: "약한 눈",
  73: "눈",
  75: "강한 눈",
  80: "약한 소나기",
  81: "소나기",
  82: "강한 소나기",
  95: "뇌우"
};

function getWeatherText(code) {
  return weatherCodeMap[code] || "날씨 정보";
}

async function loadWeather(cityKey) {
  currentCity = cityKey;

  const city = cities[cityKey];

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${city.latitude}` +
    `&longitude=${city.longitude}` +
    `&current=temperature_2m,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&timezone=Asia%2FSeoul` +
    `&past_days=1` +
    `&forecast_days=10`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    renderCurrentWeather(city.name, data);
    renderForecast(data);
    renderChart(data);
  } catch (error) {
    document.getElementById("weatherNow").textContent =
      "날씨 정보를 불러오지 못했습니다. 잠시 후 다시 시도하세요.";

    const sub = document.getElementById("weatherNowSub");
    if (sub) {
      sub.textContent = "날씨 정보를 불러오지 못했습니다.";
    }

    console.error(error);
  }
}

function renderCurrentWeather(cityName, data) {
  const current = data.current;
  const daily = data.daily;

  const todayIndex = 1;
  const yesterdayIndex = 0;

  const todayMax = daily.temperature_2m_max[todayIndex];
  const todayMin = daily.temperature_2m_min[todayIndex];
  const yesterdayMax = daily.temperature_2m_max[yesterdayIndex];
  const yesterdayMin = daily.temperature_2m_min[yesterdayIndex];

  const html = `
    <strong>${cityName} 현재 날씨</strong><br />
    현재 기온: ${current.temperature_2m}℃ /
    상태: ${getWeatherText(current.weather_code)} /
    풍속: ${current.wind_speed_10m}km/h<br />
    오늘: 최고 ${todayMax}℃ · 최저 ${todayMin}℃<br />
    어제: 최고 ${yesterdayMax}℃ · 최저 ${yesterdayMin}℃
  `;

  document.getElementById("weatherNow").innerHTML = html;

  const subBox = document.getElementById("weatherNowSub");
  if (subBox) {
    subBox.innerHTML = html;
  }
}

function renderForecast(data) {
  const daily = data.daily;
  const container = document.getElementById("forecastCards");
  container.innerHTML = "";

  daily.time.forEach((date, index) => {
    const label =
      index === 0 ? "어제" :
      index === 1 ? "오늘" :
      `${index - 1}일 뒤`;

    const card = document.createElement("div");
    card.className = "forecast-card";

    card.innerHTML = `
      <div class="day">${label}</div>
      <div>${date.slice(5)}</div>
      <div class="temp">
        최고 ${daily.temperature_2m_max[index]}℃<br />
        최저 ${daily.temperature_2m_min[index]}℃
      </div>
      <div class="temp">${getWeatherText(daily.weather_code[index])}</div>
    `;

    container.appendChild(card);
  });
}

function renderChart(data) {
  const ctx = document.getElementById("tempChart");

  const labels = data.daily.time.map((date, index) => {
    if (index === 0) return "어제";
    if (index === 1) return "오늘";
    return `${index - 1}일 뒤`;
  });

  const maxTemps = data.daily.temperature_2m_max;
  const minTemps = data.daily.temperature_2m_min;

  if (tempChart) {
    tempChart.destroy();
  }

  tempChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "최고 기온",
          data: maxTemps,
          tension: 0.35,
          borderWidth: 3
        },
        {
          label: "최저 기온",
          data: minTemps,
          tension: 0.35,
          borderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            font: {
              family: "Pretendard"
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return value + "℃";
            }
          }
        }
      }
    }
  });
}

document.querySelectorAll(".city-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const cityKey = button.dataset.city;

    document.querySelectorAll(".city-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    document
      .querySelectorAll(`.city-btn[data-city="${cityKey}"]`)
      .forEach((btn) => btn.classList.add("active"));

    loadWeather(cityKey);
  });
});

loadWeather(currentCity);


// ===============================
// 4. To-Do 리스트
// ===============================
const todoInput = document.getElementById("todoInput");
const addTodoBtn = document.getElementById("addTodoBtn");
const todoList = document.getElementById("todoList");

let todos = JSON.parse(localStorage.getItem("todos")) || [];

function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function renderTodos() {
  todoList.innerHTML = "";

  todos.forEach((todo, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${todo}</span>
      <button aria-label="삭제">삭제</button>
    `;

    li.querySelector("button").addEventListener("click", () => {
      todos.splice(index, 1);
      saveTodos();
      renderTodos();
    });

    todoList.appendChild(li);
  });
}

addTodoBtn.addEventListener("click", () => {
  const value = todoInput.value.trim();

  if (!value) return;

  todos.push(value);
  todoInput.value = "";

  saveTodos();
  renderTodos();
});

todoInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addTodoBtn.click();
  }
});

renderTodos();


// ===============================
// 5. 메모장 저장
// ===============================
const memoBox = document.getElementById("memoBox");

memoBox.value = localStorage.getItem("memo") || "";

memoBox.addEventListener("input", () => {
  localStorage.setItem("memo", memoBox.value);
});


// ===============================
// 6. 학사일정 / 과제 마감 캘린더
// ===============================
const scheduleTitle = document.getElementById("scheduleTitle");
const scheduleDate = document.getElementById("scheduleDate");
const addScheduleBtn = document.getElementById("addScheduleBtn");
const scheduleList = document.getElementById("scheduleList");

let schedules = JSON.parse(localStorage.getItem("schedules")) || [];

function saveSchedules() {
  localStorage.setItem("schedules", JSON.stringify(schedules));
}

function renderSchedules() {
  scheduleList.innerHTML = "";

  schedules
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((item, index) => {
      const li = document.createElement("li");

      li.innerHTML = `
        <span><strong>${item.date}</strong> · ${item.title}</span>
        <button>삭제</button>
      `;

      li.querySelector("button").addEventListener("click", () => {
        schedules.splice(index, 1);
        saveSchedules();
        renderSchedules();
      });

      scheduleList.appendChild(li);
    });
}

addScheduleBtn.addEventListener("click", () => {
  const title = scheduleTitle.value.trim();
  const date = scheduleDate.value;

  if (!title || !date) {
    alert("일정명과 날짜를 모두 입력하세요.");
    return;
  }

  schedules.push({ title, date });

  scheduleTitle.value = "";
  scheduleDate.value = "";

  saveSchedules();
  renderSchedules();
});

renderSchedules();


// ===============================
// 7. 오늘의 명언
// ===============================
const quotes = [
  "작은 실천이 쌓이면 연구자의 하루가 단단해집니다.",
  "오늘의 기록은 내일의 자료가 됩니다.",
  "조금 늦어도 괜찮습니다. 방향을 잃지 않는 하루가 중요합니다.",
  "사회복지는 사람을 바라보는 따뜻한 시선에서 시작합니다.",
  "오늘 한 줄의 메모가 내일의 좋은 문장이 됩니다.",
  "아자 아자 파이팅. 오늘도 충분히 해낼 수 있습니다."
];

function setQuote() {
  const today = new Date().getDate();
  const quote = quotes[today % quotes.length];

  document.getElementById("quoteText").textContent = quote;
}

setQuote();


// ===============================
// 8. 하루 운세
// ===============================
const fortunes = [
  "오늘은 정리운이 좋은 날입니다. 흩어진 자료를 모으면 좋은 결과가 나옵니다.",
  "오늘은 사람운이 따뜻합니다. 짧은 대화에서 좋은 아이디어를 얻을 수 있습니다.",
  "오늘은 집중운이 강합니다. 어려운 과제 하나를 먼저 끝내보세요.",
  "오늘은 학업운이 좋습니다. 논문이나 자료 검색에 성과가 있습니다.",
  "오늘은 휴식운이 필요합니다. 잠깐 쉬어야 더 오래 갈 수 있습니다.",
  "오늘은 발표운이 좋습니다. 말하고 싶은 내용을 차분히 정리하면 빛이 납니다.",
  "오늘은 기록운이 좋습니다. 떠오른 문장을 바로 적어두세요."
];

function showFortune() {
  const randomIndex = Math.floor(Math.random() * fortunes.length);
  document.getElementById("fortuneText").textContent = fortunes[randomIndex];
}

document.getElementById("fortuneBtn").addEventListener("click", showFortune);

showFortune();