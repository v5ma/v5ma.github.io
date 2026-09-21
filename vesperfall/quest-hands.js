/* Optional WebXR hand-tracking UI. Tracked controllers remain the sole owner
 * of physical combat. A hand source never masquerades as a grip/gamepad.
 * API contract: https://www.w3.org/TR/webxr-hand-input-1/ */
(function (root) {
  'use strict';
  function install(g) {
    const T = g.T, M = VesperSurestep, controls = g.dominionControls;
    const state = {active: false, selections: 0, sources: new Map(), activeSide: 'right'};
    const rays = {}, dots = {};
    for (const side of ['left', 'right']) {
      const line = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]),
        new T.LineBasicMaterial({color: side === 'left' ? '#efd69e' : '#a5ece1', depthTest: false, transparent: true, opacity: .8}));
      line.renderOrder = 902; line.frustumCulled = false; line.visible = false;
      const dot = new T.Mesh(new T.SphereGeometry(.011, 8, 6), new T.MeshBasicMaterial({color: '#e4fff4', depthTest: false}));
      dot.renderOrder = 903; dot.visible = false;
      g.scene.object3D.add(line, dot); rays[side] = line; dots[side] = dot;
    }
    const hide = () => { for (const x of [...Object.values(rays), ...Object.values(dots)]) x.visible = false; };
    function reset() {
      state.sources.clear(); state.active = false; hide();
      controls.state.xrNeutral = false; g.prevButtons = {}; g.cancel();
    }
    const drawMenu = g.drawMenu.bind(g);
    g.drawMenu = function () {
      drawMenu();
      if (!state.active || !g.xrPanel) return;
      const {ctx, texture} = g.xrPanel;
      ctx.fillStyle = '#142230'; ctx.fillRect(20, 687, 984, 46);
      ctx.fillStyle = '#d4eee3'; ctx.font = '18px Arial'; ctx.textAlign = 'center';
      ctx.fillText('Hands: point and pinch to select. Open fingers between actions. Controllers are needed to play.', 512, 712, 930);
      texture.needsUpdate = true;
    };
    const pause = g.setPaused.bind(g);
    g.setPaused = function (value) {
      for (const sample of state.sources.values()) sample.pinch.reset();
      pause(value);
    };
    const oldXR = g.processXR.bind(g);
    g.processXR = function (dt, head) {
      hide();
      const frame = g.scene.frame, xr = g.scene.renderer.xr;
      const session = xr.getSession(), reference = xr.getReferenceSpace();
      const hands = [...(session?.inputSources || [])].filter(s => s.hand && ['left', 'right'].includes(s.handedness));
      if (!hands.length) {
        if (state.active || state.sources.size) reset();
        oldXR(dt, head); return;
      }
      const entered = !state.active;
      state.active = true;
      for (const ray of Object.values(controls.rays)) ray.visible = false;
      g.cancel(); g.arsenal?.loseTracking(); VesperCore.shield(g.game, null);
      g.hands = {}; g.prevButtons = {};
      for (const side of ['left', 'right']) document.getElementById(side + '-hand').object3D.visible = false;
      if (!g.paused) g.setPaused(true);
      if (head.y > .4 && (entered || !g.xrPanel.mesh.visible || g.pendingPanel)) {
        g.placePanel(); g.pendingPanel = false;
      }
      if (!frame || !reference || session.visibilityState && session.visibilityState !== 'visible') {
        for (const sample of state.sources.values()) sample.pinch.reset();
        return;
      }
      for (const source of [...state.sources.keys()]) if (!hands.includes(source)) state.sources.delete(source);
      const samples = [];
      g.rig.updateMatrixWorld(true); g.xrPanel.mesh.updateMatrixWorld(true);
      for (const source of hands) {
        let sample = state.sources.get(source);
        if (!sample) { sample = {pinch: new M.Pinch(), origin: null}; state.sources.set(source, sample); }
        let pose, thumb, index;
        try {
          pose = source.targetRaySpace && frame.getPose(source.targetRaySpace, reference);
          const thumbSpace = source.hand.get('thumb-tip'), indexSpace = source.hand.get('index-finger-tip');
          thumb = thumbSpace && frame.getJointPose?.(thumbSpace, reference);
          index = indexSpace && frame.getJointPose?.(indexSpace, reference);
        } catch { sample.pinch.reset(); continue; }
        const valid = x => x?.transform?.position && [x.transform.position.x, x.transform.position.y, x.transform.position.z].every(Number.isFinite);
        if (!valid(pose) || pose.emulatedPosition || !valid(thumb) || !valid(index)) { sample.pinch.reset(); continue; }
        const orient = pose.transform.orientation;
        if (!orient || ![orient.x, orient.y, orient.z, orient.w].every(Number.isFinite)) { sample.pinch.reset(); continue; }
        const origin = new T.Vector3().copy(pose.transform.position).applyMatrix4(g.rig.matrixWorld);
        const rotation = g.rig.getWorldQuaternion(new T.Quaternion()).multiply(new T.Quaternion().copy(orient));
        const direction = new T.Vector3(0, 0, -1).applyQuaternion(rotation);
        const hit = new T.Raycaster(origin, direction).intersectObject(g.xrPanel.mesh)[0];
        const row = hit?.uv ? M.menuHit(hit.uv.x, hit.uv.y, g.xrMenuRows.length) : -1;
        const end = hit?.point || origin.clone().addScaledVector(direction, 2);
        const line = rays[source.handedness], positions = line.geometry.attributes.position;
        line.visible = true; positions.setXYZ(0, origin.x, origin.y, origin.z); positions.setXYZ(1, end.x, end.y, end.z); positions.needsUpdate = true;
        const dot = dots[source.handedness]; dot.visible = row >= 0; dot.position.copy(end);
        const distance = new T.Vector3().copy(thumb.transform.position).distanceTo(new T.Vector3().copy(index.transform.position));
        const pressed = sample.pinch.update(distance, true);
        if (row >= 0 && (!sample.origin || origin.distanceTo(sample.origin) > .01)) state.activeSide = source.handedness;
        sample.origin = origin.clone(); samples.push({source, row, pressed});
      }
      const activation = samples.find(s => s.pressed && s.row >= 0);
      const hover = activation || samples.find(s => s.row >= 0 && s.source.handedness === state.activeSide);
      if (hover && g.menuSelection !== hover.row) { g.menuSelection = hover.row; g.drawMenu(); }
      if (activation) {
        const label = g.xrMenuRows[activation.row]?.[0] || '';
        // A menu gesture must not resume an expedition that cannot be controlled.
        // Start/trial/reward actions are safe: their resulting play state is paused
        // immediately below until tracked controllers are picked up again.
        if (/^Resume /.test(label)) g.toast('Pick up both tracked controllers to resume combat. Hand tracking operates the menus.');
        else { g.menuAct(activation.row); state.selections++; if (g.xr && !g.paused) g.setPaused(true); }
        for (const sample of state.sources.values()) sample.pinch.reset();
        if (g.xr) g.drawMenu();
      }
    };
    const exit = () => { reset(); g.drawMenu(); };
    g.scene.addEventListener('exit-vr', exit);
    const remove = g.remove.bind(g);
    g.remove = function () {
      g.scene.removeEventListener('exit-vr', exit);
      for (const x of [...Object.values(rays), ...Object.values(dots)]) { x.geometry.dispose(); x.material.dispose(); x.removeFromParent(); }
      remove();
    };
    return {state, reset, rays, dots};
  }
  root.QuestHands = Object.freeze({install});
})(globalThis);
