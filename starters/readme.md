# Example XR Starter plus A-Frame Lights in AR (for the A-Frame Environment Component):

This documentation provides a detailed explanation of two A-Frame examples: `XR-mode-example` and `light-in-ar`, their usage, and how they work, along with example implementations.

Regarding the first example: apparently there is a hide-on-enter-ar component in the latest version of A-Frame that reduces the original purpose of the first starter now called `XR-mode-example` to just an example. There is now also a hide-on-enter-vr component built into A-Frame. Include hide-on-enter-ar on any entity, sky, ground, etc, that you wish to hide when a user enters AR. The example illustrates how it's done.

Use either of these starters when you want to start building a website that could be either AR or VR depending on both the user's hardware and their choice.

The second starter example has a component called `light-in-ar` is literally only for adding light to the scene when the environment is removed and removing light from the scene when the environment is returned (when someone exits AR).

## Note: You don't need the lights in AR component unless you are hiding the A-Frame Environment Component. This component adds lights to the scene in AR mode so the page isn't black.

Lights in AR is necessary if you are hiding the A-Frame Environment Component, because when you hide it, there are no lights in the scene.

See example of "light-in-ar" with your Meta Quest 3: 
[`light-in-ar`](https://v5ma.github.io/starters/hide-environment-in-ar.html)

See example of "XR-mode-example" in AR Mode with your Meta Quest 3:
[Hide Sky Ground AR Mode](https://v5ma.github.io/starters/xr_hide_sky_starter.html)

In each example after loading the example page try clicking on AR mode and you should see the page in AR mode without a sky, ground or environment, then press the menu button, find the webpage again, exit Immersive mode, and try entering VR mode, then you should see the sky, ground, and or the environment should remain in VR mode. That is the point. One website can be inclusive of both modes.

---


# The `light-in-ar` Component
## The `light-in-ar` component for A-Frame is designed to manage the visibility of light in the environment entity when entering and exiting AR mode. It adds light to the environment when AR mode is activated and restores removes the extra light when exiting AR mode.

Usage
Include the A-Frame Library
Ensure you have the A-Frame library included in your HTML file:
```
<script src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
```
Include the Environment Component
Ensure you have the A-Frame environment component included:

```
<script src="https://unpkg.com/aframe-environment-component@1.3.3/dist/aframe-environment-component.min.js"></script>
```
Register the Component
Add the following script to register the `light-in-ar` component:
```
<script>
        // 1. Register the 'lights-in-ar' component
        AFRAME.registerComponent('lights-in-ar', {
            init: function () {
                // 1.1 Initialize properties for the component
                this.currentMode = null;
                this.environmentEl = document.querySelector('a-entity[environment]');
                this.ambientLight = null;
                this.directionalLight = null;

                // 1.2 Set environment to active initially if it exists
                if (this.environmentEl) {
                    this.environmentEl.setAttribute('environment', 'active', true);
                }

                // 2. Event listener for entering VR/AR mode
                this.el.sceneEl.addEventListener('enter-vr', (ev) => {
                    // 2.1 Store the visibility state of the element
                    this.wasVisible = this.el.getAttribute('visible');
                    // 2.2 Check if the mode is AR
                    if (this.el.sceneEl.is('ar-mode')) {
                        this.el.setAttribute('visible', false);
                        document.body.classList.add('ar-mode');
                        this.currentMode = 'ar';
                        // 2.3 Hide environment and add lights in AR mode
                        if (this.environmentEl) {
                            this.environmentEl.setAttribute('environment', 'active', false);
                            this.addLights();
                        }
                    } else {
                        document.body.classList.add('vr-mode');
                        this.currentMode = 'vr';
                    }
                });

                // 3. Event listener for exiting VR/AR mode
                this.el.sceneEl.addEventListener('exit-vr', (ev) => {
                    // 3.1 Restore visibility and environment state in AR mode
                    if (this.currentMode === 'ar') {
                        if (this.wasVisible) this.el.setAttribute('visible', true);
                        document.body.classList.remove('ar-mode');
                        if (this.environmentEl) {
                            this.environmentEl.setAttribute('environment', 'active', true);
                        }
                        this.removeLights();
                    } else if (this.currentMode === 'vr') {
                        document.body.classList.remove('vr-mode');
                    }
                    this.currentMode = null;
                });
            },

            // 4. Add lights function
            addLights: function() {
                // 4.1 Add ambient light to the scene
                this.ambientLight = document.createElement('a-entity');
                this.ambientLight.setAttribute('light', {type: 'ambient', color: '#FFF', intensity: 0.3});
                this.el.sceneEl.appendChild(this.ambientLight);

                // 4.2 Add directional light to the scene
                this.directionalLight = document.createElement('a-entity');
                this.directionalLight.setAttribute('light', {type: 'directional', color: '#FFF', intensity: 0.6, castShadow: true});
                this.directionalLight.setAttribute('position', {x: 0, y: 6, z: 0});
                this.el.sceneEl.appendChild(this.directionalLight);
            },

            // 5. Remove lights function
            removeLights: function() {
                // 5.1 Remove ambient light from the scene
                if (this.ambientLight) {
                    this.ambientLight.remove();
                    this.ambientLight = null;
                }

                // 5.2 Remove directional light from the scene
                if (this.directionalLight) {
                    this.directionalLight.remove();
                    this.directionalLight = null;
                }
            }
        });
    </script>
```
Define the Scene
Define your A-Frame scene and apply the `light-in-ar` component to the relevant entities:
```
<body>
    <a-scene xr-mode-ui="XRMode: xr">
        <!-- 6. Environment entity with preset configuration -->
        <a-entity environment="preset: forest"  lights-in-ar></a-entity>
        <!-- 7. note you could use hide-on-enter-ar inside the environment entity to hide it, but you won't have lights -->
        
        <!-- 8. Basic shapes in the scene for visual interest -->
        <a-box scale="0.3 0.3 0.3" position="-0.25 0.85 -0.6" rotation="0 55 0" color="#4CC3D9"></a-box>
        <a-sphere position="0 1.05 -1" radius="0.3" color="#EF2D5E"></a-sphere>
        <a-cylinder position="0.275 0.85 -0.6" radius="0.15" height="0.4" color="#FFC65D"></a-cylinder>
        <a-box id="emerald" scale="1 0.01 1" position="0 0.7 -0.75" rotation="0 0 0"
               material="color: #50C878; opacity: 0.5; metalness: 0.6;"></a-box>
    </a-scene>
</body>
```
