// Live demos for the docs page. Each source icon is a plain static SVG;
// the motion comes only from the plan, applied by the skill's own engine.
const icon = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const hover = (n, sel) => `.icon-${n}:hover ${sel}, button:hover > .icon-${n} ${sel}`;

export const DEMOS = [
  {
    style: "wiggle", icon: "bell", trigger: "hover", prompt: "bell that rings on hover",
    desc: "Rotates back and forth from where it hangs, settling down.",
    svg: icon('<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9Z"/><path d="M10.3 20a1.9 1.9 0 0 0 3.4 0"/>'),
    plan: { name: "bell", trigger: "hover", targets: [{ el: 0, class: "bell-body" }, { el: 1, class: "bell-clapper" }],
      css: `.icon-bell .bell-body, .icon-bell .bell-clapper { transform-origin: 12px 3px; }
${hover("bell", ".bell-body")} { animation: bell-ring .6s cubic-bezier(.2,.8,.2,1); }
${hover("bell", ".bell-clapper")} { animation: bell-ring .6s cubic-bezier(.2,.8,.2,1) .04s; }
@keyframes bell-ring { 0%,100% { transform: rotate(0) } 20% { transform: rotate(14deg) } 40% { transform: rotate(-10deg) } 60% { transform: rotate(6deg) } 80% { transform: rotate(-3deg) } }` }
  },
  {
    style: "pop", icon: "star", trigger: "click", prompt: "star that pops when favorited, bouncy",
    desc: "Scales up past full size and settles, with overshoot.",
    svg: icon('<polygon points="12 3 14.8 8.8 21 9.6 16.5 14 17.6 20.2 12 17.3 6.4 20.2 7.5 14 3 9.6 9.2 8.8"/>'),
    plan: { name: "star", trigger: "click", targets: [{ el: 0, class: "star-shape" }],
      css: `.icon-star .star-shape { transform-box: fill-box; transform-origin: center; }
.icon-star.is-animating .star-shape { animation: star-pop .5s cubic-bezier(.34,1.56,.64,1); }
@keyframes star-pop { 0% { transform: scale(1) } 40% { transform: scale(1.22) } 70% { transform: scale(.94) } 100% { transform: scale(1) } }` }
  },
  {
    style: "shake", icon: "lock", trigger: "click", prompt: "lock that shakes when the password is wrong",
    desc: "Quick side-to-side shake that says no.",
    svg: icon('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    plan: { name: "lock", trigger: "click", targets: [{ el: 0, class: "lock-all" }, { el: 1, class: "lock-all" }],
      css: `.icon-lock.is-animating .lock-all { animation: lock-shake .42s cubic-bezier(.4,0,.2,1); }
@keyframes lock-shake { 0%,100% { transform: translateX(0) } 20% { transform: translateX(-2px) } 40% { transform: translateX(2px) } 60% { transform: translateX(-1.5px) } 80% { transform: translateX(1px) } }` }
  },
  {
    style: "nudge", icon: "arrow", trigger: "hover", prompt: "arrow that nudges forward on hover",
    desc: "Moves a couple of pixels the way it points, and back.",
    svg: icon('<line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>'),
    plan: { name: "arrow", trigger: "hover", targets: [{ el: 0, class: "arrow-all" }, { el: 1, class: "arrow-all" }],
      css: `${hover("arrow", ".arrow-all")} { animation: arrow-nudge .4s cubic-bezier(.2,.8,.2,1); }
@keyframes arrow-nudge { 0%,100% { transform: translateX(0) } 50% { transform: translateX(3px) } }` }
  },
  {
    style: "fly-through", icon: "send", trigger: "click", prompt: "send icon that flies off and comes back when clicked",
    desc: "Leaves in its direction, re-enters from the other side.",
    svg: icon('<path d="M21 3 10 14"/><path d="M21 3 14.5 21 11 14 4 10.5Z"/>'),
    plan: { name: "send", trigger: "click", targets: [{ el: 0, class: "send-plane" }, { el: 1, class: "send-plane" }],
      css: `.icon-send.is-animating .send-plane { animation: send-fly .7s cubic-bezier(.4,0,.2,1); }
@keyframes send-fly { 0% { transform: translate(0,0); opacity: 1 } 40% { transform: translate(7px,-7px); opacity: 0 } 41% { transform: translate(-7px,7px); opacity: 0 } 100% { transform: translate(0,0); opacity: 1 } }` }
  },
  {
    style: "bounce", icon: "pin", trigger: "hover", prompt: "map pin that bounces on hover",
    desc: "Hops up and lands with a small squash.",
    svg: icon('<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11Z"/><circle cx="12" cy="10" r="2"/>'),
    plan: { name: "pin", trigger: "hover", targets: [{ el: 0, class: "pin-all" }, { el: 1, class: "pin-all" }],
      css: `.icon-pin .pin-all { transform-origin: 12px 21px; }
${hover("pin", ".pin-all")} { animation: pin-bounce .6s cubic-bezier(.2,.8,.2,1); }
@keyframes pin-bounce { 0%,100% { transform: translateY(0) scaleY(1) } 30% { transform: translateY(-3px) scaleY(1.02) } 55% { transform: translateY(0) scaleY(.94) } 75% { transform: translateY(-1px) scaleY(1) } }` }
  },
  {
    style: "spin", icon: "refresh", trigger: "hover", prompt: "refresh icon that spins once on hover",
    desc: "One full clockwise turn around its centre.",
    svg: icon('<path d="M20 12a8 8 0 1 1-2.3-5.7L20 8.6"/><path d="M20 3.5v5.1h-5"/>'),
    plan: { name: "refresh", trigger: "hover", targets: [{ el: 0, class: "refresh-all" }, { el: 1, class: "refresh-all" }],
      css: `.icon-refresh .refresh-all { transform-origin: 12px 12px; }
${hover("refresh", ".refresh-all")} { animation: refresh-spin .6s cubic-bezier(.4,0,.2,1); }
@keyframes refresh-spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }` }
  },
  {
    style: "pulse", icon: "live", trigger: "ambient", prompt: "live indicator with waves pulsing out, loop",
    desc: "Rings fade in and out from the centre, looping.",
    svg: icon('<circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M5.6 5.6a9 9 0 0 0 0 12.8"/><path d="M18.4 5.6a9 9 0 0 1 0 12.8"/>'),
    plan: { name: "live", trigger: "ambient", targets: [{ el: 1, class: "live-inner" }, { el: 2, class: "live-inner" }, { el: 3, class: "live-outer" }, { el: 4, class: "live-outer" }],
      css: `.icon-live .live-inner { animation: live-wave 1.6s ease-in-out infinite; }
.icon-live .live-outer { animation: live-wave 1.6s ease-in-out .2s infinite; }
@keyframes live-wave { 0%,100% { opacity: 1 } 50% { opacity: .2 } }` }
  },
  {
    style: "draw", icon: "check", trigger: "entrance", prompt: "success check: ring draws, then the tick, when it appears",
    desc: "Strokes draw themselves in, one after another.",
    svg: icon('<circle cx="12" cy="12" r="9"/><polyline points="8 12.5 11 15.5 16 9.5"/>'),
    plan: { name: "check", trigger: "entrance", targets: [{ el: 0, class: "check-ring", drawLine: true }, { el: 1, class: "check-tick", drawLine: true }],
      css: `.icon-check .check-ring, .icon-check .check-tick { stroke-dasharray: 1; }
.icon-check.is-animating .check-ring { animation: check-draw .45s cubic-bezier(.2,.8,.2,1) both; }
.icon-check.is-animating .check-tick { animation: check-draw .3s cubic-bezier(.2,.8,.2,1) .35s both; }
@keyframes check-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }` }
  },
  {
    style: "lid", icon: "trash", trigger: "hover", prompt: "trash can whose lid lifts on hover",
    desc: "One part opens on its hinge while the rest stays put.",
    svg: icon('<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>'),
    plan: { name: "trash", trigger: "hover", targets: [{ el: 0, class: "trash-lid" }, { el: 1, class: "trash-lid" }],
      css: `.icon-trash .trash-lid { transform-origin: 4px 7px; transition: transform .3s cubic-bezier(.2,.8,.2,1); }
.icon-trash:hover .trash-lid, button:hover > .icon-trash .trash-lid { transform: translateY(-1px) rotate(-16deg); }` }
  },
  {
    style: "toggle", icon: "menu", trigger: "state", prompt: "menu that turns into an X when open",
    desc: "Existing lines rearrange into a new symbol, and back.",
    svg: icon('<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>'),
    plan: { name: "menu", trigger: "state", targets: [{ el: 0, class: "menu-top" }, { el: 1, class: "menu-mid" }, { el: 2, class: "menu-bot" }],
      css: `.icon-menu .menu-top, .icon-menu .menu-mid, .icon-menu .menu-bot { transform-origin: 12px 12px; transition: transform .3s cubic-bezier(.4,0,.2,1), opacity .2s cubic-bezier(.4,0,.2,1); }
.icon-menu[data-state="open"] .menu-top { transform: rotate(45deg) translateY(6px); }
.icon-menu[data-state="open"] .menu-mid { opacity: 0; }
.icon-menu[data-state="open"] .menu-bot { transform: rotate(-45deg) translateY(-6px); }` }
  },
  {
    style: "blink", icon: "eye", trigger: "hover", prompt: "eye that blinks on hover",
    desc: "Squashes shut for a moment and opens again.",
    svg: icon('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
    plan: { name: "eye", trigger: "hover", targets: [{ el: 0, class: "eye-all" }, { el: 1, class: "eye-all" }],
      css: `.icon-eye .eye-all { transform-origin: 12px 12px; }
${hover("eye", ".eye-all")} { animation: eye-blink .32s cubic-bezier(.4,0,.2,1); }
@keyframes eye-blink { 0%,100% { transform: scaleY(1) } 45%,55% { transform: scaleY(.1) } }` }
  },
  {
    style: "tilt", icon: "search", trigger: "hover", prompt: "search icon that tilts while hovered",
    desc: "Leans and holds while hovered, returns on leave.",
    svg: icon('<circle cx="11" cy="11" r="7"/><line x1="16" y1="16" x2="21" y2="21"/>'),
    plan: { name: "search", trigger: "hover", targets: [{ el: 0, class: "search-all" }, { el: 1, class: "search-all" }],
      css: `.icon-search .search-all { transform-origin: 11px 11px; transition: transform .3s cubic-bezier(.34,1.56,.64,1); }
.icon-search:hover .search-all, button:hover > .icon-search .search-all { transform: rotate(-14deg) scale(1.05); }` }
  },
  {
    style: "heartbeat", icon: "heart", trigger: "ambient", prompt: "heart with a heartbeat, loop with a pause",
    desc: "Two quick beats, then rest. Loops.",
    svg: icon('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>'),
    plan: { name: "heart", trigger: "ambient", targets: [{ el: 0, class: "heart-shape" }],
      css: `.icon-heart .heart-shape { transform-box: fill-box; transform-origin: center; animation: heart-beat 1.4s ease-in-out infinite; }
@keyframes heart-beat { 0%,40%,100% { transform: scale(1) } 10% { transform: scale(1.14) } 20% { transform: scale(1) } 30% { transform: scale(1.1) } }` }
  },
];
