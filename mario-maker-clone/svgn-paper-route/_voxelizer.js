/* =========================================================================
   VOXELIZER — turns the game's own 2D art into REAL 3D geometry.
   Every tile and entity is drawn by a function we can run into an offscreen
   canvas. Read those pixels, extrude each opaque pixel into a cube, merge
   greedily along X, and emit one BufferGeometry per asset. The art stays
   exactly the art Micah drew - it just becomes solid.
   ========================================================================= */
/* Extract the VOXEL SPAN DESCRIPTION of a sprite: for each row, the horizontal runs
   of same-coloured solid pixels. This is the real source data - a few hundred
   numbers per asset instead of hundreds of triangles - so it is what gets
   baked to disk. Geometry is rebuilt from it at load. */
export function extractSpans(drawFn, opts){
  const o = opts || {};
  const SRC = o.src || 36, ALPHA = o.alpha || 40;
  const cv = document.createElement('canvas');
  cv.width = cv.height = SRC;
  const g = cv.getContext('2d', {willReadFrequently:true});
  try { drawFn(g, SRC); } catch(e){ return null; }
  const px = g.getImageData(0,0,SRC,SRC).data;
  const solid = (x,y)=> x>=0 && y>=0 && x<SRC && y<SRC && px[(y*SRC+x)*4+3] > ALPHA;
  const spans = [];
  for(let y=0;y<SRC;y++){
    let x=0;
    while(x<SRC){
      if(!solid(x,y)){ x++; continue; }
      const i0=(y*SRC+x)*4, r0=px[i0], g0=px[i0+1], b0=px[i0+2];
      let run=1;
      while(x+run<SRC && solid(x+run,y)){
        const i=((y*SRC+x+run)*4);
        if(Math.abs(px[i]-r0)+Math.abs(px[i+1]-g0)+Math.abs(px[i+2]-b0) > 26) break;
        run++;
      }
      /* neighbour flags decide which side faces are needed, and they cannot be
         recomputed later without the pixels - so record them now */
      let capTop=false, capBot=false;
      for(let k=0;k<run;k++){ if(!solid(x+k,y-1)) capTop=true; if(!solid(x+k,y+1)) capBot=true; }
      spans.push([x, y, run, r0, g0, b0,
                 (solid(x-1,y)?0:1) | (solid(x+run,y)?0:2) | (capTop?4:0) | (capBot?8:0)]);
      x += run;
    }
  }
  return {src:SRC, spans};
}

