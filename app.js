document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root");
  root.innerHTML = DebugConsole() + Profile();

  const terminal = document.getElementById("terminal-overlay");
  const terminalBody = document.getElementById("terminal-body");
  const launchButton = document.getElementById("terminal-launch-btn");
  const clickHint = document.getElementById("click-indicator");

  let introIndex = 0;

  function terminalLine(item) {
    const line = document.createElement("div");
    line.className = "terminal-line";

    if (item.type === "command") {
      line.innerHTML = `<span class="terminal-prompt">${item.prompt}</span><span class="terminal-path">:${item.path}$</span><span class="terminal-command"> ${item.text}</span>`;
    } else if (item.type === "success") {
      line.innerHTML = `<span class="terminal-success">${item.text}</span>`;
    } else if (item.type === "warning") {
      line.innerHTML = `<span class="terminal-warning">${item.text}</span>`;
    } else if (item.type === "error") {
      line.innerHTML = `<span class="terminal-error">${item.text}</span>`;
    } else if (item.type === "neo") {
      line.innerHTML = item.text;
      line.style.whiteSpace = "pre";
    } else {
      line.innerHTML = `<span class="terminal-output">${item.text || ""}</span>`;
    }

    terminalBody.appendChild(line);
    requestAnimationFrame(() => line.classList.add("visible"));
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  function nextIntroLine() {
    const commands = getTerminalCommands();
    const item = commands[introIndex];

    if (!item) return;

    if (item.type === "wait") {
      launchButton.classList.add("visible");
      clickHint.classList.add("visible");
      return;
    }

    terminalLine(item);
    introIndex += 1;

    let delay = 60;
    if (item.type === "command") delay = 400;
    if (item.type === "neo") delay = 40;
    if (!item.text) delay = 100;

    setTimeout(nextIntroLine, delay);
  }

  function finishIntro() {
    terminalLine({
      type: "neo",
      text: '<span class="terminal-prompt">adondada@arch</span><span class="terminal-path">:~/portfolio$</span><span class="cursor"></span>'
    });

    setTimeout(() => {
      terminal.classList.add("hidden");
      document.body.classList.add("portfolio-ready");
      initPortfolio();
    }, 650);
  }

  function runLaunchSequence() {
    launchButton.classList.remove("visible");
    clickHint.classList.remove("visible");

    const commands = getLaunchCommands();
    let index = 0;

    function next() {
      if (index >= commands.length) {
        finishIntro();
        return;
      }

      terminalLine(commands[index]);
      index += 1;
      setTimeout(next, 90);
    }

    next();
  }

  launchButton.addEventListener("click", runLaunchSequence);
  setTimeout(nextIntroLine, 400);
});

function initPortfolio() {
  renderRepos(fallbackRepos);
  refreshRepos();
  watchHeader();
}

function watchHeader() {
  const header = document.getElementById("site-header");

  const update = () => {
    header.classList.toggle("scrolled", window.scrollY > 24);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}

async function refreshRepos() {
  const status = document.getElementById("repo-status");

  try {
    const response = await fetch("https://api.github.com/users/adondada/repos?per_page=100&sort=updated", {
      headers: { Accept: "application/vnd.github+json" }
    });

    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);

    const repos = await response.json();
    renderRepos(repos);
    status.textContent = `${repos.length} public repos, pulled live from GitHub.`;
  } catch (error) {
    console.warn("Could not refresh repositories:", error);
    status.textContent = "Showing the last saved public repo list. GitHub did not answer this time.";
  }
}

function renderRepos(repos) {
  const list = document.getElementById("repo-list");
  if (!list) return;

  const sorted = [...repos].sort((a, b) => {
    if (a.fork !== b.fork) return Number(a.fork) - Number(b.fork);
    return a.name.localeCompare(b.name);
  });

  list.innerHTML = sorted.map(repo => {
    const description = repo.description
      ? escapeHtml(repo.description)
      : repo.fork
        ? "Forked repository."
        : "No description written yet.";

    const badges = [
      repo.language ? `<span>${escapeHtml(repo.language)}</span>` : "",
      repo.fork ? "<span>fork</span>" : "",
      repo.archived ? "<span>archived</span>" : "",
      repo.stargazers_count ? `<span>★ ${repo.stargazers_count}</span>` : ""
    ].filter(Boolean).join("");

    return `
      <a class="repo-row${repo.fork ? " is-fork" : "}" href="${repo.html_url}" target="_blank" rel="noreferrer">
        <div>
          <h3>${escapeHtml(repo.name)}</h3>
          <p>${description}</p>
        </div>
        <div class="repo-meta">${badges}<strong>↗</strong></div>
      </a>
    `;
  }).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
