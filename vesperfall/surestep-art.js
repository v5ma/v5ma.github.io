/* Art-only articulation. Attack timing, facing, hit volumes and saves stay in
 * the existing simulation. Shared primitive geometries are reused, not cloned. */
(function (root) {
  'use strict';
  const previous = VesperArt.create;
  VesperArt.create = function (T, scene) {
    const kit = previous(T, scene), enemy = kit.enemy;
    kit.enemy = function (kind) {
      const model = enemy(kind), parts = model.userData.dominion;
      if (!parts) return model; // Keep the original spectral/non-humanoid trio.
      const rig = {gait: new VesperSurestep.Gait(), legs: [], elbows: [], pose: null};
      const robe = ['hexer', 'alchemist', 'abbess', 'leech', 'mirror', 'widow'].includes(kind);
      for (const side of ['left', 'right']) {
        const leg = parts[side + 'Leg'];
        leg.clear(); leg.position.set(0, 0, 0); leg.rotation.set(0, 0, 0);
        const color = robe ? '#222c39' : '#adb6b9';
        rig.legs.push({group: leg,
          thigh: kit.mesh('cylinder', color, leg),
          shin: kit.mesh('cylinder', color, leg),
          foot: kit.mesh('box', '#222c39', leg, 0, 0, 0, .18, .16, .29)});
        const arm = parts[side + 'Arm'], held = arm.children.slice(2);
        // Retain all weapons, daggers, lanterns and attack-specific attachments.
        arm.clear(); arm.position.y = .34;
        kit.mesh('cylinder', robe ? VesperBestiary.catalog[kind].color : '#adb6b9', arm,
          0, -.15, 0, .079, .30, .09);
        const elbow = new T.Group(); elbow.position.set(0, -.30, 0); arm.add(elbow);
        kit.mesh('cylinder', color, elbow, 0, -.135, 0, .065, .27, .075);
        kit.mesh('ball', '#c8c1af', elbow, 0, -.29, .01, .06, .075, .052);
        for (const object of held) {
          object.position.x -= .065;
          object.position.y += .15;
          object.position.z -= .04;
          elbow.add(object);
        }
        rig.elbows.push(elbow);
      }
      model.userData.surestep = rig;
      return model;
    };
    return kit;
  };
  function install(g) {
    const T = g.T, previousVisuals = g.visuals.bind(g);
    const up = new T.Vector3(0, 1, 0), a = new T.Vector3(), b = new T.Vector3(), direction = new T.Vector3();
    function segment(mesh, start, end, rx, rz) {
      a.fromArray(start); b.fromArray(end); direction.subVectors(b, a);
      mesh.position.copy(a).add(b).multiplyScalar(.5);
      const length = direction.length();
      mesh.quaternion.setFromUnitVectors(up, direction.multiplyScalar(1 / Math.max(1e-8, length)));
      mesh.scale.set(rx, length, rz);
    }
    g.visuals = function (...args) {
      previousVisuals(...args);
      const s = g.game;
      for (let i = 0; i < g.enemyMeshes.length; i++) {
        const model = g.enemyMeshes[i], e = s.world.enemies[i], rig = model.userData.surestep;
        if (!rig || !e || !model.visible) continue;
        const parts = model.userData.dominion;
        const pose = rig.gait.update(e.p, model.rotation.y, s.time,
          p => CloisterLayout.floorAt(s.world, p, 0, .45, .6), e.frozen > 0);
        if (!pose) continue;
        rig.pose = pose;
        model.updateMatrixWorld(true);
        function local(point) { return model.worldToLocal(a.fromArray(point)).toArray(); }
        for (let j = 0; j < 2; j++) {
          const leg = pose.legs[j], meshes = rig.legs[j];
          meshes.group.rotation.set(0, 0, 0);
          const hip = local(leg.hip), knee = local(leg.knee), ankle = local(leg.ankle);
          segment(meshes.thigh, hip, knee, .098, .108);
          segment(meshes.shin, knee, ankle, .075, .083);
          meshes.foot.position.set(ankle[0], ankle[1] - .025, ankle[2] + .045);
          // Level the sole against the actual slope under this foot.
          const forward = [Math.sin(model.rotation.y), 0, Math.cos(model.rotation.y)];
          const probe = sign => CloisterLayout.floorAt(s.world,
            [leg.ankle[0] + forward[0] * sign * .10, leg.ankle[1] - .105,
             leg.ankle[2] + forward[2] * sign * .10], 0, .45, .6);
          const front = probe(1), rear = probe(-1);
          meshes.foot.rotation.x = front !== null && rear !== null ? Math.max(-.48, Math.min(.48, -Math.atan2(front - rear, .20))) : 0;
        }
        const wind = e.wind > 0, strike = e.combo > 0;
        // Travel, rather than an AI state name, drives locomotion. Ranged foes
        // that have stopped to aim no longer march on the spot.
        const swing = Math.sin(pose.distance * 8) * Math.min(.33, pose.speed * .25);
        if (!wind && !strike && !(e.frozen > 0)) {
          parts.leftArm.rotation.x = -swing;
          parts.rightArm.rotation.x = swing;
        }
        if (!(e.frozen > 0)) for (const elbow of rig.elbows) elbow.rotation.x = wind ? -.48 : strike ? -.30 : -.14;
      }
    };
    return {version: 1, scope: 'presentation-only', model: VesperSurestep};
  }
  root.SurestepArt = Object.freeze({install});
})(globalThis);
