const portfolioTrack = {
  title: "2019",
  artist: "ATC Nico",
  cover: "2019.jpg",
  file: "2019.mp3"
};

let musicPlayerReady = false;

function mountMusicPlayer() {
  const root = document.getElementById("root");
  if (!root || document.getElementById("music-player")) return;

  root.insertAdjacentHTML("beforeend", `
    <aside class="music-player" id="music-player" aria-label="Music player">
      <audio id="audio-player" src="${portfolioTrack.file}" preload="metadata"></audio>
      <div class="player-card">
        <div class="player-cover" aria-hidden="true">
          <img src="${portfolioTrack.cover}" alt="" loading="eager">
          <span class="player-vinyl"></span>
        </div>

        <div class="player-content">
          <div class="player-topline">
            <div class="player-copy">
              <strong class="player-title">${portfolioTrack.title}</strong>
              <span class="player-artist">${portfolioTrack.artist}</span>
            </div>

            <div class="player-actions">
              <button class="player-icon-btn player-play" id="play-btn" type="button" aria-label="Play ${portfolioTrack.title}">
                <span id="play-symbol" aria-hidden="true">▶</span>
              </button>
              <button class="player-icon-btn player-collapse" id="player-collapse" type="button" aria-label="Minimize music player" aria-expanded="true">
                <span aria-hidden="true">⌄</span>
              </button>
            </div>
          </div>

          <div class="player-timeline">
            <span id="current-time">0:00</span>
            <input id="progress-slider" class="player-slider player-progress-slider" type="range" min="0" max="1000" value="0" step="1" aria-label="Song position">
            <span id="duration-time">--:--</span>
          </div>

          <div class="player-volume-row">
            <button class="player-mute" id="mute-btn" type="button" aria-label="Mute audio">
              <span id="mute-symbol" aria-hidden="true">◖))</span>
            </button>
            <input id="volume-slider" class="player-slider player-volume-slider" type="range" min="0" max="1" value="0.85" step="0.01" aria-label="Volume">
            <span class="player-note">site soundtrack</span>
          </div>
        </div>
      </div>
    </aside>
  `);
}

function attemptMusicAutoplayFromGesture() {
  const audio = document.getElementById("audio-player");
  if (!audio || !audio.paused) return;

  audio.play().catch(() => {
    // Browser blocked autoplay. The visible play button remains available.
  });
}

function initMusicPlayer() {
  if (musicPlayerReady) return;

  const player = document.getElementById("music-player");
  const audio = document.getElementById("audio-player");
  const playBtn = document.getElementById("play-btn");
  const playSymbol = document.getElementById("play-symbol");
  const collapseBtn = document.getElementById("player-collapse");
  const progress = document.getElementById("progress-slider");
  const currentTime = document.getElementById("current-time");
  const durationTime = document.getElementById("duration-time");
  const muteBtn = document.getElementById("mute-btn");
  const muteSymbol = document.getElementById("mute-symbol");
  const volume = document.getElementById("volume-slider");

  if (!player || !audio || !playBtn || !progress) return;
  musicPlayerReady = true;

  const savedVolume = Number(localStorage.getItem("adondada-music-volume"));
  if (Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 1) {
    audio.volume = savedVolume;
    volume.value = String(savedVolume);
  } else {
    audio.volume = 0.85;
  }

  if (localStorage.getItem("adondada-player-collapsed") === "1") {
    player.classList.add("is-collapsed");
    collapseBtn.setAttribute("aria-expanded", "false");
    collapseBtn.setAttribute("aria-label", "Expand music player");
  }

  const formatTime = seconds => {
    if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
    const whole = Math.floor(seconds);
    const minutes = Math.floor(whole / 60);
    return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
  };

  const paintSlider = (element, fraction) => {
    const safe = Math.max(0, Math.min(1, fraction || 0));
    element.style.setProperty("--slider-fill", `${safe * 100}%`);
  };

  const syncPlaybackUI = () => {
    const playing = !audio.paused && !audio.ended;
    player.classList.toggle("is-playing", playing);
    playSymbol.textContent = playing ? "Ⅱ" : "▶";
    playBtn.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${portfolioTrack.title}`);

    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    }
  };

  const syncMuteUI = () => {
    const muted = audio.muted || audio.volume === 0;
    muteSymbol.textContent = muted ? "×" : audio.volume < 0.45 ? ")" : "◖))";
    muteBtn.setAttribute("aria-label", muted ? "Unmute audio" : "Mute audio");
    paintSlider(volume, Number(volume.value));
  };

  const syncTimeline = () => {
    if (!audio.duration || progress.matches(":active")) return;
    const fraction = audio.currentTime / audio.duration;
    progress.value = String(Math.round(fraction * 1000));
    paintSlider(progress, fraction);
    currentTime.textContent = formatTime(audio.currentTime);
    durationTime.textContent = formatTime(audio.duration);
  };

  playBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  collapseBtn.addEventListener("click", () => {
    const collapsed = player.classList.toggle("is-collapsed");
    collapseBtn.setAttribute("aria-expanded", String(!collapsed));
    collapseBtn.setAttribute("aria-label", collapsed ? "Expand music player" : "Minimize music player");
    localStorage.setItem("adondada-player-collapsed", collapsed ? "1" : "0");
  });

  progress.addEventListener("input", () => {
    const fraction = Number(progress.value) / 1000;
    paintSlider(progress, fraction);
    if (audio.duration) currentTime.textContent = formatTime(audio.duration * fraction);
  });

  progress.addEventListener("change", () => {
    if (audio.duration) audio.currentTime = audio.duration * (Number(progress.value) / 1000);
  });

  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    syncMuteUI();
  });

  volume.addEventListener("input", () => {
    const value = Number(volume.value);
    audio.volume = value;
    audio.muted = false;
    localStorage.setItem("adondada-music-volume", String(value));
    syncMuteUI();
  });

  audio.addEventListener("play", syncPlaybackUI);
  audio.addEventListener("pause", syncPlaybackUI);
  audio.addEventListener("ended", syncPlaybackUI);
  audio.addEventListener("timeupdate", syncTimeline);
  audio.addEventListener("loadedmetadata", syncTimeline);
  audio.addEventListener("durationchange", syncTimeline);
  audio.addEventListener("volumechange", syncMuteUI);

  if ("mediaSession" in navigator && "MediaMetadata" in window) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: portfolioTrack.title,
      artist: portfolioTrack.artist,
      album: "adondada.com",
      artwork: [
        { src: portfolioTrack.cover, sizes: "512x512", type: "image/jpeg" }
      ]
    });

    const handlers = {
      play: () => audio.play(),
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
        // Some browsers expose Media Session but not every action.
      }
    });
  }

  paintSlider(progress, 0);
  paintSlider(volume, audio.volume);
  syncPlaybackUI();
  syncMuteUI();
  setTimeout(() => player.classList.add("is-visible"), 180);
}
