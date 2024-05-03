/* global AFRAME, THREE */

if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME was available.');
}

/**
 * Curve component for A-Frame to deal with spline curves
 */
var zAxis = new THREE.Vector3(0, 0, 1);
var degToRad = THREE.MathUtils.degToRad;

AFRAME.registerComponent('curve-point', {
    schema: {
        position: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
        curveId: { type: 'string', default: '' }
    },
    init: function () {
        this.el.addEventListener("componentchanged", this.changeHandler.bind(this));
        this.el.emit("curve-point-change");
    },
    changeHandler: function (event) {
        if (event.detail.name == "position") {
            this.el.emit("curve-point-change", { curveId: this.data.curveId });
        }
    }
});

AFRAME.registerComponent('curve', {
    schema: {
        type: {
            type: 'string',
            default: 'CatmullRom',
            oneOf: ['CatmullRom', 'CubicBezier', 'QuadraticBezier', 'Line']
        },
        closed: {
            type: 'boolean',
            default: false
        },
        lineColor: { default: '#ff0000' }
    },
    init: function () {
        this.pathPoints = null;
        this.curve = null;
        this.geometry = new THREE.BufferGeometry();
        this.lineMaterial = new THREE.LineBasicMaterial({ color: this.data.lineColor });

        this.el.addEventListener("curve-point-change", this.update.bind(this));
    },
    update: function (oldData) {
        const curveId = this.el.getAttribute('curve-id');
        this.points = Array.from(document.querySelectorAll(`a-curve-point[curve-id="${curveId}"]`));

        if (this.points.length <= 1) {
            console.warn("At least 2 curve-points needed to draw a curve");
            this.curve = null;
            this.el.removeObject3D('mesh');
        } else {
            // Get Array of Positions from Curve-Points
            var pointsArray = this.points.map(function (point) {
                return point.getAttribute('position');
            });

            // Update the Curve if either the Curve-Points or other Properties changed
            if (!AFRAME.utils.deepEqual(pointsArray, this.pathPoints) || (oldData !== 'CustomEvent' && !AFRAME.utils.deepEqual(this.data, oldData))) {
                this.curve = null;

                this.pathPoints = pointsArray;

                // Create Curve
                switch (this.data.type) {
                    case 'CubicBezier':
                        if (this.pathPoints.length !== 4) {
                            throw new Error('The Three constructor of type CubicBezierCurve3 requires 4 points');
                        }
                        this.curve = new THREE.CubicBezierCurve3(this.pathPoints[0], this.pathPoints[1], this.pathPoints[2], this.pathPoints[3]);
                        break;
                    case 'QuadraticBezier':
                        if (this.pathPoints.length !== 3) {
                            throw new Error('The Three constructor of type QuadraticBezierCurve3 requires 3 points');
                        }
                        this.curve = new THREE.QuadraticBezierCurve3(this.pathPoints[0], this.pathPoints[1], this.pathPoints[2]);
                        break;
                    case 'Line':
                        if (this.pathPoints.length !== 2) {
                            throw new Error('The Three constructor of type LineCurve3 requires 2 points');
                        }
                        this.curve = new THREE.LineCurve3(this.pathPoints[0], this.pathPoints[1]);
                        break;
                    case 'CatmullRom':
                        this.curve = new THREE.CatmullRomCurve3(this.pathPoints);
                        break;
                    case 'Spline':
                        this.curve = new THREE.SplineCurve3(this.pathPoints);
                        break;
                    default:
                        throw new Error('No Three constructor of type (case sensitive): ' + this.data.type + 'Curve3');
                }

                this.curve.closed = this.data.closed;
                this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.curve.getPoints(this.curve.points.length * 10), 3));
                this.el.setObject3D('mesh', new THREE.Line(this.geometry, this.lineMaterial));
                this.el.emit('curve-updated');
            }
        }
    },
    remove: function () {
        this.el.removeEventListener("curve-point-change", this.update.bind(this));
        if (this.geometry) this.geometry.dispose();
        if (this.lineMaterial) this.lineMaterial.dispose();
    },
    closestPointInLocalSpace: function closestPoint(point, resolution, testPoint, currentRes) {
        if (!this.curve) throw Error('Curve not instantiated yet.');
        resolution = resolution || 0.1 / this.curve.getLength();
        currentRes = currentRes || 0.5;
        testPoint = testPoint || 0.5;
        currentRes /= 2;
        var aTest = testPoint + currentRes;
        var bTest = testPoint - currentRes;
        var a = this.curve.getPointAt(aTest);
        var b = this.curve.getPointAt(bTest);
        var aDistance = a.distanceTo(point);
        var bDistance = b.distanceTo(point);
        var aSmaller = aDistance < bDistance;
        if (currentRes < resolution) {
            var tangent = this.curve.getTangentAt(aSmaller ? aTest : bTest);
            if (currentRes < resolution) return {
                result: aSmaller ? aTest : bTest,
                location: aSmaller ? a : b,
                distance: aSmaller ? aDistance : bDistance,
                normal: normalFromTangent(tangent),
                tangent: tangent
            };
        }
        if (aDistance < bDistance) {
            return this.closestPointInLocalSpace(point, resolution, aTest, currentRes);
        } else {
            return this.closestPointInLocalSpace(point, resolution, bTest, currentRes);
        }
    }
});

