/* ============================================
   Stats Module — Live stats & drift chart
   ============================================ */

const StatsPanel = (() => {

    // DOM elements
    let modeBadge, modeLabel;
    let statSignal, statAccuracy, statSpeed, statHeading;
    let driftSection, driftValue, driftBar;
    let naiveError, aiError;
    let chartCanvas, chartCtx;

    // Chart data
    let driftHistory = { naive: [], ai: [], timestamps: [] };
    let chartStartTime = 0;
    const MAX_CHART_POINTS = 200;

    function init() {
        modeBadge = document.getElementById('mode-badge');
        modeLabel = document.getElementById('mode-label');
        statSignal = document.getElementById('stat-signal');
        statAccuracy = document.getElementById('stat-accuracy');
        statSpeed = document.getElementById('stat-speed');
        statHeading = document.getElementById('stat-heading');
        driftSection = document.getElementById('drift-section');
        driftValue = document.getElementById('drift-value');
        driftBar = document.getElementById('drift-bar');
        naiveError = document.getElementById('naive-error');
        aiError = document.getElementById('ai-error');
        chartCanvas = document.getElementById('drift-chart');
        chartCtx = chartCanvas.getContext('2d');

        // HiDPI canvas scaling
        scaleCanvas();
    }

    function scaleCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = chartCanvas.getBoundingClientRect();
        chartCanvas.width = rect.width * dpr;
        chartCanvas.height = rect.height * dpr;
        chartCtx.scale(dpr, dpr);
        chartCanvas.style.width = rect.width + 'px';
        chartCanvas.style.height = rect.height + 'px';
    }

    /**
     * Switch to GPS-Aided mode display
     */
    function setGPSMode() {
        modeBadge.className = 'mode-badge mode-gps';
        modeLabel.textContent = 'GPS-Aided';

        statSignal.innerHTML = `
            <span class="signal-icon signal-strong">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                    <rect x="1" y="12" width="3" height="5" rx="0.5"/>
                    <rect x="5.5" y="9" width="3" height="8" rx="0.5"/>
                    <rect x="10" y="5" width="3" height="12" rx="0.5"/>
                    <rect x="14.5" y="1" width="3" height="16" rx="0.5"/>
                </svg>
            </span>
            GPS Satellite`;
        statAccuracy.textContent = '±2.5m';
    }

    /**
     * Switch to Dead Reckoning mode display
     */
    function setDRMode() {
        modeBadge.className = 'mode-badge mode-dr';
        modeLabel.textContent = 'AI Dead Reckoning';

        statSignal.innerHTML = `
            <span class="signal-icon signal-lost">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" opacity="0.4">
                    <rect x="1" y="12" width="3" height="5" rx="0.5"/>
                    <rect x="5.5" y="9" width="3" height="8" rx="0.5" opacity="0.3"/>
                    <rect x="10" y="5" width="3" height="12" rx="0.5" opacity="0.15"/>
                    <rect x="14.5" y="1" width="3" height="16" rx="0.5" opacity="0.08"/>
                </svg>
            </span>
            Signal Lost`;
        statAccuracy.textContent = 'N/A';

        // Show drift section
        driftSection.style.display = 'block';
        chartStartTime = performance.now();
        driftHistory = { naive: [], ai: [], timestamps: [] };
    }

    /**
     * Update speed display
     */
    function updateSpeed(kmh) {
        statSpeed.textContent = kmh.toFixed(0) + ' km/h';
    }

    /**
     * Update heading display
     */
    function updateHeading(deg) {
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const idx = Math.round(deg / 45) % 8;
        statHeading.textContent = deg.toFixed(0) + '° ' + dirs[idx];
    }

    /**
     * Update drift stats
     */
    function updateDrift(naiveDist, aiDist) {
        const diff = Math.abs(naiveDist - aiDist);

        driftValue.textContent = Utils.formatDistance(naiveDist);
        naiveError.textContent = Utils.formatDistance(naiveDist);
        aiError.textContent = Utils.formatDistance(aiDist);

        // Drift bar (0-100m scale)
        const pct = Utils.clamp((naiveDist / 100) * 100, 0, 100);
        driftBar.style.width = pct + '%';

        // Record history
        const elapsed = (performance.now() - chartStartTime) / 1000;
        driftHistory.timestamps.push(elapsed);
        driftHistory.naive.push(naiveDist);
        driftHistory.ai.push(aiDist);

        if (driftHistory.timestamps.length > MAX_CHART_POINTS) {
            driftHistory.timestamps.shift();
            driftHistory.naive.shift();
            driftHistory.ai.shift();
        }

        drawChart();
    }

    /**
     * Draw the drift-over-time chart on canvas
     */
    function drawChart() {
        const w = chartCanvas.getBoundingClientRect().width;
        const h = chartCanvas.getBoundingClientRect().height;
        const ctx = chartCtx;

        ctx.clearRect(0, 0, w, h);

        if (driftHistory.timestamps.length < 2) return;

        const times = driftHistory.timestamps;
        const tMin = times[0];
        const tMax = times[times.length - 1];
        const tRange = Math.max(tMax - tMin, 1);

        // Find max Y
        const maxNaive = Math.max(...driftHistory.naive, 1);
        const maxAI = Math.max(...driftHistory.ai, 1);
        const yMax = Math.max(maxNaive, maxAI) * 1.2;

        const padLeft = 36;
        const padBottom = 20;
        const padTop = 8;
        const padRight = 8;
        const chartW = w - padLeft - padRight;
        const chartH = h - padTop - padBottom;

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = padTop + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(w - padRight, y);
            ctx.stroke();
        }

        // Y axis labels
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const y = padTop + (chartH / 4) * i;
            const val = yMax * (1 - i / 4);
            ctx.fillText(val.toFixed(0) + 'm', padLeft - 4, y + 3);
        }

        // X axis label
        ctx.textAlign = 'center';
        ctx.fillText('Time (s)', padLeft + chartW / 2, h - 2);

        // Helper to map values to canvas coords
        function toX(t) { return padLeft + ((t - tMin) / tRange) * chartW; }
        function toY(v) { return padTop + chartH - (v / yMax) * chartH; }

        // Draw naive line (red)
        drawLine(ctx, times, driftHistory.naive, toX, toY, '#FF4D6A', 2);

        // Draw AI line (green)
        drawLine(ctx, times, driftHistory.ai, toX, toY, '#00E5A0', 2);
    }

    function drawLine(ctx, xData, yData, toX, toY, color, width) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        for (let i = 0; i < xData.length; i++) {
            const x = toX(xData[i]);
            const y = toY(yData[i]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Glow effect
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width + 2;
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < xData.length; i++) {
            const x = toX(xData[i]);
            const y = toY(yData[i]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }

    /**
     * Hide drift section
     */
    function hideDrift() {
        driftSection.style.display = 'none';
    }

    /**
     * Reset all stats
     */
    function reset() {
        setGPSMode();
        hideDrift();
        updateSpeed(0);
        updateHeading(0);
        driftHistory = { naive: [], ai: [], timestamps: [] };
    }

    return {
        init,
        setGPSMode,
        setDRMode,
        updateSpeed,
        updateHeading,
        updateDrift,
        hideDrift,
        reset
    };

})();
