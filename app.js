-(function () {
  "use strict";

  var GOAL_KEY = "sajtyNaIi_goal";
  var BANNER_KEY = "sajtyNaIi_goalBannerClosed";
  var CHECKLIST_KEY = "sajtyNaIi_checklistState";

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

    var checklistForm = document.getElementById("interactive-checklist");
    if (checklistForm) {
      initChecklist(checklistForm);
    }
  }

  function initChecklist(form) {
    var inputs = Array.prototype.slice.call(form.querySelectorAll("input[type='checkbox']"));
    var countEl = document.getElementById("checklist-count");
    var progressFill = document.getElementById("checklist-progress-fill");
    var resultTitle = document.getElementById("checklist-result-title");
    var resultText = document.getElementById("checklist-result-text");
    var resultCta = document.getElementById("checklist-result-cta");
    if (!inputs.length || !countEl || !progressFill || !resultTitle || !resultText || !resultCta) return;

    var saved = localStorage.getItem(CHECKLIST_KEY);
    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        inputs.forEach(function (input) {
          if (parsed.indexOf(input.value) !== -1) {
            input.checked = true;
          }
        });
      } catch (e) {
        localStorage.removeItem(CHECKLIST_KEY);
      }
    }

    function getState(selectedCount) {
      if (selectedCount <= 2) {
        return {
          title: "Вы в начале пути — это нормально.",
          text: "Спокойно соберите базу: оффер, структуру и понятную страницу под свой продукт. Это даст уверенный старт.",
          cta: "Выбрать тариф «Для себя»",
          href: "https://neirogalina.ru/page247"
        };
      }
      if (selectedCount <= 5) {
        return {
          title: "У вас уже хороший фундамент.",
          text: "Осталось собрать систему воронки и выбрать формат участия по вашей цели. Вы двигаетесь в правильном темпе.",
          cta: "Сравнить тарифы",
          href: "#tariffs"
        };
      }
      return {
        title: "Вы почти готовы к монетизации навыка.",
        text: "Можно идти в расширенный формат: клиентские проекты, вовлекающие онлайн-игры и Telegram-боты для записей и оповещений.",
        cta: "Выбрать тариф «Для себя и на заказ»",
        href: "https://neirogalina.ru/page248"
      };
    }

    function update() {
      var selected = inputs.filter(function (input) {
        return input.checked;
      });

      inputs.forEach(function (input) {
        var item = input.closest(".checklist-item");
        if (item) item.classList.toggle("is-checked", input.checked);
      });

      var count = selected.length;
      var total = inputs.length;
      var percent = Math.round((count / total) * 100);
      countEl.textContent = count + "/" + total;
      progressFill.style.width = percent + "%";

      var state = getState(count);
      resultTitle.textContent = state.title;
      resultText.textContent = state.text;
      resultCta.textContent = state.cta;
      resultCta.setAttribute("href", state.href);
      if (state.href.indexOf("http") === 0) {
        resultCta.setAttribute("target", "_blank");
        resultCta.setAttribute("rel", "noopener noreferrer");
      } else {
        resultCta.removeAttribute("target");
        resultCta.removeAttribute("rel");
      }

      var selectedValues = selected.map(function (input) {
        return input.value;
      });
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(selectedValues));
    }

    form.addEventListener("change", update);
    update();
  }

  var page = document.body && document.body.getAttribute("data-page");
  initReveal();
  if (page === "welcome") initWelcome();
  if (page === "course") initCourse();
})();
