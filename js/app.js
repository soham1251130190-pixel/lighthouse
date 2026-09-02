/* ============================================
   App Module — Main orchestration & event wiring
   ============================================ */

(function () {
    'use strict';

    // DOM elements
    const tunnelBtn = document.getElementById('tunnel-btn');
    const tunnelBtnText = document.getElementById('tunnel-btn-text');
    const tunnelIconEnter = document.getElementById('tunnel-icon-enter');
    const tunnelIconExit = document.getElementById('tunnel-icon-exit');
    const resetBtn = document.getElementById('reset-btn');
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');

    /**
     * Initialize the application
     */
    function init() {
        MapManager.init();
        StatsPanel.init();

        bindEvents();

        // Auto-start simulation
        Simulation.start();
    }

    /**
     * Bind DOM events
     */
    function bindEvents() {
        // Tunnel toggle
        tunnelBtn.addEventListener('click', toggleTunnel);

        // Reset
        resetBtn.addEventListener('click', resetAll);

        // Speed slider
        speedSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            speedValue.textContent = val + '×';
            Simulation.setSpeed(val);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 't' || e.key === 'T') {
                toggleTunnel();
            }
            if (e.key === 'r' || e.key === 'R') {
                resetAll();
            }
        });
    }

    /**
     * Toggle tunnel mode
     */
    function toggleTunnel() {
        if (Simulation.isReconcilingActive()) return;

        if (!Simulation.isTunnelActive()) {
            // Enter tunnel
            Simulation.enterTunnel();
            tunnelBtn.classList.add('active');
            tunnelBtnText.textContent = 'Exit Tunnel';
            tunnelIconEnter.style.display = 'none';
            tunnelIconExit.style.display = 'block';
        } else {
            // Exit tunnel
            Simulation.exitTunnel();
            tunnelBtn.classList.remove('active');
            tunnelBtnText.textContent = 'Enter Tunnel';
            tunnelIconEnter.style.display = 'block';
            tunnelIconExit.style.display = 'none';
        }
    }

    /**
     * Full reset
     */
    function resetAll() {
        Simulation.reset();
        MapManager.reset();
        StatsPanel.reset();

        tunnelBtn.classList.remove('active');
        tunnelBtnText.textContent = 'Enter Tunnel';
        tunnelIconEnter.style.display = 'block';
        tunnelIconExit.style.display = 'none';

        speedSlider.value = 1;
        speedValue.textContent = '1×';
        Simulation.setSpeed(1);

        // Restart
        setTimeout(() => Simulation.start(), 100);
    }

    // Boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
