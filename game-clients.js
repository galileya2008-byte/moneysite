(function () {
  "use strict";

  if (!document.querySelector("[data-catch-game]")) return;

  var gameArea = document.getElementById("ccgGameArea");
  var scoreValue = document.getElementById("ccgScoreValue");
  var timeValue = document.getElementById("ccgTimeValue");
  var startBtn = document.getElementById("ccgStartBtn");
  var resetBtn = document.getElementById("ccgResetBtn");
  var startMessage = document.getElementById("ccgStartMessage");
  var resultModal = document.getElementById("ccgResultModal");
  var finalScore = document.getElementById("ccgFinalScore");
  var resultTitle = document.getElementById("ccgResultTitle");
  var resultText = document.getElementById("ccgResultText");
  var resultFollowup = document.getElementById("ccgResultFollowup");
  var playAgainBtn = document.getElementById("ccgPlayAgainBtn");

  if (
    !gameArea ||
    !scoreValue ||
    !timeValue ||
    !startBtn ||
    !resetBtn ||
    !startMessage ||
    !resultModal ||
    !finalScore ||
    !resultTitle ||
    !resultText ||
    !resultFollowup ||
    !playAgainBtn
  ) {
    return;
  }

  var score = 0;
  var timeLeft = 30;
  var gameActive = false;
  var spawnTimer = null;
  var countdownTimer = null;
  var hintTimer = null;

  var RUB_PER_LANDING = 15000;

  function formatRub(amount) {
    return Math.round(amount).toLocaleString("ru-RU");
  }

  function eveningWordAfterNumber(n) {
    var n100 = n % 100;
    var n10 = n % 10;
    if (n100 >= 11 && n100 <= 14) return "вечеров";
    if (n10 === 1) return "вечер";
    if (n10 >= 2 && n10 <= 4) return "вечера";
    return "вечеров";
  }

  function eveningsWorkPhrase(n) {
    if (n === 1) return "примерно <strong>один вечер</strong> работы";
    return (
      "примерно <strong>" +
      n +
      "</strong> " +
      eveningWordAfterNumber(n) +
      " работы"
    );
  }

  function buildResultFollowup(currentScore) {
    var intro =
      "<strong>Подобные и многие другие игры для вовлечения</strong> вы сможете создавать самостоятельно. ";
    var rate =
      "Наш ученик на заказе мог бы получать <strong>от " +
      formatRub(RUB_PER_LANDING) +
      " ₽</strong> за каждый такой простой лендинг с вовлечением, если на одну страницу уходит <strong>один вечер</strong> работы (без сложной графики и долгих согласований). ";
    if (currentScore <= 0) {
      return (
        intro +
        rate +
        "При нулевом счёте в игре сумму не умножаем — сыграйте ещё раз или откройте программу: там разбираем сроки и прайс."
      );
    }
    var total = currentScore * RUB_PER_LANDING;
    return (
      intro +
      rate +
      "Если перевести ваш счёт в игре (<strong>" +
      currentScore +
      "</strong>) в такие «вечерние» лендинги один к одному, выходит <strong>до " +
      formatRub(total) +
      " ₽</strong> и " +
      eveningsWorkPhrase(currentScore) +
      "."
    );
  }

  var hints = [
    "Для своего проекта сайт связывает пост, лид-магнит и заявку в одну цепочку.",
    "В заказном проекте заказчику важно объяснить не «картинку», а путь клиента до оплаты.",
    "Автоматизация и формы снимают ручной сбор контактов и ошибки.",
    "Интерактив на странице удерживает внимание сильнее статичного блока.",
    "Воронка на сайте прогревает без лишних переписок в личке."
  ];

  var clientTypes = [
    { type: "normal", icon: "👤", text: "+1", points: 1, weight: 68 },
    { type: "hot", icon: "🔥", text: "+3", points: 3, weight: 20 },
    { type: "lost", icon: "💨", text: "−1", points: -1, weight: 12 }
  ];

  function weightedRandomType() {
    var total = clientTypes.reduce(function (sum, item) {
      return sum + item.weight;
    }, 0);
    var random = Math.random() * total;
    for (var i = 0; i < clientTypes.length; i++) {
      random -= clientTypes[i].weight;
      if (random <= 0) return clientTypes[i];
    }
    return clientTypes[0];
  }

  function updateUI() {
    scoreValue.textContent = String(score);
    timeValue.textContent = String(timeLeft);
  }

  function clearClients() {
    gameArea.querySelectorAll(".ccg-client, .ccg-float-score, .ccg-hint").forEach(function (el) {
      el.remove();
    });
  }

  function showFloatingScore(x, y, points) {
    var label = document.createElement("div");
    label.className = "ccg-float-score" + (points < 0 ? " ccg-float-score--minus" : "");
    label.textContent = points > 0 ? "+" + points : String(points);
    label.style.left = x + "px";
    label.style.top = y + "px";
    gameArea.appendChild(label);
    setTimeout(function () {
      label.remove();
    }, 760);
  }

  function spawnClient() {
    if (!gameActive) return;

    var areaRect = gameArea.getBoundingClientRect();
    var client = document.createElement("button");
    client.type = "button";
    var data = weightedRandomType();

    client.className = "ccg-client ccg-client--" + data.type;
    client.setAttribute("aria-label", data.text);
    client.innerHTML =
      '<span class="ccg-client-icon">' +
      data.icon +
      '</span><span class="ccg-client-text">' +
      data.text +
      "</span>";

    var narrow = window.innerWidth <= 820;
    var clientWidth = narrow ? 78 : 92;
    var clientHeight = narrow ? 68 : 76;
    var padding = 12;
    var maxX = Math.max(padding, areaRect.width - clientWidth - padding);
    var maxY = Math.max(padding, areaRect.height - clientHeight - padding);
    var x = Math.floor(Math.random() * (maxX - padding + 1)) + padding;
    var y = Math.floor(Math.random() * (maxY - padding + 1)) + padding;

    client.style.left = x + "px";
    client.style.top = y + "px";

    var clicked = false;

    client.addEventListener("click", function () {
      if (!gameActive || clicked) return;
      clicked = true;
      score = Math.max(0, score + data.points);
      updateUI();
      showFloatingScore(x + 34, y + 10, data.points);
      client.style.transform = "scale(0.85)";
      client.style.opacity = "0";
      setTimeout(function () {
        client.remove();
      }, 120);
    });

    gameArea.appendChild(client);

    var lifetime = data.type === "hot" ? 1800 : 2300;
    setTimeout(function () {
      if (!clicked && client.parentNode) {
        client.style.opacity = "0";
        client.style.transform = "scale(0.82)";
        setTimeout(function () {
          client.remove();
        }, 180);
      }
    }, lifetime);
  }

  function showHint() {
    if (!gameActive) return;
    gameArea.querySelectorAll(".ccg-hint").forEach(function (el) {
      el.remove();
    });
    var hint = document.createElement("div");
    hint.className = "ccg-hint";
    hint.textContent = hints[Math.floor(Math.random() * hints.length)];
    gameArea.appendChild(hint);
    setTimeout(function () {
      hint.remove();
    }, 3600);
  }

  function setModalOpen(open) {
    resultModal.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
  }

  function startGame() {
    resetGame(false);
    gameActive = true;
    startMessage.style.display = "none";
    startBtn.textContent = "Идёт раунд…";
    startBtn.disabled = true;
    startBtn.style.opacity = "0.7";

    spawnTimer = setInterval(spawnClient, 760);
    countdownTimer = setInterval(function () {
      timeLeft -= 1;
      updateUI();
      if (timeLeft <= 0) endGame();
    }, 1000);
    hintTimer = setInterval(showHint, 5600);
    showHint();
  }

  function endGame() {
    gameActive = false;
    clearInterval(spawnTimer);
    clearInterval(countdownTimer);
    clearInterval(hintTimer);
    startBtn.textContent = "Начать";
    startBtn.disabled = false;
    startBtn.style.opacity = "1";
    clearClients();
    showResult();
  }

  function showResult() {
    finalScore.textContent = String(score);
    resultTitle.textContent = "Вы поймали " + score + " обращений";

    if (score < 10) {
      resultText.textContent =
        "Много «мимо» — как в реальности, когда нет ясного следующего шага: ни для вашего запуска, ни для сайта заказчика. Имеет смысл собрать структуру страницы и воронку, а не только текст в соцсетях.";
    } else if (score <= 25) {
      resultText.textContent =
        "Неплохо: часть внимания вы удерживаете. Дальше — связать это с формой заявки, понятным оффером и (при работе на заказ) с брифом и ожиданиями клиента.";
    } else {
      resultText.textContent =
        "Сильный результат. На настоящем сайте такую механику можно связать с заявками, оплатой и сценарием под ваш продукт или под проект заказчика — это как раз разбирается в программе.";
    }

    resultFollowup.innerHTML = buildResultFollowup(score);
    setModalOpen(true);
  }

  function resetGame(showStart) {
    if (showStart === undefined) showStart = true;
    gameActive = false;
    score = 0;
    timeLeft = 30;
    clearInterval(spawnTimer);
    clearInterval(countdownTimer);
    clearInterval(hintTimer);
    clearClients();
    updateUI();
    startBtn.textContent = "Начать";
    startBtn.disabled = false;
    startBtn.style.opacity = "1";
    setModalOpen(false);
    startMessage.style.display = showStart ? "flex" : "none";
  }

  startBtn.addEventListener("click", startGame);
  resetBtn.addEventListener("click", function () {
    resetGame(true);
  });
  playAgainBtn.addEventListener("click", startGame);

  resultModal.addEventListener("click", function (event) {
    if (event.target === resultModal) {
      setModalOpen(false);
      startMessage.style.display = "flex";
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !resultModal.hidden) {
      setModalOpen(false);
      startMessage.style.display = "flex";
    }
  });

  updateUI();
})();