export function voxelizeSprite(THREE, drawFn, opts){
  const o = opts || {};
  const SRC   = o.src   || 36;    /* source pixels sampled per side */
  const VOX   = o.vox   || 1;     /* world units per voxel */
  const DEPTH = o.depth || 6;     /* extrusion depth in voxels */
  const ALPHA = o.alpha || 40;

  const cv = document.createElement('canvas');
  cv.width = cv.height = SRC;
  const g = cv.getContext('2d', {willReadFrequently:true});
  try { drawFn(g, SRC); } catch(e){ return null; }
  const px = g.getImageData(0,0,SRC,SRC).data;

  const solid = (x,y)=> x>=0 && y>=0 && x<SRC && y<SRC && px[(y*SRC+x)*4+3] > ALPHA;

  const pos = [], nor = [], col = [];
  const hd = DEPTH*VOX/2;
  let quads = 0;

  /* a face is only emitted where the neighbour is empty: interior faces of a
     solid block are never seen, and shipping them would multiply the count */
  function face(x0,y0,x1,y1,z0,z1, nx,ny,nz, r,gg,b){
    const v = [];
    if(nz !== 0){                       /* front / back: flat in XY */
      v.push([x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y0,z0],[x1,y1,z0],[x0,y1,z0]);
    } else if(nx !== 0){                /* left / right: flat in YZ */
      v.push([x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z0],[x0,y1,z1],[x0,y0,z1]);
    } else {                            /* top / bottom: flat in XZ */
      v.push([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z0],[x1,y0,z1],[x0,y0,z1]);
    }
    if(nx > 0 || ny > 0 || nz < 0) v.reverse();   /* keep winding consistent */
    const sh = shadeFor(nx,ny,nz);
    for(const p of v){
      pos.push(p[0],p[1],p[2]); nor.push(nx,ny,nz);
      col.push(r*sh, gg*sh, b*sh);
    }
    quads++;
  }

  const srgb = c=>{ c/=255; return c<=0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
  /* Micah's sprites are ALREADY lit by hand. Relighting them under a PBR rig
     halved their brightness and made matching the original a units-guessing
     game. So bake the directional shading straight into the vertex colours and
     render unlit: the front face is the artwork EXACTLY as drawn, and the
     other faces are shaded relative to it purely to read as solid. */
  const FACE_SHADE = {front:1.0, top:1.06, left:0.80, right:0.86, bottom:0.62, back:0.70};
  const shadeFor = (nx,ny,nz)=> nz>0 ? FACE_SHADE.front : nz<0 ? FACE_SHADE.back
                              : ny>0 ? FACE_SHADE.top   : ny<0 ? FACE_SHADE.bottom
                              : nx<0 ? FACE_SHADE.left  : FACE_SHADE.right;

  for(let y=0;y<SRC;y++){
    let x = 0;
    while(x < SRC){
      if(!solid(x,y)){ x++; continue; }
      /* greedy run along X sharing a colour bucket: far fewer faces than
         one cube per pixel, with identical silhouette */
      const i0 = (y*SRC+x)*4;
      const r0 = px[i0], g0 = px[i0+1], b0 = px[i0+2];
      let run = 1;
      while(x+run < SRC && solid(x+run,y)){
        const i = ((y*SRC+x+run)*4);
        if(Math.abs(px[i]-r0)+Math.abs(px[i+1]-g0)+Math.abs(px[i+2]-b0) > 26) break;
        run++;
      }
      const wx0 = (x - SRC/2)*VOX,  wx1 = (x + run - SRC/2)*VOX;
      const wy0 = (SRC/2 - y - 1)*VOX, wy1 = (SRC/2 - y)*VOX;   /* canvas y is down */
      const r = srgb(r0), gg = srgb(g0), b = srgb(b0);

      face(wx0,wy0,wx1,wy1,  hd,  hd, 0,0, 1, r,gg,b);   /* front */
      face(wx0,wy0,wx1,wy1, -hd, -hd, 0,0,-1, r,gg,b);   /* back  */
      /* sides only where the neighbour pixel is empty */
      if(!solid(x-1,y))       face(wx0,wy0,wx0,wy1,-hd,hd,-1,0,0, r,gg,b);
      if(!solid(x+run,y))     face(wx1,wy0,wx1,wy1,-hd,hd, 1,0,0, r,gg,b);
      let capTop = false, capBot = false;
      for(let k=0;k<run;k++){
        if(!solid(x+k,y-1)) capTop = true;
        if(!solid(x+k,y+1)) capBot = true;
      }
      if(capTop) face(wx0,wy1,wx1,wy1,-hd,hd, 0, 1,0, r,gg,b);
      if(capBot) face(wx0,wy0,wx1,wy0,-hd,hd, 0,-1,0, r,gg,b);
      x += run;
    }
  }

  if(!pos.length) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(nor,3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(col,3));
  geo.computeBoundingSphere();
  geo.userData.faces = quads;
  geo.userData.tris  = pos.length/9;
  return geo;
}

/* Rebuild geometry from baked voxel spans. Same faces the live voxelizer emits, so a
   loaded asset is identical to a freshly baked one - but with NO dependency on
   the 2D draw code, which is the whole point of shipping the bake. */
export function geometryFromSpans(THREE, packed, opts){
  const o = opts || {};
  const SRC = packed.src, spans = packed.spans;
  const VOX = o.vox || 1, DEPTH = o.depth || 6;
  const pos=[], nor=[], col=[];
  const hd = DEPTH*VOX/2;
  const FACE_SHADE = {front:1.0, top:1.06, left:0.80, right:0.86, bottom:0.62, back:0.70};
  const shadeFor = (nx,ny,nz)=> nz>0 ? FACE_SHADE.front : nz<0 ? FACE_SHADE.back
                              : ny>0 ? FACE_SHADE.top   : ny<0 ? FACE_SHADE.bottom
                              : nx<0 ? FACE_SHADE.left  : FACE_SHADE.right;
  const srgb = c=>{ c/=255; return c<=0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
  const face=(x0,y0,x1,y1,z0,z1,nx,ny,nz,r,gg,b)=>{
    const v=[];
    if(nz!==0) v.push([x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y0,z0],[x1,y1,z0],[x0,y1,z0]);
    else if(nx!==0) v.push([x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z0],[x0,y1,z1],[x0,y0,z1]);
    else v.push([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z0],[x1,y0,z1],[x0,y0,z1]);
    if(nx>0||ny>0||nz<0) v.reverse();
    const sh=shadeFor(nx,ny,nz);
    for(const p of v){ pos.push(p[0],p[1],p[2]); nor.push(nx,ny,nz);
                       col.push(r*sh, gg*sh, b*sh); }
  };
  for(const [x,y,run,r0,g0,b0,flags] of spans){
    const wx0=(x-SRC/2)*VOX, wx1=(x+run-SRC/2)*VOX;
    const wy0=(SRC/2-y-1)*VOX, wy1=(SRC/2-y)*VOX;
    const r=srgb(r0), gg=srgb(g0), b=srgb(b0);
    face(wx0,wy0,wx1,wy1, hd, hd, 0,0,1, r,gg,b);
    face(wx0,wy0,wx1,wy1,-hd,-hd, 0,0,-1, r,gg,b);
    if(flags & 1) face(wx0,wy0,wx0,wy1,-hd,hd,-1,0,0, r,gg,b);
    if(flags & 2) face(wx1,wy0,wx1,wy1,-hd,hd, 1,0,0, r,gg,b);
    if(flags & 4) face(wx0,wy1,wx1,wy1,-hd,hd, 0,1,0, r,gg,b);
    if(flags & 8) face(wx0,wy0,wx1,wy0,-hd,hd, 0,-1,0, r,gg,b);
  }
  if(!pos.length) return null;
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  geo.computeBoundingSphere();
  geo.userData.tris = pos.length/9;
  return geo;
}
