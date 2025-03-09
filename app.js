import { DebugConsole } from "./debugConsole.js";
import { Profile } from "./profile.js";

document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("root");
    root.innerHTML = DebugConsole();
    
    const messages = [];
    const startTime = new Date();


    
/*    function getTimestamp() {
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
        const seconds = String(elapsed % 60).padStart(2, '0');
        return `[${hours}:${minutes}:${seconds}]`;
    }

    MY CODE AAAAAAAARGGGGGGGG:
  */


  function getTimestamp() {
    const time = new Date().toLocaleTimeString();
    return `[${time}]`;
 }

    const logMessages = [
        "Booting system...",
        "Checking protocols...",
        "Establishing secure connection...",
        "Running diagnostics...",
        "Loading user profile...",
        "Initializing UI...",
        "Welcome, Adon Dada!"
    ];
    
    logMessages.forEach(msg => messages.push(`${getTimestamp()} ${msg}`));
    
    const consoleContent = document.getElementById("console-content");
    let index = 0;

    function addMessage() {
        if (index < messages.length) {
            const p = document.createElement("p");
            p.textContent = messages[index];
            consoleContent.appendChild(p);
            consoleContent.scrollTop = consoleContent.scrollHeight;
            index++;
            setTimeout(addMessage, 100);
        } else {
            setTimeout(() => {
                root.innerHTML = Profile();
            }, 500);
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
