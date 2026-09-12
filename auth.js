(function () {
  const STORAGE_KEY = "treasure-admin-unlocked";
  const PASSWORD_HASH = "0a0667865bc17f9d624bcf11088057bbab46336e7dae65f3d5366f4f7a18333e";
  let release;

  window.treasureAuthReady = new Promise(resolve => { release = resolve; });

  function addLogoutButton() {
    if (document.querySelector("#admin-logout")) return;
    const button = document.createElement("button");
    button.id = "admin-logout";
    button.className = "admin-logout";
    button.type = "button";
    button.textContent = "התנתקות";
    button.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("treasure-github-token");
      localStorage.removeItem("treasure-answer-cache");
      location.reload();
    });
    document.body.append(button);
  }

  function unlock() {
    localStorage.setItem(STORAGE_KEY, "yes");
    document.documentElement.classList.remove("auth-locked");
    document.querySelector("#auth-gate")?.remove();
    addLogoutButton();
    release();
  }

  async function sha256(value) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  }

  function showGate() {
    const gate = document.createElement("main");
    gate.id = "auth-gate";
    gate.className = "auth-gate";
    gate.innerHTML = `<form class="auth-card"><p class="eyebrow">TREASURE ADMIN</p><h1>כניסת מנהל</h1><p>הזינו סיסמה כדי לפתוח את עמוד הניהול.</p><label class="field"><span>סיסמה</span><input type="password" autocomplete="current-password" required autofocus></label><button class="button primary" type="submit">כניסה</button><p class="auth-feedback" role="alert" aria-live="polite"></p></form>`;
    document.body.append(gate);
    const form = gate.querySelector("form");
    const input = gate.querySelector("input");
    const feedback = gate.querySelector(".auth-feedback");
    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (await sha256(input.value) === PASSWORD_HASH) {
        unlock();
        return;
      }
      input.value = "";
      input.focus();
      feedback.textContent = "הסיסמה אינה נכונה.";
    });
  }

  if (localStorage.getItem(STORAGE_KEY) === "yes") {
    document.documentElement.classList.remove("auth-locked");
    document.addEventListener("DOMContentLoaded", addLogoutButton, { once: true });
    release();
  } else {
    document.documentElement.classList.add("auth-locked");
    document.addEventListener("DOMContentLoaded", showGate, { once: true });
  }
})();

