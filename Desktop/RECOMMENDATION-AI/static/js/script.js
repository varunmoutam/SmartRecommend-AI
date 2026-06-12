/**
 * script.js — AI Recommendation Logic
 * =====================================
 * Handles all frontend interactivity:
 *   - Search / recommendation requests to the Flask API
 *   - Rendering recommendation cards with animated progress bars
 *   - Dark / light theme toggle (persisted in localStorage)
 *   - Search history (stored in localStorage, max 10 entries)
 *   - Category filter population from /api/categories
 *   - Quick-select chips
 *   - Character counter
 *   - Toast notifications
 *   - Loading animations
 *   - Hero accent word rotation
 *
 * Author  : AI Recommendation Logic Project
 * Version : 1.0.0
 */

"use strict";

/* ============================================================
   0. Lucide icon initialisation (runs after DOM is ready)
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
  App.init();
});


/* ============================================================
   1. App namespace
   ============================================================ */
const App = (() => {

  /* ---- DOM references ---- */
  const dom = {};

  /* ---- State ---- */
  let searchHistory = [];
  const MAX_HISTORY = 10;

  /* ---- Accent words that cycle in the hero ---- */
  const ACCENT_WORDS = [
    "your skills",
    "your goals",
    "your career",
    "your growth",
    "your future",
  ];
  let accentIdx = 0;

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    _cacheDOM();
    _restoreTheme();
    _restoreHistory();
    _loadCategories();
    _bindEvents();
    _startAccentRotation();
  }

  function _cacheDOM() {
    dom.queryInput      = document.getElementById("queryInput");
    dom.categorySelect  = document.getElementById("categorySelect");
    dom.topNSelect      = document.getElementById("topNSelect");
    dom.recommendBtn    = document.getElementById("recommendBtn");
    dom.clearBtn        = document.getElementById("clearBtn");
    dom.charCounter     = document.getElementById("charCounter");
    dom.loadingSection  = document.getElementById("loadingSection");
    dom.loaderSub       = document.getElementById("loaderSub");
    dom.resultsSection  = document.getElementById("resultsSection");
    dom.cardsGrid       = document.getElementById("cardsGrid");
    dom.resultsBadge    = document.getElementById("resultsBadge");
    dom.resultsQueryText= document.getElementById("resultsQueryText");
    dom.emptyState      = document.getElementById("emptyState");
    dom.historySection  = document.getElementById("historySection");
    dom.historyList     = document.getElementById("historyList");
    dom.clearHistoryBtn = document.getElementById("clearHistoryBtn");
    dom.themeToggle     = document.getElementById("themeToggle");
    dom.themeIcon       = document.getElementById("themeIcon");
    dom.toast           = document.getElementById("toast");
    dom.toastMsg        = document.getElementById("toastMsg");
    dom.toastIcon       = document.getElementById("toastIcon");
    dom.quickChips      = document.getElementById("quickChips");
    dom.heroAccentWord  = document.getElementById("heroAccentWord");
  }


  /* ============================================================
     THEME
     ============================================================ */
  function _restoreTheme() {
    const saved = localStorage.getItem("ai-recommender-theme") || "dark";
    _applyTheme(saved);
  }

  function _applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    _updateThemeIcon(theme);
  }

  function _toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    _applyTheme(next);
    localStorage.setItem("ai-recommender-theme", next);
    // Re-render Lucide icons since we replaced the icon
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  function _updateThemeIcon(theme) {
    // Swap icon name via data attribute; lucide.createIcons() will pick it up
    if (!dom.themeIcon) return;
    dom.themeIcon.setAttribute("data-lucide", theme === "dark" ? "sun" : "moon");
    if (typeof lucide !== "undefined") lucide.createIcons();
  }


  /* ============================================================
     CATEGORIES
     ============================================================ */
  async function _loadCategories() {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success && Array.isArray(data.categories)) {
        // Clear existing options except the first "All categories"
        while (dom.categorySelect.options.length > 1) {
          dom.categorySelect.remove(1);
        }
        data.categories.forEach((cat) => {
          const opt = document.createElement("option");
          opt.value = cat;
          opt.textContent = cat;
          dom.categorySelect.appendChild(opt);
        });
      }
    } catch (err) {
      console.warn("Could not load categories:", err);
    }
  }


  /* ============================================================
     EVENTS
     ============================================================ */
  function _bindEvents() {
    // Textarea input
    dom.queryInput.addEventListener("input", _onQueryInput);
    dom.queryInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        _handleRecommend();
      }
    });

    // Buttons
    dom.recommendBtn.addEventListener("click", _handleRecommend);
    dom.clearBtn.addEventListener("click", _handleClear);
    dom.themeToggle.addEventListener("click", _toggleTheme);
    dom.clearHistoryBtn.addEventListener("click", _clearHistory);

    // Quick chips
    dom.quickChips.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const query = chip.dataset.query;
        dom.queryInput.value = query;
        _onQueryInput();           // updates counter + enables button
        _setActiveChip(chip);
        // Auto-run the recommendation immediately on chip click
        _handleRecommend();
      });
    });
  }

  function _onQueryInput() {
    const val = dom.queryInput.value;
    const len = val.length;
    dom.charCounter.textContent = `${len} / 500`;
    // Enable button whenever there is non-whitespace text
    dom.recommendBtn.disabled = val.trim().length === 0;

    // Sync active chip highlight
    const query = val.trim();
    dom.quickChips.querySelectorAll(".chip").forEach((c) => {
      c.classList.toggle("active", c.dataset.query === query);
    });
  }

  function _setActiveChip(activeChip) {
    dom.quickChips.querySelectorAll(".chip").forEach((c) =>
      c.classList.remove("active")
    );
    activeChip.classList.add("active");
  }


  /* ============================================================
     RECOMMEND
     ============================================================ */
  async function _handleRecommend() {
    const query = dom.queryInput.value.trim();
    if (!query) {
      showToast("Please enter at least one skill or interest.", "error");
      dom.queryInput.focus();
      return;
    }

    const category = dom.categorySelect.value;
    const topN     = parseInt(dom.topNSelect.value, 10);

    _showLoading(true);
    _hideResults();

    try {
      const res = await fetch("/api/recommend", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ query, top_n: topN, category }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unexpected server error.");
      }

      _addToHistory(query);
      _renderResults(data);

    } catch (err) {
      showToast(err.message || "Failed to fetch recommendations.", "error");
    } finally {
      _showLoading(false);
    }
  }

  function _handleClear() {
    dom.queryInput.value = "";
    dom.charCounter.textContent = "0 / 500";
    dom.recommendBtn.disabled = true;
    dom.quickChips.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    _hideResults();
    dom.queryInput.focus();
  }


  /* ============================================================
     RENDER RESULTS
     ============================================================ */
  function _renderResults(data) {
    dom.resultsSection.classList.remove("hidden");
    dom.resultsQueryText.textContent = `"${data.query}"`;

    if (!data.recommendations || data.recommendations.length === 0) {
      dom.resultsBadge.textContent = "0 results";
      dom.cardsGrid.innerHTML = "";
      dom.emptyState.classList.remove("hidden");
      return;
    }

    dom.emptyState.classList.add("hidden");
    dom.resultsBadge.textContent =
      `${data.recommendations.length} result${data.recommendations.length > 1 ? "s" : ""}`;

    dom.cardsGrid.innerHTML = "";

    data.recommendations.forEach((course, idx) => {
      const card = _buildCard(course, idx + 1);
      dom.cardsGrid.appendChild(card);
    });

    // Animate progress bars after a short paint delay
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelectorAll(".progress-bar__fill").forEach((bar) => {
          bar.style.width = bar.dataset.target + "%";
        });
      }, 80);
    });

    // Scroll to results
    dom.resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });

    // Re-render icons inside newly created cards
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  function _buildCard(course, rank) {
    const matchPct = course.match_percentage;
    const skills   = _parseSkills(course.skills);

    const card = document.createElement("article");
    card.className = "rec-card";
    card.style.animationDelay = `${(rank - 1) * 80}ms`;

    card.innerHTML = `
      <div class="rec-card__rank">#${rank}</div>

      <div class="rec-card__header">
        <span class="rec-card__category">
          <i data-lucide="${_categoryIcon(course.category)}"></i>
          ${_escape(course.category)}
        </span>
        <h3 class="rec-card__name">${_escape(course.course_name)}</h3>
      </div>

      <div class="rec-card__match">
        <div class="rec-card__match-top">
          <span class="rec-card__match-label">Match Score</span>
          <span class="rec-card__match-pct">${matchPct}%</span>
        </div>
        <div class="progress-bar" role="progressbar" aria-valuenow="${matchPct}" aria-valuemin="0" aria-valuemax="100">
          <div
            class="progress-bar__fill"
            data-target="${Math.min(matchPct, 100)}"
            style="width:0%"
          ></div>
        </div>
      </div>

      <p class="rec-card__desc">${_escape(course.description)}</p>

      <div class="rec-card__skills">
        ${_renderSkillTags(skills)}
      </div>
    `;

    return card;
  }

  function _parseSkills(skillsStr) {
    return skillsStr
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  function _renderSkillTags(skills) {
    const show  = skills.slice(0, 6);
    const extra = skills.length - show.length;
    let html = show.map((s) => `<span class="skill-tag">${_escape(s)}</span>`).join("");
    if (extra > 0) {
      html += `<span class="skill-tag skill-tag--more">+${extra} more</span>`;
    }
    return html;
  }

  /* Map category name → lucide icon name */
  function _categoryIcon(category) {
    const map = {
      "Data Science":        "bar-chart-2",
      "Machine Learning":    "cpu",
      "Deep Learning":       "layers",
      "Data Analytics":      "pie-chart",
      "Web Development":     "globe",
      "Mobile Development":  "smartphone",
      "Cloud Computing":     "cloud",
      "DevOps":              "settings-2",
      "Cybersecurity":       "shield",
      "Blockchain":          "link",
      "Data Engineering":    "database",
      "Design":              "pen-tool",
      "Game Development":    "gamepad-2",
      "IoT":                 "wifi",
      "Artificial Intelligence": "brain",
      "Project Management":  "clipboard-list",
      "Systems Programming": "terminal",
    };
    return map[category] || "book-open";
  }


  /* ============================================================
     LOADING
     ============================================================ */
  function _showLoading(show) {
    dom.loadingSection.classList.toggle("hidden", !show);
    if (show) {
      dom.loadingSection.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function _hideResults() {
    dom.resultsSection.classList.add("hidden");
    dom.cardsGrid.innerHTML = "";
    dom.emptyState.classList.add("hidden");
  }


  /* ============================================================
     SEARCH HISTORY
     ============================================================ */
  function _restoreHistory() {
    try {
      const stored = localStorage.getItem("ai-recommender-history");
      if (stored) {
        searchHistory = JSON.parse(stored);
        _renderHistory();
      }
    } catch (_) {
      searchHistory = [];
    }
  }

  function _addToHistory(query) {
    // Deduplicate and limit
    searchHistory = [query, ...searchHistory.filter((q) => q !== query)].slice(
      0,
      MAX_HISTORY
    );
    localStorage.setItem("ai-recommender-history", JSON.stringify(searchHistory));
    _renderHistory();
  }

  function _renderHistory() {
    if (searchHistory.length === 0) {
      dom.historySection.classList.add("hidden");
      return;
    }

    dom.historySection.classList.remove("hidden");
    dom.historyList.innerHTML = "";

    searchHistory.forEach((query, idx) => {
      const item = document.createElement("button");
      item.className = "history-item";
      item.innerHTML = `
        <i data-lucide="clock"></i>
        <span>${_escape(query)}</span>
        <span class="history-item__del" data-idx="${idx}" title="Remove">
          <i data-lucide="x"></i>
        </span>
      `;

      // Click on text → restore query and run
      item.addEventListener("click", (e) => {
        if (e.target.closest(".history-item__del")) return;
        dom.queryInput.value = query;
        _onQueryInput();
        _handleRecommend();
      });

      // Click on ✕ → remove from history
      item.querySelector(".history-item__del").addEventListener("click", (e) => {
        e.stopPropagation();
        _removeHistoryItem(idx);
      });

      dom.historyList.appendChild(item);
    });

    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  function _removeHistoryItem(idx) {
    searchHistory.splice(idx, 1);
    localStorage.setItem("ai-recommender-history", JSON.stringify(searchHistory));
    _renderHistory();
  }

  function _clearHistory() {
    searchHistory = [];
    localStorage.removeItem("ai-recommender-history");
    _renderHistory();
    showToast("Search history cleared.", "info");
  }


  /* ============================================================
     TOAST
     ============================================================ */
  let _toastTimer = null;

  function showToast(message, type = "info") {
    const iconMap = { success: "check-circle", error: "alert-circle", info: "info" };

    dom.toastMsg.textContent = message;
    dom.toastIcon.setAttribute("data-lucide", iconMap[type] || "info");
    dom.toast.className = `toast toast--${type}`;
    dom.toast.classList.remove("hidden");

    if (typeof lucide !== "undefined") lucide.createIcons();

    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => {
      dom.toast.classList.add("hidden");
    }, 3800);
  }


  /* ============================================================
     HERO ACCENT WORD ROTATION
     ============================================================ */
  function _startAccentRotation() {
    if (!dom.heroAccentWord) return;
    setInterval(() => {
      accentIdx = (accentIdx + 1) % ACCENT_WORDS.length;
      dom.heroAccentWord.style.opacity = "0";
      dom.heroAccentWord.style.transform = "translateY(-8px)";
      setTimeout(() => {
        dom.heroAccentWord.textContent = ACCENT_WORDS[accentIdx];
        dom.heroAccentWord.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        dom.heroAccentWord.style.opacity = "1";
        dom.heroAccentWord.style.transform = "translateY(0)";
      }, 300);
    }, 2800);
  }


  /* ============================================================
     UTILITY
     ============================================================ */
  function _escape(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  /* Public surface */
  return { init, showToast };

})();