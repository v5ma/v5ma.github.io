if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME was available.');
}

AFRAME.registerComponent('alongpath', {
    schema: {
        curve: {type: 'selector'}, // Use a selector to reference the curve entity
        closed: {default: false},
        dur: {default: 1000},
        delay: {default: 0},
        loop: {default: false},
        inspect: {default: false}
    },

    init: function () {
        this.initialPosition = this.el.getAttribute('position');
        this.curve = null;
        this.pathPoints = null;
        this.interval = 0;

        // Bind the updateCurve method
        this.updateCurve = this.updateCurve.bind(this);
    },

    update: function () {
        const curveEl = this.data.curve;

        if (!curveEl) {
            console.warn('No curve entity found for alongpath component.');
            return;
        }

        if (!curveEl.components.curve || !curveEl.components.curve.curve) {
            console.warn('Curve component not initialized on the selected curve entity.');
            return;
        }

        this.curve = curveEl.components.curve.curve;

        // If the curve updates, we need to recalculate everything
        curveEl.addEventListener('curve-updated', this.updateCurve);

        this.createCurve();
    },

    createCurve: function () {
        if (!this.curve) {
            console.warn('Curve not initialized.');
            return;
        }

        this.pathPoints = this.curve.getPoints(50); // Increase the resolution of points

        this.interval = 0;
        this.el.removeState('endofpath');

        // Optionally, visualize the path in debug mode
        if (this.data.inspect) {
            this.drawCurveLine();
        }
    },

    updateCurve: function () {
        if (!this.data.curve || !this.data.curve.components.curve) {
            console.warn('Curve entity not found or curve component not initialized.');
            return;
        }
        this.curve = this.data.curve.components.curve.curve;
        this.createCurve();
    },

    tick: function (time, timeDelta) {
        if (!this.curve) {
            console.warn('No curve available in tick function.');
            return;
        }

        // Update the position of the entity along the curve
        if (!this.el.is('endofpath')) {
            this.interval += timeDelta;

            let progress = 0;

            if (this.interval - this.data.delay >= this.data.dur) {
                progress = 1;
            } else if (this.interval - this.data.delay > 0) {
                progress = (this.interval - this.data.delay) / this.data.dur;
            }

            if (!this.data.loop && progress >= 1) {
                this.el.removeState('moveonpath');
                this.el.addState('endofpath');

                this.el.setAttribute('position', this.curve.getPoint(1));
            } else if (this.data.loop && progress >= 1) {
                this.interval = this.data.delay;
            } else {
                const position = this.curve.getPoint(progress);
                this.el.setAttribute('position', position);

                if (!this.el.is('moveonpath')) {
                    this.el.addState('moveonpath');
                }
            }
        }
    },

    remove: function () {
        this.el.setAttribute('position', this.initialPosition);
        const curveEl = this.data.curve;
        if (curveEl) {
            curveEl.removeEventListener('curve-updated', this.updateCurve);
        }
    },

    drawCurveLine: function () {
        // Implementation for visualizing the curve line
        // This can include creating a line entity to visualize the path
    }
});
