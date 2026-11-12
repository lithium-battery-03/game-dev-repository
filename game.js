(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const canvas = $("game");
  const ctx = canvas.getContext("2d");
  const overlay = $("overlay");
  const startButton = $("start-button");
  const overlayKicker = $("overlay-kicker");
  const overlayTitle = $("overlay-title");
  const overlayCopy = $("overlay-copy");
  const scoreLabel = $("score");
  const bestLabel = $("best-score");
  const chaseFill = $("chase-fill");
  const chaseStatus = $("chase-status");
  const chaseMeter = $("chase-meter");
  const boostFill = $("boost-fill");
  const boostStatus = $("boost-status");
  const boostMeter = $("boost-meter");

  const W = canvas.width;
  const H = canvas.height;
  const FLOOR = 486;
  const BIRD_X = 245;
  const PIPE_W = 88;
  const GAP = 166;
  const BOOST_TIME = 0.72;
  const COOLDOWN = 2.6;
  const GRAVITY = 1180;
  const FLAP_POWER = -405;

  let state = "ready";
  let lastTime = 0;
  let time = 0;
  let score = 0;
  let best = 0;
  let chase = 12;
  let boostLeft = 0;
  let cooldown = 0;
  let pipeClock = 0;
  let pipes = [];
  let bird = { y: 260, vy: 0, tilt: 0, wing: 0 };
  let rival = { x: 74, y: 286, wing: 0 };
  let shake = 0;

  try { best = Number(localStorage.getItem("flappyChaseBest") || 0); } catch (_) {}
  bestLabel.textContent = String(best);

  function reset() {
    score = 0;
    chase = 12;
    boostLeft = 0;
    cooldown = 0;
    pipeClock = 0.9;
    pipes = [];
    bird = { y: 260, vy: 0, tilt: 0, wing: 0 };
    rival = { x: 74, y: 286, wing: 0 };
    scoreLabel.textContent = "0";
    updateBars();
  }

  function startGame() {
    if (state === "running") return;
    reset();
    state = "running";
    overlay.classList.add("hidden");
    flap();
  }

  function finish(reason) {
    if (state !== "running") return;
    state = "over";
    shake = 0.2;
    if (score > best) {
      best = score;
      bestLabel.textContent = String(best);
      try { localStorage.setItem("flappyChaseBest", String(best)); } catch (_) {}
    }
    overlayKicker.textContent = reason === "chase" ? "THE CHASER CAUGHT UP" : "FLIGHT OVER";
    overlayTitle.textContent = reason === "chase" ? "Too close!" : "Nice try!";
    overlayCopy.textContent = reason === "chase"
      ? "The rival bird caught you. You made it " + score + " pipe" + (score === 1 ? "" : "s") + " through."
      : "You made it " + score + " pipe" + (score === 1 ? "" : "s") + " through. Give it another shot!";
    startButton.textContent = "Fly again";
    overlay.classList.remove("hidden");
  }

  function flap() {
    if (state === "ready" || state === "over") {
      startGame();
      return;
    }
    if (state !== "running") return;
    bird.vy = FLAP_POWER;
    bird.wing = 1;
  }

  function boost() {
    if (state !== "running" || cooldown > 0 || boostLeft > 0) return;
    boostLeft = BOOST_TIME;
    cooldown = COOLDOWN;
    updateBars();
  }

  function addPipe() {
    const min = 88;
    const center = min + Math.random() * (FLOOR - min * 2 - GAP) + GAP / 2;
    pipes.push({ x: W + 20, gapY: center, passed: false });
  }

  function updateBars() {
    const chasePct = Math.round(chase);
    chaseFill.style.width = chasePct + "%";
    chaseMeter.setAttribute("aria-valuenow", String(chasePct));
    chaseStatus.textContent = chase < 35 ? "CLEAR" : chase < 65 ? "CLOSING IN" : chase < 90 ? "DANGER" : "INCOMING";
    chaseStatus.style.color = chase >= 65 ? "#ff8b83" : "#ffca78";

    const charge = cooldown <= 0 ? 100 : Math.max(0, 100 * (1 - cooldown / COOLDOWN));
    boostFill.style.width = charge + "%";
    boostMeter.setAttribute("aria-valuenow", String(Math.round(charge)));
    boostStatus.textContent = boostLeft > 0 ? "BOOSTING!" : cooldown > 0 ? cooldown.toFixed(1) + "s" : "READY";
  }

  function update(dt) {
    time += dt;
    if (state !== "running") {
      if (state === "ready") bird.y = 260 + Math.sin(time * 2.3) * 8;
      rival.wing = Math.sin(time * 12) * 0.8;
      return;
    }

    bird.vy += GRAVITY * dt;
    bird.y += bird.vy * dt;
    bird.tilt = Math.max(-0.48, Math.min(0.9, bird.vy / 650));
    bird.wing = Math.max(0, bird.wing - dt * 3.5);
    boostLeft = Math.max(0, boostLeft - dt);
    cooldown = Math.max(0, cooldown - dt);

    const boosted = boostLeft > 0;
    const speed = boosted ? 315 : 220;
    chase = Math.max(0, Math.min(100, chase + (boosted ? -36 : 12) * dt));
    rival.x = 74 + chase * 1.05;
    rival.y += (bird.y + 9 - rival.y) * Math.min(1, dt * 2.6);
    rival.wing = Math.sin(time * 17) * 0.95;

    pipeClock -= dt;
    if (pipeClock <= 0) {
      addPipe();
      pipeClock = 1.72;
    }
    for (const pipe of pipes) {
      pipe.x -= speed * dt;
      if (!pipe.passed && pipe.x + PIPE_W < BIRD_X) {
        pipe.passed = true;
        score += 1;
        scoreLabel.textContent = String(score);
      }
    }
    pipes = pipes.filter(pipe => pipe.x + PIPE_W > -20);

    if (bird.y - 17 < 0 || bird.y + 17 > FLOOR) {
      finish("pipe");
      return;
    }
    for (const pipe of pipes) {
      const hitX = BIRD_X + 17 > pipe.x && BIRD_X - 17 < pipe.x + PIPE_W;
      const outsideGap = bird.y - 15 < pipe.gapY - GAP / 2 || bird.y + 15 > pipe.gapY + GAP / 2;
      if (hitX && outsideGap) {
        finish("pipe");
        return;
      }
    }
    if (chase >= 100) {
      finish("chase");
      return;
    }
    if (shake > 0) shake = Math.max(0, shake - dt);
    updateBars();
  }

  function draw() {
    ctx.save();
    if (shake > 0) {
      const amount = shake * 20;
      ctx.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
    }
    drawSky();
    drawPipes();
    drawGround();
    drawRival();
    drawBird();
    if (state === "running" && boostLeft > 0) drawSpeedLines();
    ctx.restore();
  }

  function drawSky() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#46365f");
    sky.addColorStop(0.46, "#bd6579");
    sky.addColorStop(0.76, "#f39a70");
    sky.addColorStop(1, "#ffd08b");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 35; i++) {
      const x = (i * 173 + 41) % W;
      const y = 28 + ((i * 79) % 205);
      ctx.globalAlpha = 0.25 + (Math.sin(time * 1.3 + i) + 1) * 0.16;
      ctx.fillStyle = "#fff4d8";
      ctx.beginPath();
      ctx.arc(x, y, 1 + (i % 3) * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const glow = ctx.createRadialGradient(735, 286, 20, 735, 286, 180);
    glow.addColorStop(0, "rgba(255,219,151,.48)");
    glow.addColorStop(1, "rgba(255,219,151,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(545, 96, 380, 380);
    ctx.fillStyle = "#ffd69a";
    ctx.beginPath();
    ctx.arc(735, 286, 67, 0, Math.PI * 2);
    ctx.fill();

    drawCloud(110 - (time * 9 % 1120), 112, 1);
    drawCloud(440 - (time * 9 % 1120), 158, 0.72);
    drawCloud(755 - (time * 9 % 1120), 93, 1.18);
    drawHills();
  }

  function drawCloud(x, y, scale) {
    if (x < -100) x += 1200;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(255,210,190,.2)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 46, 12, 0, 0, Math.PI * 2);
    ctx.arc(-19, -7, 15, Math.PI, Math.PI * 2);
    ctx.arc(1, -13, 20, Math.PI, Math.PI * 2);
    ctx.arc(22, -5, 14, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHills() {
    ctx.fillStyle = "#70445f";
    ctx.beginPath();
    ctx.moveTo(0, 403); ctx.lineTo(0, 350); ctx.lineTo(110, 302);
    ctx.lineTo(220, 371); ctx.lineTo(350, 309); ctx.lineTo(495, 387);
    ctx.lineTo(630, 326); ctx.lineTo(790, 383); ctx.lineTo(900, 314);
    ctx.lineTo(960, 346); ctx.lineTo(960, 460); ctx.lineTo(0, 460);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#4b3552";
    ctx.beginPath();
    ctx.moveTo(0, 433); ctx.lineTo(145, 379); ctx.lineTo(285, 431);
    ctx.lineTo(420, 367); ctx.lineTo(570, 434); ctx.lineTo(735, 375);
    ctx.lineTo(865, 428); ctx.lineTo(960, 390); ctx.lineTo(960, 485);
    ctx.lineTo(0, 485); ctx.closePath(); ctx.fill();
  }

  function drawPipes() {
    for (const pipe of pipes) {
      const topEnd = pipe.gapY - GAP / 2;
      const bottomStart = pipe.gapY + GAP / 2;
      drawPipe(pipe.x, -15, PIPE_W, topEnd + 15, true);
      drawPipe(pipe.x, bottomStart, PIPE_W, FLOOR - bottomStart + 15, false);
    }
  }

  function drawPipe(x, y, width, height, topPipe) {
    const grad = ctx.createLinearGradient(x, 0, x + width, 0);
    grad.addColorStop(0, "#426b64");
    grad.addColorStop(0.22, "#78a77b");
    grad.addColorStop(0.55, "#5a916e");
    grad.addColorStop(1, "#315c59");
    ctx.fillStyle = grad;
    ctx.fillRect(x + 8, y, width - 16, height);
    ctx.fillStyle = "#9bc18b"; ctx.fillRect(x + 12, y, 7, height);
    ctx.fillStyle = "#31584f"; ctx.fillRect(x + width - 19, y, 7, height);
    const lipY = topPipe ? y + height - 25 : y;
    ctx.fillStyle = "#6b9b70"; ctx.fillRect(x, lipY, width, 25);
    ctx.fillStyle = "#a8c68e"; ctx.fillRect(x + 3, lipY + 3, 8, 18);
    ctx.fillStyle = "#345d53"; ctx.fillRect(x + width - 10, lipY + 3, 7, 18);
    ctx.strokeStyle = "rgba(29,64,57,.35)"; ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, lipY + 1, width - 2, 23);
  }

  function drawGround() {
    const ground = ctx.createLinearGradient(0, FLOOR, 0, H);
    ground.addColorStop(0, "#79515e"); ground.addColorStop(1, "#362b49");
    ctx.fillStyle = ground; ctx.fillRect(0, FLOOR, W, H - FLOOR);
    ctx.fillStyle = "#e6a16f"; ctx.fillRect(0, FLOOR, W, 5);
    ctx.fillStyle = "rgba(255,214,163,.22)";
    const offset = time * 95 % 42;
    for (let x = -42 + offset; x < W; x += 42) ctx.fillRect(x, FLOOR + 17, 19, 3);
  }

  function drawBirdShape(x, y, scale, enemy, wing) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.rotate(enemy ? 0 : bird.tilt * 0.55);
    ctx.fillStyle = enemy ? "#443653" : "#ffc56e";
    ctx.beginPath(); ctx.ellipse(0, 0, 19, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = enemy ? "#75617d" : "#ffcf78";
    ctx.beginPath(); ctx.ellipse(-4, 2 + wing * 5, 10, 6, -wing * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = enemy ? "#37283e" : "#f09a61";
    ctx.beginPath(); ctx.moveTo(15, -3); ctx.lineTo(30, 1); ctx.lineTo(15, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff8e9"; ctx.beginPath(); ctx.arc(8, -7, 5.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#30263e"; ctx.beginPath(); ctx.arc(10, -7, 2.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawBird() { drawBirdShape(BIRD_X, bird.y, 1, false, bird.wing); }
  function drawRival() {
    drawBirdShape(rival.x, rival.y, 0.88, true, rival.wing);
    if (state === "running" && chase > 70) {
      ctx.fillStyle = "rgba(255,119,112,.16)";
      ctx.beginPath(); ctx.arc(rival.x, rival.y, 31, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawSpeedLines() {
    ctx.save();
    ctx.globalAlpha = 0.45; ctx.strokeStyle = "#f1d8ff"; ctx.lineWidth = 3;
    for (let i = 0; i < 7; i++) {
      const y = 130 + ((i * 61 + time * 180) % 300);
      ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(150 + (i % 3) * 25, y); ctx.stroke();
    }
    ctx.restore();
  }

  function tick(timestamp) {
    const dt = Math.min((timestamp - (lastTime || timestamp)) / 1000, 0.033);
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(tick);
  }

  startButton.addEventListener("click", startGame);
  $("flap-button").addEventListener("click", flap);
  $("boost-button").addEventListener("click", boost);
  canvas.addEventListener("pointerdown", function (event) {
    if (event.button === 0) flap();
  });
  window.addEventListener("keydown", function (event) {
    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      if (!event.repeat) flap();
    }
    if (event.code === "KeyW") {
      event.preventDefault();
      if (!event.repeat) boost();
    }
    if ((event.code === "Enter" || event.code === "KeyR") && state !== "running") startGame();
  });

  updateBars();
  requestAnimationFrame(tick);
})();