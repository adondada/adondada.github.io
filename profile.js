const featuredProjects = [
  {
    name: "pwnagotchi-flipper-companion",
    repo: "https://github.com/adondada/pwnagotchi-flipper-companion",
    stack: "C · Python · BLE",
    text: "A Flipper Zero companion for Pwnagotchi. It shows live status, discovers installed plugins, edits their settings and handles system actions over BLE."
  },
  {
    name: "pwnagotchi-car-mode",
    repo: "https://github.com/adondada/pwnagotchi-car-mode",
    stack: "Python · Pwnagotchi · BlueZ",
    text: "A movement-aware Pwnagotchi mode that combines Wi-Fi changes with optional BLE and GPS signals, plus a Web UI for tuning it without living in config files."
  },
  {
    name: "pwnagotchi-display-manager",
    repo: "https://github.com/adondada/pwnagotchi-display-manager",
    stack: "Python · Web UI",
    text: "A small control panel for display plugins: find UI elements, move them around, toggle plugins and save positions without editing somebody else's plugin source."
  },
  {
    name: "fixwitness",
    repo: "https://github.com/adondada/fixwitness",
    stack: "Python · Git · Testing",
    text: "A developer tool that checks whether a regression test actually catches the bug a patch claims to fix. Because a green test suite can still be lying to you."
  },
  {
    name: "pythonas-gr",
    repo: "https://github.com/adondada/pythonas-gr",
    stack: "Python · Language tooling",
    text: "Python with a Greek API and optional Greek-style syntax. Mostly an experiment in how far you can push a language before your editor starts judging you."
  },
  {
    name: "codexharbor",
    repo: "https://github.com/adondada/codexharbor",
    stack: "TypeScript · Electron · SSH",
    text: "A desktop client for running and managing Codex on a remote Linux machine over direct SSH instead of babysitting another terminal window."
  }
];

const fallbackRepos = [
  ["pwnagotchi-store", "HTML", true],
  ["pwnagotchi-flipper-companion", "C", false],
  ["pwnagotchi-car-mode", "Python", false],
  ["-pwnagotchi-flipper-companion", "", false],
  ["pwnagotchi-display-manager", "Python", false],
  ["fixwitness", "Python", false],
  ["pythonas-gr", "Python", false],
  ["-", "", false],
  ["aios", "Python", false],
  ["codexharbor", "TypeScript", false],
  ["testakisthc.github.io", "HTML", false],
  ["adondada.github.io", "CSS", false],
  ["EeveeSpotifyReborn", "", true],
  ["adondada", "", false],
  ["Pihole-display", "Python", false],
  ["wifi_dash", "Python", false],
  ["invisib.chat.github.io", "HTML", false],
  ["invisib", "HTML", false],
  ["geomeet", "", false],
  ["airify", "", false],
  ["joyeuse", "", true],
  ["hackeruniongr", "", false]
].map(([name, language, fork]) => ({
  name,
  language: language || null,
  fork,
  html_url: `https://github.com/adondada/${name}`,
  description: null,
  stargazers_count: 0,
  archived: false
}));

function featuredProjectCards() {
  return featuredProjects.map(project => `
    <a class="project-card" href="${project.repo}" target="_blank" rel="noreferrer">
      <div class="project-card-top">
        <span class="repo-mark">↗</span>
        <span class="project-stack">${project.stack}</span>
      </div>
      <h3>${project.name}</h3>
      <p>${project.text}</p>
    </a>
  `).join("");
}

function Profile() {
  return `
    <header class="site-header" id="site-header">
      <a class="wordmark" href="#top">adondada</a>
      <nav aria-label="Primary navigation">
        <a href="#work">work</a>
        <a href="#about">about</a>
        <a href="#all-projects">all repos</a>
        <a href="https://github.com/adondada" target="_blank" rel="noreferrer">github ↗</a>
      </nav>
    </header>

    <main class="site-main" id="main-content">
      <section class="hero section" id="top">
        <p class="eyebrow">developer · builder · occasional hardware menace</p>
        <h1>I make software for problems I keep running into.</h1>
        <p class="hero-copy">
          I’m <strong>adondada</strong>. Most of my repos start the same way: I need a tool,
          the existing option annoys me, and suddenly it is 3 a.m. and there is a new project.
        </p>
        <div class="hero-links">
          <a class="button primary" href="#work">see what I build</a>
          <a class="button" href="https://github.com/adondada" target="_blank" rel="noreferrer">github profile ↗</a>
        </div>
        <p class="tiny-note">No skill bars. I refuse to claim I’m 87% JavaScript.</p>
      </section>

      <section class="section" id="work">
        <div class="section-heading">
          <div>
            <p class="eyebrow">selected work</p>
            <h2>Things I’m actually excited to show.</h2>
          </div>
          <p>Mostly developer tools, Pwnagotchi experiments, small utilities and whatever rabbit hole won that week.</p>
        </div>
        <div class="featured-grid">
          ${featuredProjectCards()}
        </div>
      </section>

      <section class="section about" id="about">
        <div class="section-heading">
          <div>
            <p class="eyebrow">about</p>
            <h2>I like useful software more than impressive-sounding software.</h2>
          </div>
        </div>
        <div class="about-grid">
          <p>
            I bounce between Python, JavaScript/TypeScript, C, Linux, networking and little hardware projects.
            I care about understanding how things work underneath the UI, then making the annoying parts easier to use.
          </p>
          <p>
            Some projects are polished, some are experiments, and some are evidence that curiosity has poor time-management skills.
            The public repos below are the honest version, not a fake “only my three perfect projects exist” portfolio.
          </p>
        </div>
        <div class="tool-row" aria-label="Tools and technologies">
          <span>Python</span><span>JavaScript</span><span>TypeScript</span><span>C</span><span>Linux</span>
          <span>Git</span><span>Networking</span><span>Raspberry Pi</span><span>Flipper Zero</span>
        </div>
      </section>

      <section class="section" id="all-projects">
        <div class="section-heading repo-heading">
          <div>
            <p class="eyebrow">github dump</p>
            <h2>All public repositories.</h2>
          </div>
          <p id="repo-status">Loading the current list from GitHub…</p>
        </div>
        <div class="repo-list" id="repo-list" aria-live="polite"></div>
      </section>

      <footer>
        <p>Built without a framework because this page absolutely did not need one.</p>
        <div>
          <a href="https://github.com/adondada" target="_blank" rel="noreferrer">GitHub</a>
          <a href="#top">back to top ↑</a>
        </div>
      </footer>
    </main>
  `;
}
