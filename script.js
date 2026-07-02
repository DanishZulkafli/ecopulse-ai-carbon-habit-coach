const STORAGE_KEY = "ecopulse-ai-actions";

const emissionFactors = {
  Transport: {
    km: 0.21
  },
  Energy: {
    kwh: 0.58
  },
  Food: {
    meal: 2.5
  },
  Waste: {
    kg: 1.2
  },
  Water: {
    liter: 0.0003
  },
  Shopping: {
    item: 6.5
  },
  "Digital Usage": {
    hour: 0.06
  },
  "Tree Planting": {
    tree: 21
  }
};

const challenges = [
  {
    title: "Use public transport or carpool for one trip",
    category: "Transport",
    value: 10,
    unit: "km",
    impactType: "avoided",
    notes: "Reduced private car usage by choosing shared or public transport."
  },
  {
    title: "Switch off unused lights and devices",
    category: "Energy",
    value: 3,
    unit: "kwh",
    impactType: "avoided",
    notes: "Saved electricity by reducing unnecessary energy usage."
  },
  {
    title: "Choose one plant-based meal",
    category: "Food",
    value: 1,
    unit: "meal",
    impactType: "avoided",
    notes: "Reduced food-related footprint by choosing a lower-impact meal."
  },
  {
    title: "Recycle or reuse household waste",
    category: "Waste",
    value: 2,
    unit: "kg",
    impactType: "avoided",
    notes: "Reduced waste impact by recycling or reusing materials."
  },
  {
    title: "Reduce shower time and save water",
    category: "Water",
    value: 40,
    unit: "liter",
    impactType: "avoided",
    notes: "Saved water by reducing unnecessary water usage."
  },
  {
    title: "Avoid buying one non-essential item",
    category: "Shopping",
    value: 1,
    unit: "item",
    impactType: "avoided",
    notes: "Prevented unnecessary consumption and product footprint."
  },
  {
    title: "Plant or sponsor one tree",
    category: "Tree Planting",
    value: 1,
    unit: "tree",
    impactType: "avoided",
    notes: "Supported long-term carbon absorption through tree planting."
  }
];

let activeChallenge = null;

