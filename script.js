const scroll = document.querySelector("#weddingScroll");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const showOpenState = new URLSearchParams(window.location.search).has("open");
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
  scroll.classList.remove("is-open", "is-opening", "is-complete");
  void scroll.offsetWidth;

  timers.push(window.setTimeout(() => {
    scroll.classList.add("is-opening", "is-open");
    timers.push(window.setTimeout(() => {
      scroll.classList.remove("is-opening");
      scroll.classList.add("is-complete");
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
