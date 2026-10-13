/* Update button states in place so color transitions keep the same element. */
(() => {
  'use strict';
  const labels = {
    type: {
      primary: "Primary",
      secondary: "Secondary",
      outline: "Outline",
      ghost: "Ghost"
    },
    color: {
      accent: "Accent",
      neutral: "Neutral",
      critical: "Critical"
    },
    size: {
      l: "L / 40",
      m: "M / 32",
      s: "S / 24"
    },
    state: {
      default: "По умолчанию",
      hover: "Hover",
      active: "Active",
      disabled: "Disabled",
      loading: "Loading",
      "all-loading": "Только loader"
    }
  };

  const buttonTypes = ["primary", "secondary", "outline", "ghost"];
  const buttonSizes = ["l", "m", "s"];
  const colors = ["accent", "neutral", "critical"];
  const colorMeta = {
    accent: { title: "Accent", description: "Основное действие", dot: "#0e7d8f" },
    neutral: { title: "Neutral", description: "Нейтральное действие", dot: "#36393e" },
    critical: { title: "Critical", description: "Деструктивное действие", dot: "#d91528" }
  };

  const liveState = { type: "primary", color: "accent", size: "l", state: "default" };
  let showcaseState = "default";
  let ghostNotifyState = "default";
  let loadingTimer = 0;
  let statusTimer = 0;

  function applyButtonState(button, state) {
    button.dataset.state = state;
    button.disabled = state === "disabled";
    if (button.disabled) button.setAttribute("aria-disabled", "true");
    else button.removeAttribute("aria-disabled");
    if (state === "loading" || state === "all-loading") button.setAttribute("aria-busy", "true");
    else button.removeAttribute("aria-busy");
  }

  function buttonMarkup({ type, color, size, state, className = "" }) {
    const isDisabled = state === "disabled";
    return `
      <button
        class="ui-button ${className}"
        type="button"
        data-type="${type}"
        data-color="${color}"
        data-size="${size}"
        data-state="${state}"
        ${isDisabled ? "disabled aria-disabled=\"true\"" : ""}
        ${state === "loading" || state === "all-loading" ? "aria-busy=\"true\"" : ""}
      >
        <span class="ui-button__content">
          <span class="button-icon button-icon--leading" aria-hidden="true"></span>
          <span class="button-spinner button-spinner--leading" aria-hidden="true"></span>
          <span class="ui-button__label">Синхронизировать</span>
          <span class="button-icon button-icon--trailing" aria-hidden="true"></span>
          <span class="button-spinner button-spinner--only" aria-hidden="true"></span>
        </span>
      </button>`;
  }

  function ghostNotifyMarkup({ color, state }) {
    const isDisabled = state === "disabled";
    return `
      <button
        class="ghost-notify"
        type="button"
        data-color="${color}"
        data-state="${state}"
        ${isDisabled ? "disabled aria-disabled=\"true\"" : ""}
        ${state === "loading" || state === "all-loading" ? "aria-busy=\"true\"" : ""}
      >
        <span class="ghost-notify__label">Синхронизировать</span>
        <span class="ghost-notify__spinner" aria-hidden="true"></span>
      </button>`;
  }

  function updatePressed(container, selected) {
    container.querySelectorAll("button[data-choice]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.choice === selected));
    });
  }

  function updateLiveButton() {
    const mount = document.querySelector("#live-button-mount");
    let button = mount.querySelector(".ui-button");
    if (!button) {
      mount.innerHTML = buttonMarkup(liveState);
      button = mount.querySelector(".ui-button");
      button.addEventListener("click", () => {
        if (liveState.state !== "default") return;
        clearTimeout(statusTimer);
        liveState.state = "loading";
        syncControls();
        updateLiveButton();
        document.querySelector("#live-status").textContent = "Показываем состояние загрузки…";
        loadingTimer = window.setTimeout(() => {
          liveState.state = "default";
          syncControls();
          updateLiveButton();
          document.querySelector("#live-status").textContent = "Готово";
          statusTimer = window.setTimeout(() => {
            document.querySelector("#live-status").textContent = "";
          }, 1200);
        }, 900);
      });
    }
    for (const property of ["type", "color", "size"]) button.dataset[property] = liveState[property];
    applyButtonState(button, liveState.state);
    const caption = [labels.type[liveState.type], labels.color[liveState.color], labels.size[liveState.size], labels.state[liveState.state]].join(" · ");
    document.querySelector("#preview-caption").textContent = caption;

  }

  function syncControls() {
    document.querySelectorAll("[data-control]").forEach((control) => {
      updatePressed(control, liveState[control.dataset.control]);
    });
  }

  function renderShowcase() {
    const mount = document.querySelector("#showcase-mount");
    if (mount.querySelector(".demo-button")) {
      mount.querySelectorAll(".demo-button").forEach(button => applyButtonState(button, showcaseState));
      return;
    }
    mount.innerHTML = colors.map((color) => {
      const meta = colorMeta[color];
      return `
        <article class="showcase-section" aria-labelledby="${color}-title">
          <header class="section-header">
            <span class="color-dot" style="--section-color: ${meta.dot}" aria-hidden="true"></span>
            <h3 id="${color}-title">${meta.title}</h3>
            <p>${meta.description}</p>
          </header>
          <div class="section-content">
            ${buttonTypes.map((type) => `
              <div class="button-row">
                <span class="button-row__label">${labels.type[type]}</span>
                ${buttonSizes.map((size) => `
                  <div>
                    <span class="size-label">${labels.size[size]}</span>
                    ${buttonMarkup({ type, color, size, state: showcaseState, className: "demo-button" })}
                  </div>`).join("")}
              </div>`).join("")}
          </div>
        </article>`;
    }).join("");
  }

  function renderStateSwitcher() {
    const mount = document.querySelector("#showcase-state");
    if (mount.childElementCount) {
      mount.querySelectorAll("button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.stateChoice === showcaseState)));
      return;
    }
    mount.innerHTML = Object.entries(labels.state).map(([value, label]) => `
      <button class="segment" type="button" data-state-choice="${value}" aria-pressed="${value === showcaseState}">${label}</button>`).join("");

    mount.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        showcaseState = button.dataset.stateChoice;
        renderStateSwitcher();
        renderShowcase();
      });
    });
  }

  function renderGhostNotify() {
    const mount = document.querySelector("#ghost-notify-mount");
    if (mount.querySelector(".ghost-notify")) {
      mount.querySelectorAll(".ghost-notify").forEach(button => applyButtonState(button, ghostNotifyState));
      return;
    }
    mount.innerHTML = colors.map((color) => `
      <div class="compact-swatch">
        <span class="compact-swatch__label">${labels.color[color]}</span>
        ${ghostNotifyMarkup({ color, state: ghostNotifyState })}
      </div>`).join("");
  }

  function renderGhostNotifyStateSwitcher() {
    const mount = document.querySelector("#ghost-notify-state");
    if (mount.childElementCount) {
      mount.querySelectorAll("button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.notifyState === ghostNotifyState)));
      return;
    }
    mount.innerHTML = Object.entries(labels.state).map(([value, label]) => `
      <button class="segment" type="button" data-notify-state="${value}" aria-pressed="${value === ghostNotifyState}">${label}</button>`).join("");

    mount.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        ghostNotifyState = button.dataset.notifyState;
        renderGhostNotifyStateSwitcher();
        renderGhostNotify();
      });
    });
  }

  document.querySelectorAll("[data-control]").forEach((control) => {
    const property = control.dataset.control;
    control.querySelectorAll("button[data-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        clearTimeout(loadingTimer);
        clearTimeout(statusTimer);
        document.querySelector("#live-status").textContent = "";
        liveState[property] = button.dataset.choice;
        syncControls();
        updateLiveButton();
      });
    });
  });

  syncControls();
  updateLiveButton();
  renderStateSwitcher();
  renderShowcase();
  renderGhostNotifyStateSwitcher();
  renderGhostNotify();
})();
