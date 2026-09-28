const scroll = document.querySelector("#weddingScroll");
const parchment = document.querySelector(".parchment");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const showOpenState = new URLSearchParams(window.location.search).has("open");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const OPEN_DELAY = 800;
const OPEN_DURATION = 4150;
let timers = [];

function clearTimers() {
  timers.forEach(window.clearTimeout);
  timers = [];
}

function openInvitation() {
  if (!scroll || prefersReducedMotion.matches || showOpenState) {
    scroll?.classList.add("is-open", "is-complete");
    return;
  }

  clearTimers();
  scroll.classList.remove("is-open", "is-opening", "is-complete", "is-settling");
  void scroll.offsetWidth;

  timers.push(window.setTimeout(() => {
    scroll.classList.add("is-opening", "is-open");
    timers.push(window.setTimeout(() => {
      scroll.classList.remove("is-opening");
      scroll.classList.add("is-complete", "is-settling");
      timers.push(window.setTimeout(() => {
        scroll.classList.remove("is-settling");
      }, 850));
    }, OPEN_DURATION));
  }, OPEN_DELAY));
}

function replay(event) {
  if (event?.type === "keydown" && !["Enter", " ", "r", "R"].includes(event.key)) return;
  if (!scroll?.classList.contains("is-complete") || prefersReducedMotion.matches) return;
  openInvitation();
}

openInvitation();
document.addEventListener("click", replay);
document.addEventListener("keydown", replay);
prefersReducedMotion.addEventListener?.("change", openInvitation);

const stage = document.querySelector(".invitation-stage");
const shadow = document.querySelector(".scroll-shadow");
const cursor = document.querySelector(".custom-cursor");
const tassels = [...document.querySelectorAll(".tassel")];
const bouquets = [...document.querySelectorAll(".background-bouquet")];
const tasselMotion = tassels.map((element, index) => ({ element, angle: 0, velocity: 0, target: 0, restDirection: index % 2 ? -1 : 1 }));
let pointer = { x: 0, y: 0, inside: false };
let depth = { x: 0, y: 0, targetX: 0, targetY: 0 };
let activeDetail = null;
let motionFrame = 0;
let candlelight = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };

function pointerMotionCapable() {
  return window.innerWidth > 700 && finePointer.matches && !prefersReducedMotion.matches;
}

function interactionsEnabled() {
  return pointerMotionCapable() && scroll?.classList.contains("is-complete") && !scroll.classList.contains("is-settling");
}

function resetProximity() {
  bouquets.forEach((bouquet) => {
    bouquet.style.setProperty("--prox-x", "0px");
    bouquet.style.setProperty("--prox-y", "0px");
  });
}

function updatePointer(event) {
  pointer = { x: event.clientX, y: event.clientY, inside: true };
  if (!pointerMotionCapable()) return;
  const detail = event.target.closest(".name,.ampersand,.event");
  if (detail !== activeDetail) {
    activeDetail?.classList.remove("is-hovered");
    activeDetail = detail;
    activeDetail?.classList.add("is-hovered");
  }
  if (cursor) {
    cursor.classList.add("is-visible");
    cursor.classList.toggle("is-interactive", Boolean(event.target.closest(".name,.ampersand,.tassel")));
    cursor.style.transform = `translate3d(${event.clientX - 12}px,${event.clientY - 12}px,0)`;
  }

  const enabled = interactionsEnabled();
  const paperHit = event.target.closest(".parchment");
  if (enabled && paperHit && parchment) {
    const paperRect = parchment.getBoundingClientRect();
    candlelight.targetX = Math.max(0, Math.min(paperRect.width, event.clientX - paperRect.left));
    candlelight.targetY = Math.max(0, Math.min(paperRect.height, event.clientY - paperRect.top));
    if (!candlelight.active) {
      candlelight.x = candlelight.targetX;
      candlelight.y = candlelight.targetY;
    }
    candlelight.active = true;
    parchment.classList.add("has-candlelight");
  } else {
    candlelight.active = false;
    parchment?.classList.remove("has-candlelight");
  }

  if (!enabled) return;
  const rect = scroll.getBoundingClientRect();
  const nx = Math.max(-1, Math.min(1, (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)));
  const ny = Math.max(-1, Math.min(1, (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)));
  depth.targetX = nx;
  depth.targetY = ny;

  bouquets.forEach((bouquet) => {
    const box = bouquet.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const dx = cx - event.clientX;
    const dy = cy - event.clientY;
    const distance = Math.hypot(dx, dy);
    const influence = Math.max(0, 1 - distance / 150);
    const scale = distance ? (influence * 3) / distance : 0;
    bouquet.style.setProperty("--prox-x", `${(dx * scale).toFixed(2)}px`);
    bouquet.style.setProperty("--prox-y", `${(dy * scale).toFixed(2)}px`);
  });

  tasselMotion.forEach((item) => {
    const box = item.element.getBoundingClientRect();
    const anchorX = box.left + box.width / 2;
    const anchorY = box.top;
    const dx = event.clientX - anchorX;
    const dy = event.clientY - anchorY;
    const distance = Math.hypot(dx, dy);
    const influence = Math.max(0, 1 - distance / 105);
    const direction = Math.abs(dx) < 10 ? item.restDirection : -Math.sign(dx);
    const strength = Math.abs(dx) < 10 ? 4.5 : Math.min(6, 2.2 + Math.abs(dx) * 0.055);
    item.target = direction * strength * influence;
  });
}

