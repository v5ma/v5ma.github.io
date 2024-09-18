if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME was available.');
}

/**
 * Alongpath component for A-Frame.
 * Move Entities along a predefined path
 */
AFRAME.registerComponent('alongpath', {
    schema: {
        // Accepts a string of coordinates (e.g., "0,0,0 1,1,1 2,2,2")
        path: { type: 'string', default: '' },
        // Accepts a selector to a curve entity (e.g., "#myCurve")
        curve: { type: 'selector' },
        closed: { default: false },
        dur: { default: 1000 },
        delay: { default: 0 },
        loop: { default: false },
        rotate: { default: false }, // Optional: Rotate entity along path direction
        resetonplay: { default: true }, // Optional: Reset position when playing
        easing: { type: 'string', default: 'linear' }, // Optional: Easing function
        debug: { default: false } // Optional: Enable debugging visuals
    },

    init: function () {
        this.initialPosition = this.el.getAttribute('position');
        this.curve = null;
        this.pathPoints = null;
        this.interval = 0;
        this.startTime = null;

        // Bind the updateCurve method for event listener
        this.updateCurve = this.updateCurve.bind(this);

        // Handle play and pause events
        this.el.addEventListener('play', this.onPlay.bind(this));
        this.el.addEventListener('pause', this.onPause.bind(this));
    },

    update: function (oldData) {
        // Determine whether to use path string or curve entity
        if (this.data.path && this.data.path !== oldData.path) {
            this.createCurveFromPath();
        } else if (this.data.curve && this.data.curve !== oldData.curve) {
            this.createCurveFromEntity();
        }

        // Handle debug visuals
        if (this.data.debug && this.curve) {
            this.createDebugCurve();
        } else {
            this.removeDebugCurve();
        }
    },

    createCurveFromPath: function () {
        // Parse the path string into an array of Vector3 points
        this.pathPoints = this.data.path.trim().split(' ').map(function (p) {
            var coords = p.split(',');
            return new THREE.Vector3(
                parseFloat(coords[0]),
                parseFloat(coords[1]),
                parseFloat(coords[2])
            );
        });

        if (this.pathPoints.length >= 2) {
            this.curve = new THREE.CatmullRomCurve3(this.pathPoints);
            this.curve.closed = this.data.closed;
        } else {
            console.warn('The path needs at least 2 points.');
            this.curve = null;
        }

        // Reset animation
        this.resetAnimation();
    },

    createCurveFromEntity: function () {
        var curveEl = this.data.curve;

        if (!curveEl) {
            console.warn('No curve entity found for alongpath component.');
            this.curve = null;
            return;
        }

        if (!curveEl.components.curve || !curveEl.components.curve.curve) {
            console.warn('Curve component not initialized on the selected curve entity.');
            this.curve = null;
            return;
        }

        this.curve = curveEl.components.curve.curve;
        curveEl.addEventListener('curve-updated', this.updateCurve);

        // Reset animation
        this.resetAnimation();
    },

    updateCurve: function () {
        // Re-fetch the curve if it has been updated
        if (this.data.curve && this.data.curve.components.curve) {
            this.curve = this.data.curve.components.curve.curve;
            this.resetAnimation();
        }
    },

    resetAnimation: function () {
        this.interval = 0;
        this.startTime = null;
        this.el.removeState('endofpath');
        this.el.removeState('moving');

        if (this.data.resetonplay) {
            this.el.setAttribute('position', this.initialPosition);
        }
    },

    tick: function (time, timeDelta) {
        if (!this.curve) {
            return;
        }

        // Initialize start time
        if (this.startTime === null) {
            this.startTime = time;
        }

        // Calculate elapsed time
        var elapsedTime = time - this.startTime - this.data.delay;

        // If delay not yet passed, do nothing
        if (elapsedTime < 0) {
            return;
        }

        // Calculate progress along the curve
        var progress = elapsedTime / this.data.dur;

        // Handle looping
        if (this.data.loop) {
            progress = progress % 1;
        } else if (progress >= 1) {
            progress = 1;
            this.el.addState('endofpath');
            this.el.removeState('moving');
        }

        // Apply easing function
        var easedProgress = AFRAME.TWEEN.Easing[this.data.easing]
            ? AFRAME.TWEEN.Easing[this.data.easing](progress)
            : progress;

        // Get position along the curve
        var position = this.curve.getPointAt(easedProgress);
        this.el.setAttribute('position', position);

        // Optionally rotate entity to face along the path direction
        if (this.data.rotate && easedProgress < 1) {
            var nextPoint = this.curve.getPointAt(Math.min(easedProgress + 0.01, 1));
            var direction = nextPoint.clone().sub(position).normalize();
            var quaternion = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 0, 1),
                direction
            );
            this.el.object3D.quaternion.copy(quaternion);
        }

        if (!this.el.is('moving')) {
            this.el.addState('moving');
        }
    },

    remove: function () {
        // Clean up event listeners
        if (this.data.curve) {
            this.data.curve.removeEventListener('curve-updated', this.updateCurve);
        }
        this.removeDebugCurve();
        this.el.setAttribute('position', this.initialPosition);
    },

    onPlay: function () {
        if (this.data.resetonplay) {
            this.resetAnimation();
        }
    },

    onPause: function () {
        // Pause logic if needed
    },

    createDebugCurve: function () {
        // Remove existing debug curve
        this.removeDebugCurve();

        // Create a line to represent the curve
        var curvePoints = this.curve.getPoints(50);
        var geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
        var material = new THREE.LineBasicMaterial({ color: 0xff0000 });
        var line = new THREE.Line(geometry, material);

        // Add to the scene
        this.debugCurve = line;
        this.el.sceneEl.object3D.add(this.debugCurve);
    },

    removeDebugCurve: function () {
        if (this.debugCurve) {
            this.el.sceneEl.object3D.remove(this.debugCurve);
            this.debugCurve = null;
        }
    }
});
