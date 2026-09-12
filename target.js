const BASE_PATH = "/Treasure";

const extraStyles = document.createElement("link");
extraStyles.rel = "stylesheet";
extraStyles.href = `${BASE_PATH}/site-extra.css?v=20260912-3`;
document.head.append(extraStyles);
const homeLink = document.querySelector(".home-link");
if (homeLink) homeLink.textContent = "לעמוד הראשי (Admin only)";

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function loadTarget() {
  const root = document.querySelector("#quest-root");
  try {
    const response = await fetch(`${BASE_PATH}/data.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("לא ניתן לטעון את פרטי היעד.");
    const config = await response.json();
    const slug = location.pathname.split("/").filter(Boolean).at(-1).toLowerCase();
    const gameRows = config.rows.filter(row => row.game === config.activeGame).sort((a, b) => a.order - b.order);
    const index = gameRows.findIndex(row => row.slug === slug);
    if (index < 0) throw new Error("היעד אינו קיים במשחק הפעיל.");
    const row = gameRows[index];
    const next = gameRows[index + 1];
    document.title = `${row.targetName} | חפש את המטמון`;

    root.replaceChildren();
    const header = document.createElement("header");
    header.className = "quest-header";
    const step = document.createElement("p");
    step.className = "quest-step";
    step.textContent = `${config.activeGame} · יעד ${row.order} מתוך ${gameRows.length}`;
    const title = document.createElement("h1");
    title.textContent = row.targetName;
    header.append(step, title);

    const content = document.createElement("div");
    content.className = "quest-content";
    const description = document.createElement("p");
    description.className = "target-description";
    description.textContent = row.description || "ליעד זה טרם הוזן תיאור.";
    const riddleWrap = document.createElement("section");
    riddleWrap.className = "quest-section riddle-box";
    const riddleTitle = document.createElement("h2");
    riddleTitle.textContent = "החידה";
    const riddle = document.createElement("p");
    riddle.textContent = row.riddle || "ליעד זה טרם הוגדרה חידה.";
    riddleWrap.append(riddleTitle, riddle);

    if (row.riddle && row.answerHash) {
      const form = document.createElement("form");
      form.className = "answer-form";
      const input = document.createElement("input");
      input.type = "text";
      input.autocomplete = "off";
      input.placeholder = "הקלידו את התשובה המדויקת";
      input.setAttribute("aria-label", "תשובה לחידה");
      const submit = document.createElement("button");
      submit.className = "button primary";
      submit.type = "submit";
      submit.textContent = "בדיקת תשובה";
      const feedback = document.createElement("div");
      feedback.className = "feedback";
      form.append(input, submit);
      riddleWrap.append(form, feedback);
      form.addEventListener("submit", async event => {
        event.preventDefault();
        const acceptedHashes = row.answerHash.split(";").map(hash => hash.trim()).filter(Boolean);
        const correct = acceptedHashes.includes(await sha256(input.value.trim()));
        if (!correct) {
          feedback.className = "feedback error";
          feedback.textContent = "התשובה אינה מדויקת. נסו שוב.";
          return;
        }
        feedback.className = "feedback";
        feedback.textContent = "נכון מאוד!";
        showNext(content, next);
        input.disabled = true;
        submit.disabled = true;
      });
    }
    content.append(description, riddleWrap);
    root.append(header, content);
  } catch (error) {
    root.innerHTML = `<div class="quest-content"><h1>לא הצלחנו לפתוח את היעד</h1><p>${error.message}</p></div>`;
  }
}

function section(titleText, bodyText) {
  const wrapper = document.createElement("section");
  wrapper.className = "quest-section";
  const title = document.createElement("h2");
  title.textContent = titleText;
  const body = document.createElement("p");
  body.textContent = bodyText;
  wrapper.append(title, body);
  return wrapper;
}

function showNext(content, next) {
  if (content.querySelector(".next-directions")) return;
  const box = document.createElement("section");
  box.className = "next-directions";
  const title = document.createElement("h2");
  const body = document.createElement("p");
  if (next) {
    title.textContent = "הוראות הגעה ליעד הבא";
    body.textContent = next.directions || "ליעד הבא טרם הוזנו הוראות הגעה.";
  } else {
    title.textContent = "מצאתם את המטמון!";
    body.textContent = "כל הכבוד, השלמתם את כל יעדי המשחק.";
  }
  box.append(title, body);
  content.append(box);
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

loadTarget();

