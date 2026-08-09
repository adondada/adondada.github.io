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

const socialLinks = [
  { label: "Instagram", handle: "@ad0nd4da", url: "https://instagram.com/ad0nd4da" },
  { label: "X", handle: "@ad0ndada", url: "https://x.com/ad0ndada" },
  { label: "TikTok", handle: "@alternativehacker", url: "https://www.tiktok.com/@alternativehacker" },
  { label: "GitHub", handle: "@adondada", url: "https://github.com/adondada" }
];

const knowledgeGroups = [
  {
    title: "Programming",
    text: "Python and JavaScript are the languages I’m most comfortable in. I also work with TypeScript, C, SQL, HTML/CSS and Verilog when a project or university work calls for it.",
    items: ["Python", "JavaScript", "TypeScript", "C", "SQL", "HTML/CSS", "Verilog"]
  },
  {
    title: "Systems & infra",
    text: "I spend a lot of time in Linux and around the boring-but-important pieces that make software actually run somewhere other than localhost.",
    items: ["Linux", "Git/GitHub", "Node.js", "Express", "SSH", "PM2", "Docker", "Tailscale", "Cloudflare Tunnel", "MongoDB"]
  },
  {
    title: "Networking & hardware",
    text: "Networking is one of the areas I keep digging deeper into, from the normal TCP/IP side to Wi-Fi, BLE and small hardware projects.",
    items: ["TCP/IP", "Routing basics", "Wi-Fi", "BLE", "Raspberry Pi", "Flipper Zero", "Pwnagotchi", "e-ink", "CCNA study"]
  },
  {
    title: "Things I’m learning deeper",
    text: "Cybersecurity, reverse engineering, low-level systems, DevOps and AI tooling are the rabbit holes I keep coming back to.",
    items: ["Cybersecurity", "Reverse engineering", "Low-level systems", "DevOps", "AI tooling"]
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

function socialLinkRows() {
  return socialLinks.map(social => `
    <a href="${social.url}" target="_blank" rel="noreferrer">
      <span>${social.label}</span>
      <strong>${social.handle}</strong>
      <i>↗</i>
    </a>
  `).join("");
}

function knowledgeCards() {
  return knowledgeGroups.map(group => `
    <article class="knowledge-card">
      <h3>${group.title}</h3>
      <p>${group.text}</p>
      <div class="tool-row compact">
        ${group.items.map(item => `<span>${item}</span>`).join("")}
      </div>
    </article>
  `).join("");
}

function Profile() {
  return `
    <header class="site-header" id="site-header">
      <a class="wordmark" href="#top">adondada</a>
      <nav aria-label="Primary navigation">
        <a href="#work">work</a>
        <a href="#invisib">invisib</a>
        <a href="#knowledge">knowledge</a>
        <a href="#socials">socials</a>
        <a href="https://github.com/adondada" target="_blank" rel="noreferrer">github ↗</a>
      </nav>
    </header>

    <main class="site-main" id="main-content">
      <section class="hero section" id="top">
        <p class="eyebrow">developer · builder · occasional hardware menace</p>
        <h1>I make software for problems I keep running into.</h1>
        <p class="hero-copy">
          I’m <strong>adondada</strong>. I study Electrical & Computer Engineering and spend most of my free time
          bouncing between software, networking, Linux, AI and small hardware projects.
        </p>
        <div class="hero-links">
          <a class="button primary" href="#work">see what I build</a>
          <a class="button" href="https://invisib.app" target="_blank" rel="noreferrer">invisib.app ↗</a>
        </div>
        <div class="social-strip" aria-label="Social profiles">
          ${socialLinks.map(social => `<a href="${social.url}" target="_blank" rel="noreferrer">${social.label} <span>${social.handle}</span></a>`).join("")}
        </div>
        <p class="tiny-note">No skill bars. I still refuse to claim I’m 87% JavaScript.</p>
      </section>

      <section class="section" id="work">
        <div class="section-heading">
          <div>
            <p class="eyebrow">selected work</p>
            <h2>Things I’m actually excited to show.</h2>
          </div>
          <p>Developer tools, Pwnagotchi experiments, networking stuff and utilities that mostly started because I wanted the tool to exist.</p>
        </div>
        <div class="featured-grid">
          ${featuredProjectCards()}
        </div>
      </section>

      <section class="section" id="invisib">
        <div class="invisib-card">
          <div class="invisib-copy">
            <p class="eyebrow">building now · invisib</p>
            <h2>Not a chatbot. A workspace.</h2>
            <p>
              Invisib is the AI workspace I’m building for project management and execution. The idea is to keep research,
              project context and actual work in one place instead of opening another disposable chat every five minutes.
            </p>
            <div class="hero-links">
              <a class="button primary" href="https://invisib.app" target="_blank" rel="noreferrer">open invisib.app ↗</a>
              <a class="button" href="https://github.com/adondada/invisib" target="_blank" rel="noreferrer">public repo ↗</a>
              <a class="button" href="https://github.com/adondada/invisib.chat.github.io" target="_blank" rel="noreferrer">early web repo ↗</a>
            </div>
          </div>
          <div class="invisib-grid">
            <div>
              <span>01</span>
              <h3>Quick Search</h3>
              <p>Real-time web search with AI synthesis instead of ten tabs and a prayer.</p>
            </div>
            <div>
              <span>02</span>
              <h3>Project Mode</h3>
              <p>Keep work grouped around projects so the context survives longer than one conversation.</p>
            </div>
            <div>
              <span>03</span>
              <h3>Agents</h3>
              <p>Run work in the background and keep execution visible inside the workspace.</p>
            </div>
          </div>
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
            I like understanding what is happening underneath the UI, then making the annoying parts easier to use.
            That has somehow led to remote Linux tooling, Pwnagotchi plugins, Flipper Zero work, networking projects and an AI workspace.
          </p>
          <p>
            Some projects are polished, some are experiments, and some are evidence that curiosity has terrible time-management skills.
            I’d rather show the trail than pretend every repository emerged from a tasteful startup incubator fully formed.
          </p>
        </div>
      </section>

      <section class="section" id="knowledge">
        <div class="section-heading">
          <div>
            <p class="eyebrow">what I know / work with</p>
            <h2>The actual stack, without fake percentages.</h2>
          </div>
          <p>I’m not claiming expert status on every chip below. These are the languages, systems and areas I actually use, study or build with.</p>
        </div>
        <div class="knowledge-grid">
          ${knowledgeCards()}
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

      <section class="section" id="socials">
        <div class="section-heading">
          <div>
            <p class="eyebrow">elsewhere</p>
            <h2>Find me outside this tab.</h2>
          </div>
          <p>Same person, different algorithm trying to decide whether anyone should see the post.</p>
        </div>
        <div class="social-grid">
          ${socialLinkRows()}
        </div>
      </section>

      <footer>
        <p>Built without a framework because this page absolutely did not need one.</p>
        <div>
          <a href="https://instagram.com/ad0nd4da" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://x.com/ad0ndada" target="_blank" rel="noreferrer">X</a>
          <a href="https://www.tiktok.com/@alternativehacker" target="_blank" rel="noreferrer">TikTok</a>
          <a href="https://github.com/adondada" target="_blank" rel="noreferrer">GitHub</a>
          <a href="#top">↑</a>
        </div>
      </footer>
    </main>
  `;
}
