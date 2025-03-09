import { DebugConsole } from "./debugConsole.js";
import { Profile } from "./profile.js";

document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("root");
    root.innerHTML = DebugConsole();
    
    const messages = [
        "[10:39:50 PM] Booting system...",
        "[10:39:50 PM] Checking protocols...",
        "[10:39:50 PM] Establishing secure connection...",
        "[10:39:51 PM] Running diagnostics...",
        "[10:39:51 PM] Loading user profile...",
        "[10:39:52 PM] Initializing UI...",
        "[10:39:53 PM] Welcome, Adon Dada!"
    ];

    const consoleContent = document.getElementById("console-content");
    let index = 0;

    function addMessage() {
        if (index < messages.length) {
            const p = document.createElement("p");
            p.textContent = messages[index];
            consoleContent.appendChild(p);
            consoleContent.scrollTop = consoleContent.scrollHeight;
            index++;
            setTimeout(addMessage, 600);
        } else {
            setTimeout(() => {
                root.innerHTML = Profile();
            }, 1500);
        }
    }

    addMessage();

    for (let i = 0; i < 50; i++) {
        let snowflake = document.createElement("div");
        snowflake.className = "snowflake";
        snowflake.style.left = Math.random() * 100 + "vw";
        snowflake.style.top = Math.random() * 100 + "vh";
        document.body.appendChild(snowflake);
    }
});
