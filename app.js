import { DebugConsole } from "./debugConsole.js";
import { Profile } from "./profile.js";

document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("root");
    root.innerHTML = DebugConsole();
    
    setTimeout(() => {
        root.innerHTML = Profile();
    }, 4000);

    for (let i = 0; i < 50; i++) {
        let snowflake = document.createElement("div");
        snowflake.className = "snowflake";
        snowflake.style.left = Math.random() * 100 + "vw";
        snowflake.style.top = Math.random() * 100 + "vh";
        document.body.appendChild(snowflake);
    }
});
