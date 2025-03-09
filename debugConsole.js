export function DebugConsole() {
    return `
        <div class="debug-console" id="console">
            <p>> Initializing...</p>
            <p>> Loading assets...</p>
            <p>> Connecting to server...</p>
            <p>> Almost done...</p>
            <p>> Welcome, Adon Dada!</p>
        </div>
        <script>
            let consoleElem = document.getElementById("console");
            let lines = consoleElem.innerHTML.split("\n");
            consoleElem.innerHTML = "";
            let index = 0;
            function rollText() {
                if (index < lines.length) {
                    consoleElem.innerHTML += lines[index] + "<br>";
                    index++;
                    setTimeout(rollText, 500);
                }
            }
            rollText();
        </script>
    `;
}