function leaveStage() {
  pointer.inside = false;
  depth.targetX = 0;
  depth.targetY = 0;
  tasselMotion.forEach((item) => { item.target = 0; });
  resetProximity();
  activeDetail?.classList.remove("is-hovered");
  activeDetail = null;
  candlelight.active = false;
  parchment?.classList.remove("has-candlelight");
  cursor?.classList.remove("is-visible", "is-interactive");
}

function animateInteractions() {
  motionFrame = 0;
  if (!pointerMotionCapable()) return;
  const enabled = interactionsEnabled();
  if (!enabled) {
    depth.targetX = 0;
    depth.targetY = 0;
    tasselMotion.forEach((item) => { item.target = 0; });
    candlelight.active = false;
    parchment?.classList.remove("has-candlelight");
  }

  depth.x += (depth.targetX - depth.x) * 0.075;
  depth.y += (depth.targetY - depth.y) * 0.075;
  scroll?.style.setProperty("--float-x", `${(depth.x * 3).toFixed(3)}px`);
  scroll?.style.setProperty("--float-y", `${(depth.y * 2.5).toFixed(3)}px`);
  scroll?.style.setProperty("--tilt-x", `${(-depth.y * 1.15).toFixed(3)}deg`);
  scroll?.style.setProperty("--tilt-y", `${(depth.x * 1.25).toFixed(3)}deg`);
  shadow?.style.setProperty("--shadow-x", `${(-depth.x * 4).toFixed(3)}px`);
  shadow?.style.setProperty("--shadow-y", `${(-depth.y * 2).toFixed(3)}px`);

  if (candlelight.active && parchment) {
    candlelight.x += (candlelight.targetX - candlelight.x) * 0.2;
    candlelight.y += (candlelight.targetY - candlelight.y) * 0.2;
    parchment.style.setProperty("--candle-x", `${candlelight.x.toFixed(2)}px`);
    parchment.style.setProperty("--candle-y", `${candlelight.y.toFixed(2)}px`);
  }

  tasselMotion.forEach((item) => {
    const spring = (item.target - item.angle) * 0.045;
    item.velocity = (item.velocity + spring) * 0.89;
    item.angle += item.velocity;
    item.element.style.setProperty("--tassel-angle", `${item.angle.toFixed(3)}deg`);
  });
  motionFrame = requestAnimationFrame(animateInteractions);
}

function ensureMotionLoop() {
  if (!motionFrame && pointerMotionCapable()) motionFrame = requestAnimationFrame(animateInteractions);
}

stage?.addEventListener("pointermove", updatePointer, { passive: true });
stage?.addEventListener("pointerleave", leaveStage);
window.addEventListener("blur", leaveStage);
window.addEventListener("resize", () => {
  if (window.innerWidth <= 700) leaveStage();
  ensureMotionLoop();
}, { passive: true });
finePointer.addEventListener?.("change", () => { leaveStage(); ensureMotionLoop(); });
prefersReducedMotion.addEventListener?.("change", ensureMotionLoop);
ensureMotionLoop();
