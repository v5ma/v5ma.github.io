# A-Frame XR Starter Code:

Use this when you want to start building a website that could be either AR or VR depending on both the user's hardware and their choice.

## Two examples each with a hide components to easily hide either the A-Frame Environment component or the Sky & Ground whenever the user opts for AR mode.

### People who want to use VR mode they can see either an A-Frame Environment or a Sky & Ground that you can define.

I've tested this with Meta Quest 3 and A-Frame version 1.5.0 in May 2024.

## Summary

This documentation provides a detailed explanation of two A-Frame components: `hide-sky-ground-ar-mode` and `hide-environment-in-ar`. Both components are designed to manage the visibility of specific entities when entering and exiting AR mode.

See example of Hide Environment in AR with your Meta Quest 3: 
[Hide Environment in AR](http://v5ma.github.io/starters/hide-environment-in-ar)
 
See example of XR Hide Sky (and) Ground (in) AR Mode:
[Hide Sky Ground AR Mode](https://v5ma.github.io/starters/xr_hide_sky_starter.html)
---

## `hide-sky-ground-ar-mode` Component

The `hide-sky-ground-ar-mode` component for A-Frame is designed to manage the visibility of sky and ground entities when entering and exiting AR mode. It hides the sky and ground when AR mode is activated and restores their visibility when exiting AR mode.

### Usage

#### Include the A-Frame Library

Ensure you have the A-Frame library included in your HTML file:

```html
<script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
Register the Component
Add the following script to register the hide-sky-ground-ar-mode component:

html
Copy code
<script>
    // 1. Register the 'hide-sky-ground-ar-mode' component
    AFRAME.registerComponent('hide-sky-ground-ar-mode', {
        init: function () {
            // 1.1 Initialize properties for the component
            this.skyEl = document.querySelector('a-sky');
            this.groundEl = document.querySelector('#ground');
            
            // 2. Event listener for entering VR/AR mode
            this.el.sceneEl.addEventListener('enter-vr', (ev) => {
                // 2.1 Store the current visibility state of the element
                this.wasVisible = this.el.getAttribute('visible');
                // 2.2 Check if the scene is in AR mode
                if (this.el.sceneEl.is('ar-mode')) {
                    // 2.2.1 Hide the element and add 'ar-mode' class to body
                    this.el.setAttribute('visible', false);
                    document.body.classList.add('ar-mode');
                    this.currentMode = 'ar';
                    // 2.2.2 Hide the sky and ground entities
                    if (this.skyEl) {
                        this.skyEl.setAttribute('visible', false);
                    }
                    if (this.groundEl) {
                        this.groundEl.setAttribute('visible', false);
                    }
                } else {
                    // 2.3 Handle VR mode
                    this.currentMode = 'vr';
                    document.body.classList.add('vr-mode');
                }
            });

            // 3. Event listener for exiting VR/AR mode
            this.el.sceneEl.addEventListener('exit-vr', (ev) => {
                // 3.1 Restore visibility state of the element
                if (this.currentMode === 'ar') {
                    if (this.wasVisible) this.el.setAttribute('visible', true);
                    document.body.classList.remove('ar-mode');
                    // 3.2 Show the sky and ground entities
                    if (this.skyEl) {
                        this.skyEl.setAttribute('visible', true);
                    }
                    if (this.groundEl) {
                        this.groundEl.setAttribute('visible', true);
                    }
                } else if (this.currentMode === 'vr') {
                    document.body.classList.remove('vr-mode');
                }
                this.currentMode = null;
            });
        }
    });
</script>
Define the Scene
Define your A-Frame scene and apply the hide-sky-ground-ar-mode component to the relevant entities:

html
Copy code
<body>
    <!-- Define the A-Frame scene with XR mode UI -->
    <a-scene button xr-mode-ui="XRMode: xr">
        <!-- Add basic shapes to the scene for visual interest -->
        <a-box scale="0.3 0.3 0.3" position="-0.25 0.95 -0.6" rotation="0 55 0" color="#4CC3D9"></a-box>
        <a-sphere position="0 1.15 -1" radius="0.3" color="#EF2D5E"></a-sphere>
        <a-cylinder position="0.275 0.95 -0.6" radius="0.15" height="0.4" color="#FFC65D"></a-cylinder>
        <!-- Add a shiny, transparent emerald box to the scene -->
        <a-box id="emerald" scale="1 0.1 1" position="0 1 -0.75" rotation="0 0 0"
               material="color: #50C878; opacity: 0.5; metalness: 0.6;"></a-box>
        
        <!-- Add a sky entity to the scene -->
        <a-sky color="#87CEEB"></a-sky>
        
        <!-- Add a ground entity with 'hide-sky-ground-ar-mode' component -->
        <a-plane id="ground" rotation="-90 0 0" width="100" height="100" color="#7BC8A4" hide-sky-ground-ar-mode></a-plane>
    </a-scene>
</body>
How It Works
Component Initialization
Initialize Properties:
The component initializes references to the a-sky entity and the ground entity with the ID ground.
Event Listeners
Entering VR/AR Mode:

The component listens for the enter-vr event.
It stores the current visibility state of the element.
Checks if the scene is in AR mode (is('ar-mode')).
If in AR mode:
Hides the element.
Adds the ar-mode class to the body.
Sets the currentMode to ar.
Hides the sky and ground entities.
If in VR mode:
Sets the currentMode to vr.
Adds the vr-mode class to the body.
Exiting VR/AR Mode:

The component listens for the exit-vr event.
If the mode was AR:
Restores the original visibility of the element.
Removes the ar-mode class from the body.
Shows the sky and ground entities.
If the mode was VR:
Removes the vr-mode class from the body.
Resets the currentMode to null.
hide-environment-in-ar Component
The hide-environment-in-ar component for A-Frame is designed to manage the visibility of the environment entity when entering and exiting AR mode. It hides the environment when AR mode is activated and restores its visibility when exiting AR mode.

Usage
Include the A-Frame Library
Ensure you have the A-Frame library included in your HTML file:

html
Copy code
<script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
Include the Environment Component
Ensure you have the A-Frame environment component included:

html
Copy code
<script src="https://unpkg.com/aframe-environment-component@1.3.3/dist/aframe-environment-component.min.js"></script>
Register the Component
Add the following script to register the hide-environment-in-ar component:

html
Copy code
<script>
    // 1. Register the 'hide-environment-in-ar' component
    AFRAME.registerComponent('hide-environment-in-ar', {
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
Define the Scene
Define your A-Frame scene and apply the hide-environment-in-ar component to the relevant entities:

html
Copy code
<body>
    <a-scene xr-mode-ui="XRMode: xr" background="color: white">
        <!-- Environment entity with preset configuration -->
        <a-entity environment="preset: forest"></a-entity>
        <!-- Background entity with 'hide-environment-in-ar' component -->
        <a-entity background hide-environment-in-ar></a-entity>
        <!-- Basic shapes in the scene for visual interest -->
        <a-box scale="0.3 0.3 0.3" position="-0.25 0.85 -0.6" rotation="0 55 0" color="#4CC3D9"></a-box>
        <a-sphere position="0 1.05 -1" radius="0.3" color="#EF2D5E"></a-sphere>
        <a-cylinder position="0.275 0.85 -0.6" radius="0.15" height="0.4" color="#FFC65D"></a-cylinder>
        <a-plane position="0 0.70 -0.75" rotation="-90 0 0" width="1" height="1" color="#7BC8A4"></a-plane>
    </a-scene>
</body>
How It Works
Component Initialization
Initialize Properties:
The component initializes references to the environment entity (environmentEl), and properties for ambient and directional lights.
Event Listeners
Entering VR/AR Mode:

The component listens for the enter-vr event.
It stores the visibility state of the element.
Checks if the scene is in AR mode (is('ar-mode')).
If in AR mode:
Hides the element.
Adds the ar-mode class to the body.
Sets the currentMode to ar.
Hides the environment entity.
Adds ambient and directional lights.
If in VR mode:
Sets the currentMode to vr.
Adds the vr-mode class to the body.
Exiting VR/AR Mode:

The component listens for the exit-vr event.
If the mode was AR:
Restores the original visibility of the element.
Removes the ar-mode class from the body.
Shows the environment entity.
Removes ambient and directional lights.
If the mode was VR:
Removes the vr-mode class from the body.
Resets the currentMode to null.
Lights Management
Add Lights Function:

Adds ambient and directional lights to the scene when the environment is hidden.
Remove Lights Function:

Removes ambient and directional lights from the scene when the environment is shown.
Example
Here is a complete example of an A-Frame scene using the hide-environment-in-ar component:

html
Copy code
<!DOCTYPE html>
<html>
<head>
    <title>A-Frame XR: Hide Environment In AR</title>
    <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
    <script src="https://unpkg.com/aframe-environment-component@1.3.3/dist/aframe-environment-component.min.js"></script>
    <script>
        // 1. Register the 'hide-environment-in-ar' component
        AFRAME.registerComponent('hide-environment-in-ar', {
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
</head>
<body>
    <a-scene xr-mode-ui="XRMode: xr" background="color: white">
        <!-- Environment entity with preset configuration -->
        <a-entity environment="preset: forest"></a-entity>
        <!-- Background entity with 'hide-environment-in-ar' component -->
        <a-entity background hide-environment-in-ar></a-entity>
        <!-- Basic shapes in the scene for visual interest -->
        <a-box scale="0.3 0.3 0.3" position="-0.25 0.85 -0.6" rotation="0 55 0" color="#4CC3D9"></a-box>
        <a-sphere position="0 1.05 -1" radius="0.3" color="#EF2D5E"></a-sphere>
        <a-cylinder position="0.275 0.85 -0.6" radius="0.15" height="0.4" color="#FFC65D"></a-cylinder>
        <a-plane position="0 0.70 -0.75" rotation="-90 0 0" width="1" height="1" color="#7BC8A4"></a-plane>
    </a-scene>
</body>
</html>
This documentation provides a detailed explanation of both the hide-sky-ground-ar-mode and hide-environment-in-ar components, their usage, and how they work, along with example implementations.
