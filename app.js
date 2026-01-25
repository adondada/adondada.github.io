document.addEventListener("DOMContentLoaded", function () {
    var root = document.getElementById("root");

    // Render terminal overlay and profile together
    root.innerHTML = DebugConsole() + Profile();

    var terminalBody = document.getElementById("terminal-body");
    var terminalOverlay = document.getElementById("terminal-overlay");
    var mainContent = document.getElementById("main-content");
    var nav = document.getElementById("nav");
    var indicators = document.getElementById("indicators");
    var launchBtn = document.getElementById("terminal-launch-btn");
    var commands = getTerminalCommands();
    var userInteracted = false;

    var lineIndex = 0;

    // Type out terminal lines with realistic timing
    function typeTerminalLine() {
        if (lineIndex < commands.length) {
            var cmd = commands[lineIndex];

            // If we hit a 'wait' command, show the launch button and stop
            if (cmd.type === 'wait') {
                if (launchBtn) {
                    launchBtn.classList.add("visible");
                    var clickIndicator = document.getElementById("click-indicator");
                    if (clickIndicator) clickIndicator.classList.add("visible");
                }
                return; // Stop here and wait for user click
            }

            var lineEl = document.createElement("div");
            lineEl.className = "terminal-line";

            if (cmd.type === 'command') {
                lineEl.innerHTML =
                    '<span class="terminal-prompt">' + cmd.prompt + '</span>' +
                    '<span class="terminal-path">:' + cmd.path + '$</span>' +
                    '<span class="terminal-command"> ' + cmd.text + '</span>';
            } else if (cmd.type === 'success') {
                lineEl.innerHTML = '<span class="terminal-success">' + cmd.text + '</span>';
            } else if (cmd.type === 'warning') {
                lineEl.innerHTML = '<span class="terminal-warning">' + cmd.text + '</span>';
            } else if (cmd.type === 'error') {
                lineEl.innerHTML = '<span class="terminal-error">' + cmd.text + '</span>';
            } else if (cmd.type === 'ascii') {
                lineEl.innerHTML = '<span class="terminal-ascii">' + cmd.text + '</span>';
            } else if (cmd.type === 'file') {
                lineEl.innerHTML = '<span class="terminal-file">' + cmd.text + '</span>';
            } else if (cmd.type === 'dir') {
                lineEl.innerHTML = '<span class="terminal-output">' + cmd.text + '</span>';
            } else if (cmd.type === 'info') {
                lineEl.innerHTML = '<span class="terminal-info">' + cmd.text + '</span>';
            } else if (cmd.type === 'neo') {
                lineEl.innerHTML = cmd.text;
                lineEl.style.whiteSpace = 'pre';
            } else {
                lineEl.innerHTML = '<span class="terminal-output">' + cmd.text + '</span>';
            }

            terminalBody.appendChild(lineEl);

            requestAnimationFrame(function () {
                lineEl.classList.add("visible");
            });

            terminalBody.scrollTop = terminalBody.scrollHeight;
            lineIndex++;

            // Variable timing for realism
            var delay = 60;
            if (cmd.type === 'command') delay = 400;
            if (cmd.type === 'ascii') delay = 40;
            if (cmd.text === '') delay = 100;
            if (cmd.type === 'warning') delay = 500;
            if (cmd.type === 'success' && cmd.text.includes('Welcome')) delay = 300;

            setTimeout(typeTerminalLine, delay);
        } else {
            finishTerminal();
        }
    }

    // Continue with launch commands after user clicks
    function runLaunchSequence() {
        var launchCommands = getLaunchCommands();
        var launchIndex = 0;

        function typeLaunchLine() {
            if (launchIndex < launchCommands.length) {
                var cmd = launchCommands[launchIndex];
                var lineEl = document.createElement("div");
                lineEl.className = "terminal-line";

                if (cmd.type === 'success') {
                    lineEl.innerHTML = '<span class="terminal-success">' + cmd.text + '</span>';
                } else if (cmd.type === 'warning') {
                    lineEl.innerHTML = '<span class="terminal-warning">' + cmd.text + '</span>';
                } else {
                    lineEl.innerHTML = '<span class="terminal-output">' + cmd.text + '</span>';
                }

                terminalBody.appendChild(lineEl);

                requestAnimationFrame(function () {
                    lineEl.classList.add("visible");
                });

                terminalBody.scrollTop = terminalBody.scrollHeight;
                launchIndex++;

                var delay = 60;
                if (cmd.type === 'warning') delay = 400;
                if (cmd.type === 'success' && cmd.text.includes('Welcome')) delay = 300;

                setTimeout(typeLaunchLine, delay);
            } else {
                finishTerminal();
            }
        }

        typeLaunchLine();
    }

    // Finish terminal and show main content
    function finishTerminal() {
        var cursorLine = document.createElement("div");
        cursorLine.className = "terminal-line visible";
        cursorLine.innerHTML =
            '<span class="terminal-prompt">adondada@arch</span>' +
            '<span class="terminal-path">:~/portfolio$</span>' +
            '<span class="cursor"></span>';
        terminalBody.appendChild(cursorLine);

        setTimeout(function () {
            terminalOverlay.classList.add("hidden");
            mainContent.classList.add("visible");
            if (nav) nav.classList.add("visible");
            if (indicators) indicators.classList.add("visible");
            initScrollAnimations();
            initSectionIndicators();
            initMusicPlayer(userInteracted);
            createStars();
        }, 800);
    }

    // Launch button click handler
    if (launchBtn) {
        launchBtn.addEventListener("click", function () {
            userInteracted = true; // User has interacted!
            launchBtn.classList.remove("visible");
            launchBtn.style.display = "none";

            var clickIndicator = document.getElementById("click-indicator");
            if (clickIndicator) {
                clickIndicator.classList.remove("visible");
                clickIndicator.style.display = "none";
            }

            runLaunchSequence();
        });
    }

    setTimeout(typeTerminalLine, 400);

    function createStars() {
        var starsContainer = document.getElementById("stars");
        if (!starsContainer) return;

        for (var i = 0; i < 80; i++) {
            var star = document.createElement("div");
            star.className = "star";
            star.style.left = Math.random() * 100 + "%";
            star.style.top = Math.random() * 100 + "%";
            star.style.animationDelay = Math.random() * 3 + "s";
            var size = Math.random() * 2 + 1 + "px";
            star.style.width = size;
            star.style.height = size;
            starsContainer.appendChild(star);
        }
    }

    function initScrollAnimations() {
        var revealElements = document.querySelectorAll(".reveal");

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("active");

                    var skillBars = entry.target.querySelectorAll(".skill-progress");
                    skillBars.forEach(function (bar) {
                        var level = bar.getAttribute("data-level");
                        bar.style.width = level + "%";
                    });

                    if (entry.target.classList.contains("skill-item")) {
                        var bar = entry.target.querySelector(".skill-progress");
                        if (bar) {
                            var level = bar.getAttribute("data-level");
                            setTimeout(function () {
                                bar.style.width = level + "%";
                            }, 300);
                        }
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: "0px 0px -30px 0px"
        });

        revealElements.forEach(function (el) {
            observer.observe(el);
        });
    }

    // Section indicators logic
    function initSectionIndicators() {
        var container = document.getElementById("main-content");
        var sections = document.querySelectorAll(".snap-section");
        var dots = document.querySelectorAll(".indicator-dot");

        // Click handlers for dots
        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                var sectionId = dot.getAttribute("data-section");
                var target = document.getElementById(sectionId);
                if (target) {
                    target.scrollIntoView({ behavior: "smooth" });
                }
            });
        });

        // Update active dot on scroll
        var sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var sectionId = entry.target.id;
                    dots.forEach(function (dot) {
                        if (dot.getAttribute("data-section") === sectionId) {
                            dot.classList.add("active");
                        } else {
                            dot.classList.remove("active");
                        }
                    });
                }
            });
        }, {
            root: container,
            threshold: 0.5
        });

        sections.forEach(function (section) {
            sectionObserver.observe(section);
        });
    }

    // Music player functionality
    function initMusicPlayer(autoplay) {
        var player = document.getElementById("music-player");
        var audio = document.getElementById("audio-player");
        var playBtn = document.getElementById("play-btn");
        var progressBar = document.getElementById("progress-bar");
        var playIcon = playBtn ? playBtn.querySelector(".play-icon") : null;
        var pauseIcon = playBtn ? playBtn.querySelector(".pause-icon") : null;

        if (!player || !audio || !playBtn) return;

        // Show player with animation
        setTimeout(function () {
            player.classList.add("visible");

            // Autoplay if user interacted
            if (autoplay) {
                audio.play().then(function () {
                    player.classList.add("playing");
                    if (playIcon) playIcon.style.display = "none";
                    if (pauseIcon) pauseIcon.style.display = "inline";
                }).catch(function (err) {
                    console.log("Autoplay failed:", err);
                });
            }
        }, 500);

        // Play/Pause toggle
        playBtn.addEventListener("click", function () {
            if (audio.paused) {
                audio.play();
                player.classList.add("playing");
                if (playIcon) playIcon.style.display = "none";
                if (pauseIcon) pauseIcon.style.display = "inline";
            } else {
                audio.pause();
                player.classList.remove("playing");
                if (playIcon) playIcon.style.display = "inline";
                if (pauseIcon) pauseIcon.style.display = "none";
            }
        });

        // Update progress bar
        audio.addEventListener("timeupdate", function () {
            if (audio.duration) {
                var percent = (audio.currentTime / audio.duration) * 100;
                progressBar.style.width = percent + "%";
            }
        });

        // Reset when song ends
        audio.addEventListener("ended", function () {
            player.classList.remove("playing");
            if (playIcon) playIcon.style.display = "inline";
            if (pauseIcon) pauseIcon.style.display = "none";
            progressBar.style.width = "0%";
        });
    }
});
