export function holsterZone(relative){
 if(!Array.isArray(relative)||relative.length!==3||relative.some(v=>!Number.isFinite(v)))return null;const [x,y,z]=relative;
 if(y>-.38&&y<.08&&z<-.04&&z>-.38&&Math.abs(x)<.34)return 'grapple';
 if(y>-.55&&y<-.12&&z<.05&&z>-.42&&Math.abs(x)>.5&&Math.abs(x)<.85)return 'smoke';
 if(y>-.3&&y<.18&&z<-.02&&z>-.48&&Math.abs(x)>.28&&Math.abs(x)<.62)return 'pulse';
 return null;
}
export function capeGesture(hands,grips){
 if(!Array.isArray(hands)||hands.length<2||!grips?.every(Boolean))return false;const [a,b]=hands;if(!a||!b||a.some(v=>!Number.isFinite(v))||b.some(v=>!Number.isFinite(v)))return false;
 const spread=Math.abs(a[0]-b[0]),low=a[1]<-.28&&b[1]<-.28,forward=a[2]<.08&&b[2]<.08;return spread>.62&&low&&forward;
}
