import { DebugConsole } from "./debugConsole.js";
import { Profile } from "./profile.js";

document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("root");
    root.innerHTML = DebugConsole();
    setTimeout(() => {
        root.innerHTML = Profile();
    }, 3000);
});
