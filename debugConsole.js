function DebugConsole() {
    return `
        <div class="terminal-overlay" id="terminal-overlay">
            <div class="terminal-wrapper">
                <div class="terminal">
                    <div class="terminal-header">
                        <button class="terminal-btn close"></button>
                        <button class="terminal-btn minimize"></button>
                        <button class="terminal-btn maximize"></button>
                        <span class="terminal-title">adondada@arch ~ bash</span>
                    </div>
                    <div class="terminal-body" id="terminal-body">
                    </div>
                    <button class="terminal-launch-btn" id="terminal-launch-btn">
                        <span class="launch-prompt">adondada@arch</span><span class="launch-path">:~/portfolio$</span> ./launch.sh
                    </button>
                </div>
                <div class="click-indicator" id="click-indicator">
                    <span class="indicator-text">Click to launch 👆</span>
                    <!-- <div class="indicator-icon">
                         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                             <path d="M12 2C12 1.44772 12.4477 1 13 1C13.5523 1 14 1.44772 14 2V8H12V2Z" fill="currentColor"/>
                              <path d="M12.5714 2.85714L12.5714 10H16.8571L16.8571 2.85714C16.8571 1.6736 15.8979 0.714286 14.7143 0.714286C13.5307 0.714286 12.5714 1.6736 12.5714 2.85714Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                             <path d="M8.28571 10.7143V17.8571C8.28571 19.0407 9.24503 20 10.4286 20H15.4286" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                             <path d="M12.5714 10H8.28571" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                             <path d="M16.8571 12.1429V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                             <path d="M16.8571 19.2857V17.8571" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                         </svg>
                    </div> -->
                </div>
            </div>
        </div>
    `;
}

function getTerminalCommands() {
    // Terminal sequence - stops before launch for user interaction
    return [
        { type: 'command', prompt: 'adondada@arch', path: '~', text: 'neofetch' },
        { type: 'output', text: '' },
        { type: 'neo', text: "      <span class='arch'>/\\</span>         <span class='neo-user'>adondada</span>@<span class='neo-user'>arch</span>" },
        { type: 'neo', text: "     <span class='arch'>/  \\</span>        ---------------" },
        { type: 'neo', text: "    <span class='arch'>/\\   \\</span>       <span class='neo-label'>OS:</span> Arch Linux x86_64" },
        { type: 'neo', text: "   <span class='arch'>/  ..  \\</span>      <span class='neo-label'>Kernel:</span> 6.7.0-arch1-1" },
        { type: 'neo', text: "  <span class='arch'>/  .  '. \\</span>     <span class='neo-label'>Shell:</span> zsh 5.9" },
        { type: 'neo', text: " <span class='arch'>/ .'     '.\\</span>    <span class='neo-label'>Terminal:</span> web-term" },
        { type: 'neo', text: "<span class='arch'>/.\"         '.\\</span>   <span class='neo-label'>Status:</span> <span class='terminal-success'>online</span>" },
        { type: 'output', text: '' },
        { type: 'command', prompt: 'adondada@arch', path: '~', text: 'cd portfolio && ls' },
        { type: 'output', text: 'launch.sh  skills.json  projects.md  invisib/' },
        { type: 'output', text: '' },
        { type: 'wait', text: '' }, // This signals to show the launch button
    ];
}

// Commands to run after user clicks launch
function getLaunchCommands() {
    return [
        { type: 'success', text: '[✓] Loading portfolio...' },
        { type: 'success', text: '[✓] Starting interface...' },
        { type: 'warning', text: '[→] 3...' },
        { type: 'warning', text: '[→] 2...' },
        { type: 'warning', text: '[→] 1...' },
        { type: 'success', text: '[✓] Welcome!' },
    ];
}
