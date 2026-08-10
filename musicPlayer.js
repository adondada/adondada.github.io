const portfolioTrack = {
  title: "2019",
  artist: "ATC Nico",
  cover: "2019.jpg",
  file: "2019.mp3"
};

let musicPlayerReady = false;
let siteAudioContext = null;

function iconMarkup(name) {
  const icons = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10-6.5-10-6.5Z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7V5Zm7 0h3v14h-3V5Z"/></svg>'
  };

  return icons[name] || icons.play;
}

function mountMusicPlayer() {
  const root = document.getElementById("root");
  if (!root || document.getElementById("music-player")) return;

  root.insertAdjacentHTML("beforeend", `
    <aside class="music-player" id="music-player" aria-label="Music player">
      <audio id="audio-player" src="${portfolioTrack.file}" preload="auto" playsinline></audio>

      <div class="player-card">
        <img class="player-cover" src="${portfolioTrack.cover}" alt="${portfolioTrack.title} cover">

        <div class="player-main">
          <div class="player-meta-row">
            <div class="player-copy">
              <div class="player-title-row">
                <strong class="player-title">${portfolioTrack.title}</strong>
                <span class="player-eq" aria-hidden="true">
                  <i></i><i></i><i></i>
                </span>
              </div>
              <span class="player-artist">${portfolioTrack.artist}</span>
            </div>

            <button class="player-play" id="play-btn" type="button" aria-label="Play ${portfolioTrack.title}">
              <span id="play-symbol">${iconMarkup("play")}</span>
            </button>
          </div>

          <div class="player-progress-row">
            <span class="player-time" id="current-time">0:00</span>
            <input
              id="progress-slider"
              class="player-progress"
              type="range"
              min="0"
              max="1000"
              value="0"
              step="1"
              aria-label="Song position"
            >
            <span class="player-time player-duration" id="duration-time">--:--</span>
          </div>
        </div>
      </div>
    </aside>
  `);

  const audio = document.getElementById("audio-player");
  if (audio) {
    audio.volume = 1;
    audio.muted = false;
    audio.defaultMuted = false;
  }
}

function unlockSiteAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (AudioContextClass) {
    try {
      if (!siteAudioContext) siteAudioContext = new AudioContextClass();
      if (siteAudioContext.state === "suspended") siteAudioContext.resume().catch(() => {});
    } catch (_) {
      // HTMLMediaElement playback below is the part the soundtrack actually needs.
    }
  }
}

function attemptMusicAutoplayFromGesture() {
  const audio = document.getElementById("audio-player");
  if (!audio) return;

  unlockSiteAudio();

  // Called synchronously from the ./launch.sh click handler. Keeping play()
  // inside that exact gesture is what makes Safari/Chrome allow sound.
  audio.muted = false;
  audio.defaultMuted = false;
  audio.volume = 1;
  audio.removeAttribute("muted");

  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(error => {
      console.warn("Launch-click audio start was blocked:", error);
    });
  }
}

function initMusicPlayer() {
  if (musicPlayerReady) return;

  const player = document.getElementById("music-player");
  const audio = document.getElementById("audio-player");
  const playBtn = document.getElementById("play-btn");
  const playSymbol = document.getElementById("play-symbol");
  const progress = document.getElementById("progress-slider");
  const currentTime = document.getElementById("current-time");
  const durationTime = document.getElementById("duration-time");

  if (!player || !audio || !playBtn || !playSymbol || !progress || !currentTime || !durationTime) return;
  musicPlayerReady = true;

  // The soundtrack always starts at full element volume after launch.
  // Device/system volume is still controlled by the visitor, as browsers require.
  audio.volume = 1;
  audio.muted = false;
  audio.defaultMuted = false;

  const formatTime = seconds => {
    if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
    const whole = Math.floor(seconds);
    const minutes = Math.floor(whole / 60);
    return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
  };

  const paintProgress = fraction => {
    const safe = Math.max(0, Math.min(1, Number(fraction) || 0));
    progress.style.setProperty("--player-progress", `${safe * 100}%`);
  };

  const syncPlaybackUI = () => {
    const playing = !audio.paused && !audio.ended;
    player.classList.toggle("is-playing", playing);
    playSymbol.innerHTML = iconMarkup(playing ? "pause" : "play");
    playBtn.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${portfolioTrack.title}`);

    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    }
  };

  const syncTimeline = () => {
    const duration = audio.duration;
    const fraction = duration ? audio.currentTime / duration : 0;

    if (!progress.matches(":active")) {
      progress.value = String(Math.round(fraction * 1000));
      paintProgress(fraction);
    }

    currentTime.textContent = formatTime(audio.currentTime);
    durationTime.textContent = formatTime(duration);
  };

  playBtn.addEventListener("click", () => {
    audio.muted = false;
    audio.volume = 1;

    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  progress.addEventListener("input", () => {
    const fraction = Number(progress.value) / 1000;
    paintProgress(fraction);
    if (audio.duration) currentTime.textContent = formatTime(audio.duration * fraction);
  });

  progress.addEventListener("change", () => {
    if (audio.duration) {
      audio.currentTime = audio.duration * (Number(progress.value) / 1000);
      syncTimeline();
    }
  });

  audio.addEventListener("play", syncPlaybackUI);
  audio.addEventListener("pause", syncPlaybackUI);
  audio.addEventListener("ended", syncPlaybackUI);
  audio.addEventListener("timeupdate", syncTimeline);
  audio.addEventListener("loadedmetadata", syncTimeline);
  audio.addEventListener("durationchange", syncTimeline);

  if ("mediaSession" in navigator && "MediaMetadata" in window) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: portfolioTrack.title,
      artist: portfolioTrack.artist,
      album: "adondada.com",
      artwork: [
        { src: portfolioTrack.cover, type: "image/jpeg" }
      ]
    });

    const handlers = {
      play: () => {
        audio.muted = false;
        audio.volume = 1;
        return audio.play();
      },
      pause: () => audio.pause(),
      seekbackward: details => {
        audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10));
      },
      seekforward: details => {
        audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + (details.seekOffset || 10));
      },
      seekto: details => {
        if (Number.isFinite(details.seekTime)) audio.currentTime = details.seekTime;
      }
    };

    Object.entries(handlers).forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (_) {
        // Some browsers expose Media Session without every optional action.
      }
    });
  }

  paintProgress(0);
  syncTimeline();
  syncPlaybackUI();
  requestAnimationFrame(() => player.classList.add("is-visible"));
}
