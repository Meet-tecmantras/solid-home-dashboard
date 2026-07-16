import { createSignal, onCleanup, onMount, createEffect, For, Show } from "solid-js";
import "./index.css";

const weatherDescriptions = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

const weatherIcons = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌧️",
  53: "🌧️",
  55: "🌧️",
  56: "🌧️",
  57: "🌧️",
  61: "🌦️",
  63: "🌧️",
  65: "⛈️",
  66: "❄️",
  67: "❄️",
  71: "❄️",
  73: "❄️",
  75: "❄️",
  77: "❄️",
  80: "🌦️",
  81: "🌧️",
  82: "⛈️",
  85: "🌨️",
  86: "🌨️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

const STORAGE_KEY = "solid-home-dashboard-todos";

function App() {
  const [time, setTime] = createSignal(new Date());
  const [theme, setTheme] = createSignal("light");
  const [locationInput, setLocationInput] = createSignal("San Francisco");
  const [weatherData, setWeatherData] = createSignal(null);
  const [weatherStatus, setWeatherStatus] = createSignal("idle");
  const [weatherError, setWeatherError] = createSignal("");
  const [tasks, setTasks] = createSignal([]);
  const [filter, setFilter] = createSignal("all");
  const [taskDraft, setTaskDraft] = createSignal("");
  const [quote, setQuote] = createSignal(null);
  const [quotePool, setQuotePool] = createSignal([]);
  const [quoteStatus, setQuoteStatus] = createSignal("idle");

  const updateTime = () => setTime(new Date());
  const interval = setInterval(updateTime, 1000);
  onCleanup(() => clearInterval(interval));

  createEffect(() => {
    document.documentElement.setAttribute("data-theme", theme());
  });

  const saveTasks = (list) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (error) {
      console.error("Unable to save todos", error);
    }
  };

  onMount(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTasks(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Unable to parse stored todos", error);
    }
    fetchWeather();
    fetchQuotePool();
  });

  createEffect(() => {
    saveTasks(tasks());
  });

  const filteredTasks = () => {
    if (filter() === "active") return tasks().filter((task) => !task.completed);
    if (filter() === "completed") return tasks().filter((task) => task.completed);
    return tasks();
  };

  const addTask = (event) => {
    event?.preventDefault?.();
    const text = taskDraft().trim();
    if (!text) return;
    const newTask = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      text,
      completed: false,
    };
    setTasks((prev) => [...prev, newTask]);
    setTaskDraft("");
  };

  const toggleTask = (id) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)));
  };

  const removeTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const fetchWeather = async () => {
    const query = locationInput().trim();
    if (!query) {
      setWeatherError("Please provide a location.");
      setWeatherStatus("error");
      return;
    }

    setWeatherStatus("loading");
    setWeatherError("");

    try {
      const geocodeRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`
      );
      const geocodeData = await geocodeRes.json();
      if (!geocodeData.results?.length) {
        throw new Error("No matching location found.");
      }
      const target = geocodeData.results[0];
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${target.latitude}&longitude=${target.longitude}&current_weather=true&timezone=${encodeURIComponent(
          target.timezone
        )}`
      );
      const weatherJson = await weatherRes.json();
      if (!weatherJson.current_weather) {
        throw new Error("Weather data not available right now.");
      }

      setWeatherData({
        location: `${target.name}, ${target.country}`,
        temperature: weatherJson.current_weather.temperature,
        windSpeed: weatherJson.current_weather.windspeed,
        code: weatherJson.current_weather.weathercode,
        description: weatherDescriptions[weatherJson.current_weather.weathercode] || "Clear sky",
        time: weatherJson.current_weather.time,
      });
      setWeatherStatus("success");
    } catch (error) {
      setWeatherStatus("error");
      setWeatherError(error?.message || "Unable to fetch weather.");
      console.error("Weather error", error);
    }
  };

  const fetchQuotePool = async () => {
    setQuoteStatus("loading");
    try {
      const res = await fetch("https://type.fit/api/quotes");
      const data = await res.json();
      setQuotePool(data);
      const random = data[Math.floor(Math.random() * data.length)];
      setQuote(random);
      setQuoteStatus("success");
    } catch (error) {
      setQuoteStatus("error");
      setQuote({ text: "Stay curious and keep building.", author: "Unknown" });
      console.error("Quote error", error);
    }
  };

  const refreshQuote = () => {
    if (quotePool().length) {
      const random = quotePool()[Math.floor(Math.random() * quotePool().length)];
      setQuote(random);
      setQuoteStatus("success");
    } else {
      fetchQuotePool();
    }
  };

  return (
    <div class="app-shell">
      <header class="dashboard-header">
        <div>
          <p class="eyebrow">Personal Home Dashboard</p>
          <h1>Welcome back!</h1>
        </div>
        <button class="theme-toggle" onClick={() => setTheme(theme() === "light" ? "dark" : "light")}> 
          {theme() === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </header>

      <section class="grid">
        <article class="panel clock-panel">
          <div class="panel-header">
            <h2>Current time</h2>
            <p class="subtle">Updates every second</p>
          </div>
          <p class="time-display">{new Intl.DateTimeFormat(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }).format(time())}</p>
          <p class="date-display">
            {new Intl.DateTimeFormat(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(
              time()
            )}
          </p>
        </article>

        <article class="panel weather-panel">
          <div class="panel-header">
            <div>
              <h2>Weather quick look</h2>
              <p class="subtle">Powered by Open-Meteo</p>
            </div>
            <button class="refresh" onClick={fetchWeather}>Refresh</button>
          </div>

          <form class="location-form" onSubmit={(event) => {
            event.preventDefault();
            fetchWeather();
          }}>
            <input
              placeholder="Enter city, e.g., Tokyo"
              value={locationInput()}
              onInput={(e) => setLocationInput(e.currentTarget.value)}
            />
            <button type="submit">Go</button>
          </form>

          <Show when={weatherStatus() === "success"} fallback={<p class="subtle">{weatherStatus() === "loading" ? "Fetching weather..." : weatherError() || "Enter a location to begin."}</p>}>
            <div class="weather-details">
              <span class="weather-icon">{weatherIcons[weatherData()?.code] || "🌤️"}</span>
              <div>
                <p class="weather-temp">{weatherData()?.temperature?.toFixed(1)}°C</p>
                <p class="weather-location">{weatherData()?.location}</p>
                <p class="subtle">{weatherData()?.description}</p>
              </div>
              <p class="subtle">Wind {weatherData()?.windSpeed} km/h</p>
            </div>
          </Show>
        </article>

        <article class="panel todo-panel">
          <div class="panel-header">
            <div>
              <h2>Today's tasks</h2>
              <p class="subtle">Saved locally</p>
            </div>
          </div>

          <form class="todo-input" onSubmit={addTask}>
            <input
              placeholder="Add a task"
              value={taskDraft()}
              onInput={(event) => setTaskDraft(event.currentTarget.value)}
            />
            <button type="submit">Add</button>
          </form>

          <div class="filters">
            <button classList={{ active: filter() === "all" }} onClick={() => setFilter("all")}>
              All
            </button>
            <button classList={{ active: filter() === "active" }} onClick={() => setFilter("active")}>
              Active
            </button>
            <button classList={{ active: filter() === "completed" }} onClick{() => setFilter("completed")}>
              Completed
            </button>
          </div>

          <div class="todo-list">
            <For each={filteredTasks()} fallback={<p class="subtle">No tasks yet. Add one above!</p>}>
              {(task) => (
                <label class="todo-item">
                  <input type="checkbox" checked={task.completed} onChange(() => toggleTask(task.id)) />
                  <span classList={{ completed: task.completed }}>{task.text}</span>
                  <button class="ghost" type="button" onClick={() => removeTask(task.id)}>
                    ✕
                  </button>
                </label>
              )}
            </For>
          </div>
        </article>

        <article class="panel quote-panel">
          <div class="panel-header">
            <div>
              <h2>Daily motivation</h2>
              <p class="subtle">Random quote fetched from Type.fit</p>
            </div>
            <button class="refresh" onClick={refreshQuote}>New</button>
          </div>

          <Show when={quoteStatus() === "success" && quote()} fallback={<p class="subtle">{quoteStatus() === "loading" ? "Loading quote..." : "Unable to load a quote right now."}</p>}>
            <blockquote>
              “{quote()?.text}”
              <footer>{quote()?.author || "Unknown"}</footer>
            </blockquote>
          </Show>
        </article>
      </section>
    </div>
  );
}

export default App;
