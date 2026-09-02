/* ============================================
   Simulation Module — Vehicle movement &
   dead reckoning logic
   ============================================ */

const Simulation = (() => {

    // State
    let routeIndex = 0;           // Current position on dense route
    let isRunning = false;
    let inTunnel = false;
    let isReconciling = false;
    let speedMultiplier = 1;

    // Vehicle true position (follows the route)
    let truePos = { lat: 0, lng: 0 };
    let trueBearing = 0;
    let trueSpeedKmh = 40;

    // Naive dead reckoning state
    let naivePos = { lat: 0, lng: 0 };
    let naiveBearing = 0;
    let naiveAccumulatedDrift = 0;

    // AI dead reckoning state — tracks along route index
    let aiPos = { lat: 0, lng: 0 };
    let aiRouteIndex = 0;   // AI's estimated position along the dense route

    // Reconciliation animation
    let reconcileStartNaive = null;
    let reconcileStartAI = null;
    let reconcileTarget = null;
    let reconcileProgress = 0;

    // Tunnel entry data
    let tunnelEntryIndex = 0;

    // Animation frame reference
    let animFrameId = null;
    let lastFrameTime = 0;

    // Noise parameters for naive DR
    const NOISE = {
        headingStdDev: 6.0,       // degrees per step — aggressive drift
        speedStdDev: 0.18,        // fraction of speed
        biasHeading: 0,           // accumulated heading bias
        biasDecay: 0.998,         // slow decay = persistent drift direction
        biasInjection: 1.2        // strong bias accumulation
    };

    /**
     * Start the simulation
     */
    function start() {
        if (isRunning) return;

        routeIndex = 0;
        truePos = { ...RouteData.denseRoute[0] };
        naivePos = { ...truePos };
        aiPos = { ...truePos };
        aiRouteIndex = 0;
        trueBearing = 0;
        naiveBearing = 0;
        naiveAccumulatedDrift = 0;
        NOISE.biasHeading = 0;
        inTunnel = false;
        isReconciling = false;
        isRunning = true;
        lastFrameTime = performance.now();

        MapManager.setVehiclePosition(truePos);

        tick(performance.now());
    }

    /**
     * Main animation tick
     */
    function tick(now) {
        if (!isRunning) return;

        const dt = Math.min((now - lastFrameTime) / 1000, 0.1); // cap delta
        lastFrameTime = now;

        if (isReconciling) {
            updateReconciliation(dt);
        } else {
            updateVehicle(dt);

            if (inTunnel) {
                updateNaiveDR(dt);
                updateAIDR(dt);
                updateDriftStats();
            }
        }

        animFrameId = requestAnimationFrame(tick);
    }

    /**
     * Move the vehicle along the route
     */
    function updateVehicle(dt) {
        const route = RouteData.denseRoute;
        const stepsPerSecond = 15 * speedMultiplier;
        const stepsThisFrame = stepsPerSecond * dt;

        routeIndex += stepsThisFrame;

        // Loop the route
        if (routeIndex >= route.length - 1) {
            routeIndex = 0;
        }

        const idx = Math.floor(routeIndex);
        const frac = routeIndex - idx;
        const nextIdx = Math.min(idx + 1, route.length - 1);

        truePos = Utils.lerp(route[idx], route[nextIdx], frac);

        // Compute bearing
        if (idx < route.length - 1) {
            trueBearing = Utils.bearing(
                route[idx].lat, route[idx].lng,
                route[nextIdx].lat, route[nextIdx].lng
            );
        }

        // Simulated speed with some variation
        trueSpeedKmh = 35 + Math.sin(routeIndex * 0.05) * 10;

        // Update map
        MapManager.setVehiclePosition(truePos);

        // Update stats
        StatsPanel.updateSpeed(trueSpeedKmh);
        StatsPanel.updateHeading(trueBearing);
    }

    /**
     * Naive dead reckoning: integrate noisy sensors
     * This SHOULD drift off the road convincingly
     */
    function updateNaiveDR(dt) {
        const stepDistance = (trueSpeedKmh / 3.6) * dt * speedMultiplier;

        // Heading noise: persistent bias + random jitter
        NOISE.biasHeading =
            NOISE.biasHeading * NOISE.biasDecay +
            Utils.gaussianRandom(0, NOISE.biasInjection);

        const headingNoise =
            NOISE.biasHeading +
            Utils.gaussianRandom(0, NOISE.headingStdDev);

        naiveBearing = trueBearing + headingNoise;

        // Speed noise
        const speedNoise = 1 + Utils.gaussianRandom(0, NOISE.speedStdDev);
        const noisyDistance = stepDistance * Math.max(0.3, speedNoise);

        // Integrate position
        naivePos = Utils.movePoint(
            naivePos.lat, naivePos.lng,
            noisyDistance,
            naiveBearing
        );

        MapManager.setNaivePosition(naivePos);
    }

    /**
     * AI dead reckoning: uses same sensor data but with
     * AI-powered map-matching that constrains position to the road.
     * 
     * Strategy: advance along the known road route at the estimated
     * speed (with small noise), and add tiny perpendicular jitter
     * for visual realism. This simulates what a real map-matching
     * algorithm does — project noisy sensor data onto the road network.
     */
    function updateAIDR(dt) {
        const route = RouteData.denseRoute;
        const stepsPerSecond = 15 * speedMultiplier;

        // Speed estimation noise (AI filtered, much smaller than naive)
        const speedNoise = 1 + Utils.gaussianRandom(0, 0.04);
        const stepsThisFrame = stepsPerSecond * dt * speedNoise;

        // Advance AI's route index (stays on road by definition)
        aiRouteIndex += stepsThisFrame;

        // Wrap around
        if (aiRouteIndex >= route.length - 1) {
            aiRouteIndex = aiRouteIndex % (route.length - 1);
        }

        const idx = Math.floor(aiRouteIndex);
        const frac = aiRouteIndex - idx;
        const nextIdx = Math.min(idx + 1, route.length - 1);

        // Base position on the road
        const onRoad = Utils.lerp(route[idx], route[nextIdx], frac);

        // Add tiny perpendicular offset (simulates sensor noise after filtering)
        // This makes it look like it's "working" rather than perfectly on the line
        const perpOffset = Utils.gaussianRandom(0, 0.6); // ~0.6 meters offset
        const roadBearing = Utils.bearing(
            route[idx].lat, route[idx].lng,
            route[nextIdx].lat, route[nextIdx].lng
        );
        // Perpendicular is roadBearing + 90°
        aiPos = Utils.movePoint(onRoad.lat, onRoad.lng, perpOffset, roadBearing + 90);

        MapManager.setAIPosition(aiPos);
    }

    /**
     * Update drift statistics
     */
    function updateDriftStats() {
        const naiveDrift = Utils.haversineDistance(
            truePos.lat, truePos.lng,
            naivePos.lat, naivePos.lng
        );
        const aiDrift = Utils.haversineDistance(
            truePos.lat, truePos.lng,
            aiPos.lat, aiPos.lng
        );

        StatsPanel.updateDrift(naiveDrift, aiDrift);

        // Pan map to keep all markers visible
        MapManager.panToFit([truePos, naivePos, aiPos]);
    }

    /**
     * Enter tunnel — start DR comparison
     */
    function enterTunnel() {
        if (inTunnel || isReconciling) return;

        inTunnel = true;
        tunnelEntryIndex = routeIndex;

        // Initialize DR positions to current true position
        naivePos = { ...truePos };
        aiPos = { ...truePos };
        aiRouteIndex = routeIndex;  // AI starts tracking from current route position
        naiveBearing = trueBearing;
        NOISE.biasHeading = 0;
        naiveAccumulatedDrift = 0;

        // Clear previous trails
        MapManager.clearTrails();

        // Show DR markers
        MapManager.showDRMarkers(true);
        MapManager.showGPSLossOverlay(true);

        // Update UI
        StatsPanel.setDRMode();
    }

    /**
     * Exit tunnel — reconcile positions
     */
    function exitTunnel() {
        if (!inTunnel || isReconciling) return;

        inTunnel = false;
        isReconciling = true;
        reconcileProgress = 0;
        reconcileStartNaive = { ...naivePos };
        reconcileStartAI = { ...aiPos };
        reconcileTarget = { ...truePos };

        // Update UI
        StatsPanel.setGPSMode();
        MapManager.showGPSLossOverlay(false);
    }

    /**
     * Animate reconciliation
     * Naive: snaps abruptly, AI: smooth transition
     */
    function updateReconciliation(dt) {
        // Also keep updating the vehicle
        updateVehicle(dt);
        reconcileTarget = { ...truePos };

        reconcileProgress += dt * 1.5 * speedMultiplier;

        if (reconcileProgress >= 1) {
            // Done reconciling
            isReconciling = false;
            MapManager.showDRMarkers(false);
            MapManager.clearTrails();
            StatsPanel.hideDrift();
            return;
        }

        // Naive: abrupt snap (step function at ~0.15)
        if (reconcileProgress < 0.15) {
            MapManager.setNaivePosition(reconcileStartNaive);
        } else {
            // Instant snap
            MapManager.setNaivePosition(reconcileTarget);
        }

        // AI: smooth cubic ease
        const t = reconcileProgress;
        const eased = t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const aiRecPos = Utils.lerp(reconcileStartAI, reconcileTarget, eased);
        MapManager.setAIPosition(aiRecPos);

        // Update drift during reconciliation
        const naiveDrift = reconcileProgress < 0.15
            ? Utils.haversineDistance(truePos.lat, truePos.lng, reconcileStartNaive.lat, reconcileStartNaive.lng)
            : 0;
        const aiDrift = Utils.haversineDistance(truePos.lat, truePos.lng, aiRecPos.lat, aiRecPos.lng);

        StatsPanel.updateDrift(naiveDrift, aiDrift);
    }

    /**
     * Set simulation speed
     */
    function setSpeed(mult) {
        speedMultiplier = mult;
    }

    /**
     * Stop simulation
     */
    function stop() {
        isRunning = false;
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    }

    /**
     * Reset simulation
     */
    function reset() {
        stop();
        routeIndex = 0;
        inTunnel = false;
        isReconciling = false;
        NOISE.biasHeading = 0;
        truePos = { ...RouteData.denseRoute[0] };
        naivePos = { ...truePos };
        aiPos = { ...truePos };
    }

    /**
     * Query states
     */
    function isTunnelActive() { return inTunnel; }
    function isSimRunning() { return isRunning; }
    function isReconcilingActive() { return isReconciling; }

    return {
        start,
        stop,
        reset,
        enterTunnel,
        exitTunnel,
        setSpeed,
        isTunnelActive,
        isSimRunning,
        isReconcilingActive
    };

})();