function getActions() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveActions(actions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function scrollToForm() {
  document.getElementById("ecoForm").scrollIntoView({ behavior: "smooth" });
}

function calculateCO2(category, unit, value) {
  const factor = emissionFactors[category]?.[unit] || 0.5;
  return Number(value || 0) * factor;
}

function addAction() {
  const title = document.getElementById("actionTitle").value.trim();
  const category = document.getElementById("category").value;
  const impactType = document.getElementById("impactType").value;
  const value = Number(document.getElementById("activityValue").value) || 0;
  const unit = document.getElementById("unit").value;
  const date = document.getElementById("actionDate").value || new Date().toISOString().slice(0, 10);
  const notes = document.getElementById("notes").value.trim();

  if (!title || value <= 0) {
    alert("Please enter action title and activity value.");
    return;
  }

  const co2 = calculateCO2(category, unit, value);

  const actions = getActions();

  actions.unshift({
    id: Date.now(),
    title,
    category,
    impactType,
    value,
    unit,
    co2,
    date: new Date(date).toISOString(),
    notes
  });

  saveActions(actions);
  clearForm();
  renderApp();
}

function clearForm() {
  document.getElementById("actionTitle").value = "";
  document.getElementById("activityValue").value = 1;
  document.getElementById("notes").value = "";
}

function deleteAction(id) {
  const confirmed = confirm("Delete this eco action?");
  if (!confirmed) return;

  const actions = getActions().filter(action => action.id !== id);
  saveActions(actions);
  renderApp();
}

function getTotals(actions) {
  const avoided = actions
    .filter(action => action.impactType === "avoided")
    .reduce((sum, action) => sum + Number(action.co2 || 0), 0);

  const produced = actions
    .filter(action => action.impactType === "produced")
    .reduce((sum, action) => sum + Number(action.co2 || 0), 0);

  return {
    avoided,
    produced,
    net: avoided - produced
  };
}

function getWeeklyActions(actions) {
  const now = new Date();

  return actions.filter(action => {
    const actionDate = new Date(action.date);
    return now - actionDate <= 7 * 24 * 60 * 60 * 1000;
  });
}

function getCurrentStreak(actions) {
  if (actions.length === 0) return 0;

  const dates = new Set(actions.map(action => new Date(action.date).toDateString()));
  const today = new Date();
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);

    if (dates.has(checkDate.toDateString())) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function getEcoScore(actions) {
  if (actions.length === 0) return 0;

  const totals = getTotals(actions);
  const categories = new Set(actions.map(action => action.category)).size;
  const weekly = getWeeklyActions(actions).length;
  const streak = getCurrentStreak(actions);

  let score = 0;

  score += Math.min(35, totals.avoided * 2);
  score += Math.min(20, categories * 4);
  score += Math.min(20, weekly * 5);
  score += Math.min(15, streak * 5);

  if (totals.net > 0) {
    score += 10;
  }

  return Math.round(Math.min(100, score));
}

function getBadge(score) {
  if (score >= 90) return "Eco Champion";
  if (score >= 70) return "Green Leader";
  if (score >= 50) return "Climate Helper";
  if (score >= 25) return "Eco Starter";
  return "Starter";
}

function renderDashboard(actions) {
  const totals = getTotals(actions);
  const score = getEcoScore(actions);
  const badge = getBadge(score);
  const weekly = getWeeklyActions(actions).length;
  const streak = getCurrentStreak(actions);
  const categories = new Set(actions.map(action => action.category)).size;

  document.getElementById("totalActions").textContent = actions.length;
  document.getElementById("co2Avoided").textContent = `${totals.avoided.toFixed(1)} kg`;
  document.getElementById("co2Produced").textContent = `${totals.produced.toFixed(1)} kg`;
  document.getElementById("netImpact").textContent = `${totals.net.toFixed(1)} kg`;
  document.getElementById("currentStreak").textContent = `${streak} days`;
  document.getElementById("weeklyActions").textContent = weekly;
  document.getElementById("categoryCount").textContent = categories;
  document.getElementById("currentBadge").textContent = badge;

  document.getElementById("heroScore").textContent = `${score}%`;
  document.getElementById("heroProgress").style.width = `${score}%`;

  if (actions.length === 0) {
    document.getElementById("heroStatus").textContent = "Start tracking your eco actions";
  } else if (score >= 70) {
    document.getElementById("heroStatus").textContent = "Strong sustainability progress";
  } else if (score >= 40) {
    document.getElementById("heroStatus").textContent = "Eco habit is growing";
  } else {
    document.getElementById("heroStatus").textContent = "Keep building green habits";
  }
}

function getCategoryStats(actions) {
  const stats = {};

  actions.forEach(action => {
    const impact = action.impactType === "avoided" ? action.co2 : -action.co2;
    stats[action.category] = (stats[action.category] || 0) + impact;
  });

  return Object.entries(stats).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
}

function getTypeStats(actions) {
  const stats = {
    "CO₂ Avoided": actions.filter(action => action.impactType === "avoided").reduce((sum, action) => sum + action.co2, 0),
    "CO₂ Produced": actions.filter(action => action.impactType === "produced").reduce((sum, action) => sum + action.co2, 0)
  };

  return Object.entries(stats).filter(item => item[1] > 0);
}

function renderBreakdown(containerId, stats) {
  const box = document.getElementById(containerId);

  if (stats.length === 0) {
    box.innerHTML = `<p class="empty-text">No data yet.</p>`;
    return;
  }

  const max = Math.max(...stats.map(item => Math.abs(item[1])), 1);

  box.innerHTML = stats.map(([label, value]) => {
    const percentage = Math.round((Math.abs(value) / max) * 100);
    const display = `${value.toFixed(1)} kg`;

    return `
      <div class="breakdown-item">
        <div class="breakdown-top">
          <span>${escapeHTML(label)}</span>
          <span>${display}</span>
        </div>
        <div class="breakdown-bg">
          <div class="breakdown-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderInsight(actions) {
  const title = document.getElementById("insightTitle");
  const text = document.getElementById("insightText");

  if (actions.length === 0) {
    title.textContent = "No insight yet";
    text.textContent = "Add your first eco action to receive a personalized sustainability insight.";
    return;
  }

  const totals = getTotals(actions);
  const categories = getCategoryStats(actions);
  const strongest = categories[0]?.[0] || "Transport";
  const weekly = getWeeklyActions(actions).length;
  const producedCount = actions.filter(action => action.impactType === "produced").length;

  if (totals.net < 0) {
    title.textContent = "Your footprint is currently higher than your savings";
    text.textContent = "Try adding more positive actions such as public transport, reduced energy usage, recycling, or plant-based meals.";
    return;
  }

  if (weekly === 0) {
    title.textContent = "No recent eco action this week";
    text.textContent = "Try completing one small eco action today to rebuild your weekly sustainability habit.";
    return;
  }

  if (producedCount > actions.length / 2) {
    title.textContent = "Many records are carbon-producing activities";
    text.textContent = "Balance your tracking with more carbon-reducing actions so you can see improvement clearly.";
    return;
  }

  if (categories.length < 3) {
    title.textContent = "Expand your sustainability categories";
    text.textContent = `You are strongest in ${strongest}. Try adding actions from other areas like food, energy, waste, or water.`;
    return;
  }

  title.textContent = "Good eco habit progress";
  text.textContent = "Your sustainability actions are becoming more consistent. Keep tracking, improving, and reducing high-impact habits.";
}

function renderBadges(actions) {
  const box = document.getElementById("badgeList");
  const totals = getTotals(actions);
  const score = getEcoScore(actions);
  const categories = new Set(actions.map(action => action.category)).size;
  const weekly = getWeeklyActions(actions).length;
  const streak = getCurrentStreak(actions);

  const badges = [];

  if (actions.length >= 1) badges.push("First Eco Action");
  if (actions.length >= 5) badges.push("Green Habit Builder");
  if (totals.avoided >= 10) badges.push("10kg CO₂ Avoider");
  if (totals.avoided >= 50) badges.push("50kg CO₂ Saver");
  if (categories >= 4) badges.push("Multi-Category Eco Hero");
  if (weekly >= 3) badges.push("Weekly Green Streak");
  if (streak >= 3) badges.push("Consistency Sprout");
  if (score >= 70) badges.push("Green Leader");

  if (badges.length === 0) {
    box.innerHTML = `<p class="empty-text">No badges unlocked yet.</p>`;
    return;
  }

  box.innerHTML = `
    <div class="badge-list">
      ${badges.map(badge => `<span class="unlock-badge">🌱 ${escapeHTML(badge)}</span>`).join("")}
    </div>
  `;
}

function renderSummary(actions) {
  const box = document.getElementById("ecoSummary");

  if (actions.length === 0) {
    box.textContent = "Add eco actions to generate your sustainability summary.";
    return;
  }

  const totals = getTotals(actions);
  const score = getEcoScore(actions);
  const categories = new Set(actions.map(action => action.category)).size;
  const badge = getBadge(score);

  box.textContent =
    `I recorded ${actions.length} sustainability action(s), avoided approximately ${totals.avoided.toFixed(1)} kg CO₂, produced approximately ${totals.produced.toFixed(1)} kg CO₂, and achieved a net impact of ${totals.net.toFixed(1)} kg CO₂ across ${categories} category/categories. My current eco badge is ${badge}.`;
}

function renderWeeklyTrend(actions) {
  const box = document.getElementById("weeklyTrend");

  if (actions.length === 0) {
    box.innerHTML = `<p class="empty-text">No weekly trend yet.</p>`;
    return;
  }

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const stats = days.map(day => ({ day, value: 0 }));

  actions.forEach(action => {
    const index = new Date(action.date).getDay();
    const impact = action.impactType === "avoided" ? action.co2 : -action.co2;
    stats[index].value += impact;
  });

  const max = Math.max(...stats.map(item => Math.abs(item.value)), 1);

  box.innerHTML = stats.map(item => {
    const height = Math.max(8, Math.round((Math.abs(item.value) / max) * 120));

    return `
      <div class="trend-bar" title="${item.day}: ${item.value.toFixed(1)} kg CO₂" style="height: ${height}px">
        <span>${item.day}</span>
      </div>
    `;
  }).join("");
}

function generateChallenge() {
  activeChallenge = challenges[Math.floor(Math.random() * challenges.length)];

  document.getElementById("challengeBox").innerHTML = `
    <span class="pill green">${escapeHTML(activeChallenge.category)}</span>
    <span class="pill">${escapeHTML(activeChallenge.unit)}</span>

    <h3>${escapeHTML(activeChallenge.title)}</h3>
    <p>${escapeHTML(activeChallenge.notes)}</p>

    <div>
      <span class="pill green">${activeChallenge.value} ${escapeHTML(activeChallenge.unit)}</span>
      <span class="pill orange">Estimated ${calculateCO2(activeChallenge.category, activeChallenge.unit, activeChallenge.value).toFixed(1)} kg CO₂</span>
    </div>

    <button onclick="completeChallenge()">Mark Challenge Completed</button>
    <button class="secondary" onclick="generateChallenge()">Generate Another Challenge</button>
  `;
}

function completeChallenge() {
  if (!activeChallenge) return;

  const actions = getActions();
  const co2 = calculateCO2(activeChallenge.category, activeChallenge.unit, activeChallenge.value);

  actions.unshift({
    id: Date.now(),
    title: activeChallenge.title,
    category: activeChallenge.category,
    impactType: activeChallenge.impactType,
    value: activeChallenge.value,
    unit: activeChallenge.unit,
    co2,
    date: new Date().toISOString(),
    notes: activeChallenge.notes
  });

  saveActions(actions);
  activeChallenge = null;

  document.getElementById("challengeBox").innerHTML = `
    <h3>Challenge completed</h3>
    <p>Great job. Generate another challenge to continue your eco habit.</p>
    <button onclick="generateChallenge()">Generate Challenge</button>
  `;

  renderApp();
}

function updateFilters(actions) {
  const filter = document.getElementById("filterCategory");
  const current = filter.value;
  const categories = ["All Categories", ...new Set(actions.map(action => action.category))];

  filter.innerHTML = categories.map(category => `<option>${escapeHTML(category)}</option>`).join("");

  if (categories.includes(current)) {
    filter.value = current;
  }
}

function renderHistory(actions) {
  const box = document.getElementById("historyList");
  const search = document.getElementById("searchInput").value.toLowerCase();
  const category = document.getElementById("filterCategory").value;
  const type = document.getElementById("filterType").value;

  let filtered = actions;

  if (category !== "All Categories") {
    filtered = filtered.filter(action => action.category === category);
  }

  if (type !== "All Types") {
    filtered = filtered.filter(action => action.impactType === type);
  }

  if (search) {
    filtered = filtered.filter(action => {
      const combined = `${action.title} ${action.category} ${action.notes}`.toLowerCase();
      return combined.includes(search);
    });
  }

  if (filtered.length === 0) {
    box.innerHTML = `
      <div class="empty-box wide">
        <h3>No eco actions found</h3>
        <p>Add actions or adjust your search/filter.</p>
      </div>
    `;
    return;
  }

  box.innerHTML = filtered.map(action => {
    const date = new Date(action.date).toLocaleDateString();
    const typeClass = action.impactType === "produced" ? "produced" : "";
    const typeLabel = action.impactType === "avoided" ? "CO₂ Avoided" : "CO₂ Produced";

    return `
      <article class="history-item ${typeClass}">
        <span class="pill green">${escapeHTML(action.category)}</span>
        <span class="pill ${action.impactType === "avoided" ? "green" : "red"}">${typeLabel}</span>

        <h3>${escapeHTML(action.title)}</h3>

        <p>
          <strong>${action.value} ${escapeHTML(action.unit)}</strong> ·
          Estimated ${action.co2.toFixed(1)} kg CO₂ ·
          ${date}
        </p>

        <p>${escapeHTML(action.notes || "No notes added.")}</p>

        <button class="danger" onclick="deleteAction(${action.id})">Delete</button>
      </article>
    `;
  }).join("");
}

function exportCSV() {
  const actions = getActions();

  if (actions.length === 0) {
    alert("No data to export.");
    return;
  }

  const headers = [
    "Title",
    "Category",
    "Impact Type",
    "Value",
    "Unit",
    "Estimated CO2",
    "Date",
    "Notes"
  ];

  const rows = actions.map(action => [
    action.title,
    action.category,
    action.impactType,
    action.value,
    action.unit,
    action.co2,
    new Date(action.date).toLocaleString(),
    action.notes
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(value => `"${String(value || "").replaceAll('"', '""')}"`).join(","))
    .join("\n");

  downloadFile(csv, "ecopulse-actions.csv", "text/csv");
}

function exportJSON() {
  const actions = getActions();

  if (actions.length === 0) {
    alert("No data to export.");
    return;
  }

  downloadFile(
    JSON.stringify(actions, null, 2),
    "ecopulse-actions.json",
    "application/json"
  );
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function copySummary() {
  const text = document.getElementById("ecoSummary").textContent;

  navigator.clipboard.writeText(text)
    .then(() => alert("Eco summary copied."))
    .catch(() => alert("Unable to copy. Please copy manually."));
}

function printReport() {
  window.print();
}

function loadDemoData() {
  const now = Date.now();

  const demo = [
    {
      id: now + 1,
      title: "Used public transport instead of driving",
      category: "Transport",
      impactType: "avoided",
      value: 12,
      unit: "km",
      co2: calculateCO2("Transport", "km", 12),
      date: new Date(now).toISOString(),
      notes: "Reduced car usage by taking public transport."
    },
    {
      id: now + 2,
      title: "Chose a plant-based meal",
      category: "Food",
      impactType: "avoided",
      value: 1,
      unit: "meal",
      co2: calculateCO2("Food", "meal", 1),
      date: new Date(now - 86400000).toISOString(),
      notes: "Selected a lower-carbon lunch option."
    },
    {
      id: now + 3,
      title: "Saved electricity by switching off devices",
      category: "Energy",
      impactType: "avoided",
      value: 3,
      unit: "kwh",
      co2: calculateCO2("Energy", "kwh", 3),
      date: new Date(now - 172800000).toISOString(),
      notes: "Turned off unused lights and devices."
    },
    {
      id: now + 4,
      title: "Used air conditioning for long hours",
      category: "Energy",
      impactType: "produced",
      value: 5,
      unit: "kwh",
      co2: calculateCO2("Energy", "kwh", 5),
      date: new Date(now - 259200000).toISOString(),
      notes: "Tracked a carbon-producing activity for awareness."
    }
  ];

  saveActions(demo);
  renderApp();
}

function resetData() {
  const confirmed = confirm("Reset all EcoPulse data?");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  activeChallenge = null;

  document.getElementById("challengeBox").innerHTML = `
    <h3>No active challenge yet</h3>
    <p>Generate a challenge to receive a practical sustainability mission.</p>
    <button onclick="generateChallenge()">Generate Challenge</button>
  `;

  renderApp();
}

function renderApp() {
  const actions = getActions();

  updateFilters(actions);
  renderDashboard(actions);
  renderBreakdown("categoryBreakdown", getCategoryStats(actions));
  renderBreakdown("typeBreakdown", getTypeStats(actions));
  renderInsight(actions);
  renderBadges(actions);
  renderSummary(actions);
  renderWeeklyTrend(actions);
  renderHistory(actions);
}

document.getElementById("actionDate").value = new Date().toISOString().slice(0, 10);
renderApp();
