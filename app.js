import { DebugConsole } from "./debugConsole.js";
import { Profile } from "./profile.js";

document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("root");
    root.innerHTML = DebugConsole();
    
    // Animate debug console
    setTimeout(() => {
        document.getElementById("console").classList.add("show-console");
    }, 500);
    
    setTimeout(() => {
        root.innerHTML = Profile();
    }, 4000);

    // Generate snowflakes
    for (let i = 0; i < 50; i++) {
        let snowflake = document.createElement("div");
        snowflake.className = "snowflake";
        snowflake.style.left = Math.random() * 100 + "vw";
        snowflake.style.animationDuration = (Math.random() * 5 + 2) + "s";
        document.body.appendChild(snowflake);
    }

    // Add paint-like pattern overlay
    let paintPattern = document.createElement("div");
    paintPattern.className = "paint-pattern";
    document.body.appendChild(paintPattern);
});