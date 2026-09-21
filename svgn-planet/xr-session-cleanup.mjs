/* End-of-session presentation cleanup. It neither disposes reusable meshes
 * nor changes saved gameplay. Re-entry begins with no stale tracked visuals. */
export function hideTrackedSources(slots){
 for(const slot of slots){
  slot.ray.visible=false;slot.grip.visible=false;
  for(const joint of slot.joints)joint.visible=false;
  slot.source=null;slot.pinch=false;
 }
}