var tempQuaternion = new THREE.Quaternion();

function normalFromTangent(tangent) {
    var lineEnd = new THREE.Vector3(0, 1, 0);
    tempQuaternion.setFromUnitVectors(zAxis, tangent);
    lineEnd.applyQuaternion(tempQuaternion);
    return lineEnd;
}

AFRAME.registerComponent('clone-along-line', {
    schema: {
        start: { type: 'vec3', default: { x: -1, y: 1, z: -3 } },
        end: { type: 'vec3', default: { x: 1, y: 1, z: -3 } },
        spacing: { default: 0.2 }
    },
    init: function () {
        this.cloneBoxes();
    },
    cloneBoxes: function () {
        const start = new THREE.Vector3(this.data.start.x, this.data.start.y, this.data.start.z);
        const end = new THREE.Vector3(this.data.end.x, this.data.end.y, this.data.end.z);
        const distance = start.distanceTo(end);
        const direction = end.clone().sub(start).normalize();

        let position = start.clone();
        let cloneCount = 0;

        while (position.distanceTo(start) <= distance) {
            const clone = document.createElement('a-box');
            clone.setAttribute('width', '0.1');
            clone.setAttribute('height', '0.1');
            clone.setAttribute('depth', '0.1');
            clone.setAttribute('color', 'yellow');
            clone.setAttribute('position', position);
            this.el.appendChild(clone);

            position.add(direction.clone().multiplyScalar(this.data.spacing));
            cloneCount++;
        }

        console.log(`Cloned ${cloneCount} boxes along the line.`);
    }
});

AFRAME.registerComponent('clone-along-curve', {
    schema: {
        curveId: { type: 'string', default: '' },
        spacing: { default: 0.2 }
    },
    init: function () {
        this.el.sceneEl.addEventListener('curve-point-change', (event) => {
            if (event.detail.curveId === this.data.curveId) {
                this.cloneBoxesAlongCurve();
            }
        });

        this.cloneBoxesAlongCurve();
    },
    cloneBoxesAlongCurve: function () {
        const curveId = this.data.curveId;
        const curvePoints = Array.from(document.querySelectorAll(`a-curve-point[curve-id="${curveId}"]`));
        const curve = new THREE.CatmullRomCurve3(curvePoints.map(point => {
            const pos = point.getAttribute('position');
            return new THREE.Vector3(pos.x, pos.y, pos.z);
        }));

        const length = curve.getLength();
        let position = 0;
        let cloneCount = 0;

        while (position <= length) {
            const point = curve.getPointAt(position / length);
            const clone = document.createElement('a-box');
            clone.setAttribute('width', '0.1');
            clone.setAttribute('height', '0.1');
            clone.setAttribute('depth', '0.1');
            clone.setAttribute('color', 'yellow');
            clone.setAttribute('position', point);
            this.el.appendChild(clone);

            position += this.data.spacing;
            cloneCount++;
        }

        console.log(`Cloned ${cloneCount} boxes along the curve.`);
    }
});

AFRAME.registerPrimitive('a-curve-point', {
    defaultComponents: {
        'curve-point': {},
    },
    mappings: {
        'position': 'curve-point.position',
        'curve-id': 'curve-point.curveId'
    }
});

AFRAME.registerPrimitive('a-curve', {
    defaultComponents: {
        'curve': {}
    },
    mappings: {
        type: 'curve.type',
        'curve-id': 'curve.curveId'
    }
});
