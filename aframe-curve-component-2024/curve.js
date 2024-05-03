<!DOCTYPE html>
<html>
<head>
  <title>A-Frame Curve and Sphere Test Scene</title>
  <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
  <script src="curve.js"></script>
</head>
<body>
  <a-scene>
    <!-- Define the curve with several points and attach the draw-curve component -->
    <a-curve id="curve1" curve="closed: false">
      <a-curve-point position="-1 1 -3">
        <a-sphere radius="0.1" color="green"></a-sphere>
      </a-curve-point>
      <a-curve-point position="-0.7 1.7 -3">
        <a-sphere radius="0.1" color="green"></a-sphere>
      </a-curve-point>
      <a-curve-point position="0 2 -3">
        <a-sphere radius="0.1" color="green"></a-sphere>
      </a-curve-point>
      <a-curve-point position="0.7 1.7 -3">
        <a-sphere radius="0.1" color="green"></a-sphere>
      </a-curve-point>
      <a-curve-point position="1 1 -3">
        <a-sphere radius="0.1" color="green"></a-sphere>
      </a-curve-point>
      <a-curve-point position="1.4 2 -3">
        <a-sphere radius="0.1" color="green"></a-sphere>
      </a-curve-point>
    </a-curve>
    <a-draw-curve curveref="#curve1"></a-draw-curve>

    <!-- Static test line (straight line) -->
    <a-entity line="start: -1 1 -3; end: 1 1 -3; color: red;"></a-entity>

    <!-- Dynamic curved line visualized based on curve points -->
    <a-curve id="curve2" curve="closed: false">
      <a-curve-point position="-1 1 -4"></a-curve-point>
      <a-curve-point position="0 2 -4"></a-curve-point>
      <a-curve-point position="1 1 -4"></a-curve-point>
    </a-curve>
    <a-draw-curve curveref="#curve2"></a-draw-curve>

    <!-- Clone entities along the curve -->
    <a-box width="0.1" height="0.1" depth="0.1" color="yellow" clone-along-curve="curve: #curve1; spacing: 0.2;"></a-box>
  </a-scene>
</body>
</html>
