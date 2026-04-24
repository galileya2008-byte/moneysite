(function () {
  "use strict";

  var GOAL_KEY = "sajtyNaIi_goal";
  var BANNER_KEY = "sajtyNaIi_goalBannerClosed";

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("visible");
      });
      return;
    }
    var obs = new IntersectionObserver(
      function (entries, o) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            o.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    );
    items.forEach(function (el) {
      obs.observe(el);
    });
  }

  function getGoalText(goal) {
    if (goal === "self") {
      return "Вы отметили фокус: сайт для себя. В полной программе — оффер, воронка и публикация.";
    }
    if (goal === "clients") {
      return "Вы отметили: лендинги и сайты на заказ. Во втором тарифе — бриф, портфолио и первые продажи.";
    }
    if (goal === "both") {
      return "Выбран путь: и для себя, и для клиентов. См. модули по монетизации и работе с заказом.";
    }
    return "";
  }

  function initWelcome() {
    var picker = document.getElementById("goal-picker");
    var status = document.getElementById("goal-status");
    if (!picker) return;

    var saved = localStorage.getItem(GOAL_KEY);
    function highlight(goal) {
      picker.querySelectorAll(".goal-btn").forEach(function (btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-goal") === goal);
      });
    }

    if (saved) {
      highlight(saved);
      if (status) {
        status.textContent = "Сохранено. На странице программы появится подсказка под вашу цель.";
        status.hidden = false;
      }
    }

    picker.addEventListener("click", function (e) {
      var t = e.target && e.target.closest(".goal-btn");
      if (!t) return;
      var goal = t.getAttribute("data-goal");
      if (!goal) return;
      localStorage.setItem(GOAL_KEY, goal);
      sessionStorage.removeItem(BANNER_KEY);
      highlight(goal);
      var hint = t.getAttribute("data-goal-hint");
      if (status) {
        status.textContent = "Сохранено: " + (hint || "");
        status.hidden = false;
      }
    });
  }

  function initCourse() {
    var goal = localStorage.getItem(GOAL_KEY);
    var banner = document.getElementById("goal-banner");
    var textEl = document.getElementById("goal-banner-text");
    if (goal && banner && textEl) {
      var msg = getGoalText(goal);
      if (msg && !sessionStorage.getItem(BANNER_KEY)) {
        textEl.textContent = msg;
        banner.hidden = false;
      }
    }
    var closeBtn = document.getElementById("goal-banner-close");
    if (closeBtn && banner) {
      closeBtn.addEventListener("click", function () {
        sessionStorage.setItem(BANNER_KEY, "1");
        banner.hidden = true;
      });
    }

    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("main-nav");
    if (toggle && nav) {
      function setOpen(open) {
        document.body.classList.toggle("menu-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) {
          document.body.style.overflow = "hidden";
        } else {
          document.body.style.removeProperty("overflow");
        }
      }
      toggle.addEventListener("click", function () {
        setOpen(!document.body.classList.contains("menu-open"));
      });
      nav.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          setOpen(false);
        });
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") setOpen(false);
      });
      window.addEventListener("resize", function () {
        if (window.innerWidth >= 980) setOpen(false);
      });
    }
  }

  var page = document.body && document.body.getAttribute("data-page");
  initReveal();
  if (page === "welcome") initWelcome();
  if (page === "course") initCourse();
})();
