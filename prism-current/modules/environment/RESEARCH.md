# Rendering research / original implementation

Reviewed 2026-09-21. User screenshots of turbulent flame jets, foam, spray, ocean chop and wakes establish an intended visual direction, not a measured Prism performance target. This module does not embed those images or copy commercial source/assets.

Mark Finch's NVIDIA GPU Gems chapter, Effective Water Simulation from Physical Models, explains distinct geometric/normal wave scales, analytic derivatives, Gerstner lateral displacement, non-overturning steepness and wavelength filtering relative to mesh resolution. Those general methods inform the original four-wave implementation and its matching CPU query. https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models

Three.js ShaderMaterial documents custom uniforms and the renderer-supplied matrix path used here. The existing game's Three.js namespace is injected; no separate renderer is created. https://threejs.org/docs/pages/ShaderMaterial.html

The official Water addon is a flat reflective water baseline, not the complete ocean shown in the supplied screenshots. This pass avoids its extra reflected-scene pass to preserve an affordable first stereo path. That tradeoff means the new surface does NOT mirror boats, scene geometry or the real room. https://threejs.org/docs/pages/Water.html

The supplied threejswaterpro.com reference opened its demo shell, but its full implementation and licensing were not available as inspected source. threejsroadmap.com returned an access error. No undocumented Water Pro feature or performance result is claimed here. No commercial product was purchased, installed or copied. https://threejswaterpro.com/ https://threejsroadmap.com/

The author's Three Pinata repository describes geometry fracture and cutting; it is not a flame renderer. It is a possible future destruction reference, not the source of this water shader. https://github.com/dgreenheck/three-pinata

EZ-Tree and its author's repository concern procedural tree and foliage generation. They are references for the later tree module; no tree implementation has been imported by the water pass. https://eztree.dev/ https://github.com/dgreenheck/ez-tree

All new water GLSL, data-texture generation, pool logic, API and adapter source are original to this project. Existing dependency notices remain unchanged. Research does not establish browser, headset or frame-rate certification; record actual native and physical tests separately.
