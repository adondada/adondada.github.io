// =============================================
// Skills
// =============================================
var skills = [
    { name: "JavaScript", level: 90, icon: "⚡" },
    { name: "Python", level: 85, icon: "🐍" },
    { name: "HTML / CSS", level: 95, icon: "🎨" },
    { name: "Node.js", level: 80, icon: "🚀" },
    { name: "C", level: 45, icon: "⚛️" },
    { name: "Git", level: 85, icon: "📦" },
    { name: "TypeScript", level: 70, icon: "📘" },
    { name: "SQL", level: 75, icon: "🗃️" },
];


var projects = [
    {
        title: "invisib.app",
        url: "https://invisib.app",
        icon: "🔐",
        description: "Privacy-first spatial AI workspace"
    },
    {
        title: "invisib.xyz",
        url: "https://invisib.xyz",
        icon: "🌐",
        description: "file uploader (currently down)"
    }
];

// =============================================
// MUSIC
// =============================================
var music = {
    title: "2019",
    artist: "ATC Nico",
    cover: "2019.jpg",      
    file: "2019.mp3"        
};

// section names
var sectionNames = ['hero', 'skills', 'company', 'projects'];

function Profile() {
    var skillsHTML = skills.map(function (skill, index) {
        return '<div class="skill-item reveal reveal-delay-' + ((index % 4) + 1) + '">' +
            '<div class="skill-header">' +
            '<span class="skill-name">' + skill.icon + ' ' + skill.name + '</span>' +
            '<span class="skill-percent">' + skill.level + '%</span>' +
            '</div>' +
            '<div class="skill-bar">' +
            '<div class="skill-progress" data-level="' + skill.level + '"></div>' +
            '</div>' +
            '</div>';
    }).join('');

    var projectsHTML = projects.map(function (project, index) {
        return '<a href="' + project.url + '" target="_blank" rel="noopener noreferrer" class="project-card reveal reveal-delay-' + (index + 1) + '">' +
            '<div class="project-image">' + project.icon + '</div>' +
            '<div class="project-content">' +
            '<h3 class="project-title">' + project.title + '</h3>' +
            '<p class="project-description">' + project.description + '</p>' +
            '<span class="project-link">Visit Site →</span>' +
            '</div>' +
            '</a>';
    }).join('');

    // dots
    var indicatorsHTML = sectionNames.map(function (name, index) {
        return '<button class="indicator-dot' + (index === 0 ? ' active' : '') + '" data-section="' + name + '" title="' + name.charAt(0).toUpperCase() + name.slice(1) + '"></button>';
    }).join('');

    // music playr HTML
    var musicPlayerHTML = '' +
        '<div class="music-player" id="music-player">' +
        '<div class="player-cover">' +
        '<img src="' + music.cover + '" alt="Album Cover" onerror="this.src=\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%231a1a24%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%2300ff88%22 font-size=%2240%22>♪</text></svg>\'">' +
        '<div class="player-vinyl"></div>' +
        '</div>' +
        '<div class="player-info">' +
        '<div class="player-title">' + music.title + '</div>' +
        '<div class="player-artist">' + music.artist + '</div>' +
        '</div>' +
        '<div class="player-controls">' +
        '<button class="player-btn" id="play-btn">' +
        '<span class="play-icon">▶</span>' +
        '<span class="pause-icon" style="display:none;">❚❚</span>' +
        '</button>' +
        '</div>' +
        '<div class="player-progress">' +
        '<div class="progress-bar" id="progress-bar"></div>' +
        '</div>' +
        '<audio id="audio-player" src="' + music.file + '"></audio>' +
        '</div>';

    return '' +
        '<div class="stars-container" id="stars"></div>' +

        '<!-- Music Player -->' +
        musicPlayerHTML +

        '<!-- Navigation Menu -->' +
        '<nav class="nav" id="nav">' +
        '<a href="#skills">Skills</a>' +
        '<a href="#company">Invisib</a>' +
        '<a href="#projects">Projects</a>' +
        '</nav>' +

        '<!-- Section Indicators -->' +
        '<div class="section-indicators" id="indicators">' +
        indicatorsHTML +
        '</div>' +

        '<main class="main-content snap-container" id="main-content">' +
        '<!-- Hero Section -->' +
        '<section class="snap-section hero" id="hero">' +
        '<div class="container">' +
        '<h1 class="reveal">Adon Dada</h1>' +
        '<p class="subtitle reveal reveal-delay-1">Developer & Privacy Advocate</p>' +
        '<div class="social-links reveal reveal-delay-2">' +
        '<a href="https://instagram.com/ad0nd4da" target="_blank" rel="noopener noreferrer" class="social-link">' +
        '📸 Instagram' +
        '</a>' +
        '<a href="https://discord.gg/5quhSz5z" target="_blank" rel="noopener noreferrer" class="social-link">' +
        '💬 Discord' +
        '</a>' +
        '<a href="https://github.com/adondada" target="_blank" rel="noopener noreferrer" class="social-link">' +
        '🐙 GitHub' +
        '</a>' +
        '</div>' +
        '</div>' +
        '<div class="scroll-hint" id="scroll-hint">' +
        '<div class="scroll-mouse"></div>' +
        '<div class="scroll-arrows">' +
        '<span></span>' +
        '<span></span>' +
        '</div>' +
        '<span>Scroll to explore</span>' +
        '</div>' +
        '</section>' +

        '<!-- Skills Section -->' +
        '<section class="snap-section skills" id="skills">' +
        '<div class="container">' +
        '<h2 class="section-title reveal"><span>Skills</span> & Technologies</h2>' +
        '<div class="skills-grid">' +
        skillsHTML +
        '</div>' +
        '</div>' +
        '<div class="scroll-hint">' +
        '<div class="scroll-arrows">' +
        '<span></span>' +
        '<span></span>' +
        '</div>' +
        '</div>' +
        '</section>' +

        '<!-- Company Section -->' +
        '<section class="snap-section company" id="company">' +
        '<div class="container">' +
        '<div class="company-card reveal">' +
        '<h2 class="company-logo">Invisib</h2>' +
        '<p class="company-tagline">Privacy Without Compromise</p>' +
        '<p class="company-description">' +
        'At <strong>Invisib</strong>, we believe privacy is a fundamental right, not a luxury. ' +
        'We build tools that let you do everyday things — browse, communicate, store files — ' +
        'without leaving a trace. Our mission is simple: empower users to take control of ' +
        'their digital lives while keeping things seamless and easy to use.' +
        '</p>' +
        '<div class="privacy-features">' +
        '<div class="privacy-feature reveal reveal-delay-1">' +
        '<div class="privacy-feature-icon">🔒</div>' +
        '<h4 class="privacy-feature-title">End-to-End Encryption</h4>' +
        '<p class="privacy-feature-text">Your data stays yours. Always encrypted, never compromised.</p>' +
        '</div>' +
        '<div class="privacy-feature reveal reveal-delay-2">' +
        '<div class="privacy-feature-icon">👁️‍🗨️</div>' +
        '<h4 class="privacy-feature-title">Zero Tracking</h4>' +
        '<p class="privacy-feature-text">No analytics, no cookies, no surveillance. Period.</p>' +
        '</div>' +
        '<div class="privacy-feature reveal reveal-delay-3">' +
        '<div class="privacy-feature-icon">🌍</div>' +
        '<h4 class="privacy-feature-title">Open & Transparent</h4>' +
        '<p class="privacy-feature-text">Built with trust in mind. See our code, verify our claims.</p>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="scroll-hint">' +
        '<div class="scroll-arrows">' +
        '<span></span>' +
        '<span></span>' +
        '</div>' +
        '</div>' +
        '</section>' +

        '<!-- Projects Section -->' +
        '<section class="snap-section projects" id="projects">' +
        '<div class="container">' +
        '<h2 class="section-title reveal">Featured <span>Projects</span></h2>' +
        '<div class="projects-grid">' +
        projectsHTML +
        '</div>' +
        '</div>' +
        '</section>' +

        '<!-- Footer -->' +
        '<footer class="footer-section">' +
        '<p class="reveal">Built with ❤️ by <a href="https://github.com/adondada">Adon Dada</a></p>' +
        '</footer>' +
        '</main>';
}
