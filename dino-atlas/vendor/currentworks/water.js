/* Currentworks Water 0.1.0 / original reusable Three.js WebGL2 module.
 * Owns only its mesh, geometries, material and generated data texture.
 * No A-Frame, DOM, renderer, clock, input, networking, storage or gameplay owner.
 * Coordinates and body observations are MESH-LOCAL, before parent/mesh transforms.
 * Research rationale, limits and integration examples: README.md / RESEARCH.md.
 */
(function (root) {
  'use strict';
  const VERSION = '0.1.0';
  const TAU = Math.PI * 2;
  const MAX_WAKES = 12;
  const MAX_BODIES = 8;
  const LIFE = 3.2;
  const finite = Number.isFinite;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const smooth = (lo, hi, v) => {
    const k = clamp((v - lo) / (hi - lo), 0, 1);
    return k * k * (3 - 2 * k);
  };
  const QUALITY = Object.freeze({
    light: Object.freeze({ x: 24, z: 96, events: 4, detail: 0 }),
    balanced: Object.freeze({ x: 48, z: 192, events: 8, detail: 1 }),
    cinematic: Object.freeze({ x: 72, z: 256, events: 12, detail: 2 })
  });
  const PRESETS = Object.freeze({
    river: Object.freeze({ flow: [0, 1.45], amplitude: 1, chop: 0.65, roughness: 0.16,
      absorption: [0.95, 0.23, 0.14], deep: [0.012, 0.125, 0.165], foam: 0.65 }),
    lagoon: Object.freeze({ flow: [0.12, 0.16], amplitude: 0.46, chop: 0.32, roughness: 0.10,
      absorption: [0.66, 0.13, 0.09], deep: [0.018, 0.20, 0.21], foam: 0.34 }),
    storm: Object.freeze({ flow: [0.22, 1.9], amplitude: 1.35, chop: 0.75, roughness: 0.23,
      absorption: [1.1, 0.28, 0.18], deep: [0.015, 0.095, 0.13], foam: 0.92 })
  });
  // Normalized direction, amplitude in metres, wavelength in metres, phase.
  // Keep sum(amplitude * wavenumber * chop) < 1: no overturning geometry.
  for (const p of Object.values(PRESETS)) { Object.freeze(p.flow); Object.freeze(p.absorption); Object.freeze(p.deep); }
  const WAVES = Object.freeze([
    [0.18, 0.983666, 0.060, 3.80, 0.3],
    [-0.57, 0.821645, 0.033, 2.15, 1.7],
    [0.76, 0.649923, 0.017, 1.24, 3.1],
    [-0.89, 0.455961, 0.010, 0.83, 4.4]
  ].map(w => {
    const n = Math.hypot(w[0], w[1]);
    return Object.freeze([w[0] / n, w[1] / n, w[2], w[3], w[4]]);
  }));

  function number(v, fallback, lo, hi) {
    return finite(v) ? clamp(v, lo, hi) : fallback;
  }
  function options(input = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
    const preset = Object.hasOwn(PRESETS, input.preset) ? input.preset : 'river';
    const p = PRESETS[preset];
    const q = Object.hasOwn(QUALITY, input.quality) ? input.quality : 'balanced';
    return {
      preset, quality: q,
      width: number(input.width, 10.5, 1, 256),
      length: number(input.length, 42, 2, 512),
      centerZ: number(input.centerZ, -22, -10000, 10000),
      level: number(input.level, -0.18, -1000, 1000),
      depth: number(input.depth, 2.6, 0.1, 50),
      shoreDepth: number(input.shoreDepth, 0.12, 0.02, 5),
      opacity: number(input.opacity, 1, 0, 1),
      quiet: input.quiet === true,
      flowX: number(input.flowX, p.flow[0], -10, 10),
      flowZ: number(input.flowZ, p.flow[1], -10, 10),
      seed: Number.isSafeInteger(input.seed) ? input.seed >>> 0 : 17041
    };
  }

  /** Pure parametric surface. derivatives use the SAME filtered waves as GLSL. */
  function evaluate(x, z, time, settings, step = 0.22) {
    const p = PRESETS[settings.preset];
    const motion = settings.quiet ? 0 : 1;
    const t = settings.quiet ? 0 : time;
    const dx = [1, 0, 0], dz = [0, 0, 1];
    const pos = [x, settings.level, z];
    for (const w of WAVES) {
      const k = TAU / w[3];
      const a = w[2] * p.amplitude * motion * smooth(2 * step, 4 * step, w[3]);
      const phase = k * (w[0] * (x - settings.flowX * t) + w[1] * (z - settings.flowZ * t))
        - Math.sqrt(9.81 * k) * t * 0.60 + w[4];
      const sn = Math.sin(phase), cs = Math.cos(phase), ak = a * k;
      pos[0] += p.chop * a * w[0] * cs;
      pos[1] += a * sn;
      pos[2] += p.chop * a * w[1] * cs;
      dx[0] -= p.chop * ak * w[0] * w[0] * sn;
      dx[1] += ak * w[0] * cs;
      dx[2] -= p.chop * ak * w[0] * w[1] * sn;
      dz[0] -= p.chop * ak * w[0] * w[1] * sn;
      dz[1] += ak * w[1] * cs;
      dz[2] -= p.chop * ak * w[1] * w[1] * sn;
    }
    const n = [dz[1] * dx[2] - dz[2] * dx[1], dz[2] * dx[0] - dz[0] * dx[2], dz[0] * dx[1] - dz[1] * dx[0]];
    const len = Math.hypot(...n);
    return { position: pos, normal: n.map(v => v / len), dx, dz };
  }

  /** A fixed pool, not an ever-growing trail. Old slots are reused, never appended. */
  class Disturbances {
    constructor() {
      this.items = Array.from({ length: MAX_WAKES }, () => ({ x: 0, z: 0, born: -1e6,
        strength: 0, vx: 0, vz: 0, radius: 0.3, kind: 0 }));
      this.cursor = 0;
      this.emitted = 0;
    }
    add(x, z, time, vx, vz, radius, strength, kind) {
      if (![x, z, time, vx, vz, radius, strength].every(finite) || time < 0 || strength <= 0) return false;
      const item = this.items[this.cursor];
      Object.assign(item, { x, z, born: time, vx: clamp(vx, -10, 10), vz: clamp(vz, -10, 10),
        radius: clamp(radius, 0.12, 2.5), strength: clamp(strength, 0, 1), kind: kind === 1 ? 1 : 0 });
      this.cursor = (this.cursor + 1) % MAX_WAKES;
      this.emitted++;
      return true;
    }
    clear() {
      for (const w of this.items) { w.born = -1e6; w.strength = 0; }
      this.cursor = this.emitted = 0;
    }
    count(time) { return this.items.filter(w => time >= w.born && time - w.born < LIFE).length; }
  }

  /** Generated, seamless data: RG = normal slope; B/A = fine/coarse foam breakup. */
  function noiseData(size = 128, seed = 17041) {
    if (![32, 64, 128, 256].includes(size)) throw new RangeError('Water noise size must be a supported power of two.');
    let state = seed >>> 0;
    const rand = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    const octaves = [4, 8, 16, 32].map(n => ({ n, data: Float32Array.from({ length: n * n }, rand) }));
    function value(o, x, y) {
      const n = o.n, fx = x * n / size, fy = y * n / size;
      const ix = Math.floor(fx), iy = Math.floor(fy), u = smooth(0, 1, fx - ix), v = smooth(0, 1, fy - iy);
      const at = (a, b) => o.data[((b % n + n) % n) * n + ((a % n + n) % n)];
      const a = at(ix, iy) * (1 - u) + at(ix + 1, iy) * u;
      const b = at(ix, iy + 1) * (1 - u) + at(ix + 1, iy + 1) * u;
      return a * (1 - v) + b * v;
    }
    const height = new Float32Array(size * size), coarse = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = y * size + x;
      coarse[i] = value(octaves[0], x, y);
      height[i] = octaves.reduce((s, o, j) => s + value(o, x, y) * [0.48, 0.27, 0.16, 0.09][j], 0);
    }
    const data = new Uint8Array(size * size * 4), at = (x, y) => height[((y + size) % size) * size + (x + size) % size];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = y * size + x, gx = (at(x + 1, y) - at(x - 1, y)) * 10;
      const gz = (at(x, y + 1) - at(x, y - 1)) * 10;
      data[i * 4] = Math.round((clamp(gx, -1, 1) * 0.5 + 0.5) * 255);
      data[i * 4 + 1] = Math.round((clamp(gz, -1, 1) * 0.5 + 0.5) * 255);
      data[i * 4 + 2] = Math.round(clamp((height[i] - 0.25) * 2, 0, 1) * 255);
      data[i * 4 + 3] = Math.round(coarse[i] * 255);
    }
    return data;
  }

  // Shared constant values are generated once to keep the CPU and GLSL coherent.
  const glWaveCalls = WAVES.map(w => `wave(vec2(${w[0].toFixed(9)},${w[1].toFixed(9)}),${w[2].toFixed(4)},${w[3].toFixed(4)},${w[4].toFixed(4)},position.xz,p,dx,dz);`).join('\n');
  const vertexShader = `
    uniform float time, level, motion, amplitude, chop, meshStep;
    uniform vec2 current;
    attribute float bedHeight;
    varying vec3 vLocal, vEye, vTx, vTz;
    varying float vDepth, vCompression;
    void wave(vec2 d,float height,float lambda,float offset,vec2 x,inout vec3 p,inout vec3 dx,inout vec3 dz){
      float k=6.28318530718/lambda;
      float a=height*amplitude*motion*smoothstep(meshStep*2.,meshStep*4.,lambda);
      float f=k*dot(d,x-current*time)-sqrt(9.81*k)*time*.60+offset;
      float sn=sin(f),cs=cos(f),ak=a*k;
      p+=vec3(chop*a*d.x*cs,a*sn,chop*a*d.y*cs);
      dx+=vec3(-chop*ak*d.x*d.x*sn,ak*d.x*cs,-chop*ak*d.x*d.y*sn);
      dz+=vec3(-chop*ak*d.x*d.y*sn,ak*d.y*cs,-chop*ak*d.y*d.y*sn);
    }
    void main(){
      vec3 p=vec3(position.x,level,position.z),dx=vec3(1.,0.,0.),dz=vec3(0.,0.,1.);
      ${glWaveCalls}
      vLocal=p;vDepth=max(.015,p.y-bedHeight);
      vCompression=clamp(1.-(dx.x*dz.z-dx.z*dz.x),0.,1.);
      vec4 view=modelViewMatrix*vec4(p,1.);
      vEye=-view.xyz;vTx=mat3(modelViewMatrix)*dx;vTz=mat3(modelViewMatrix)*dz;
      gl_Position=projectionMatrix*view;
    }`;
  const fragmentShader = `
    uniform sampler2D waterNoise;
    uniform float time,opacity,motion,detail,roughness,foamStrength,halfWidth,centerZ,halfLength;
    uniform int eventLimit;
    uniform vec2 current;
    uniform vec3 absorption,deepColor,sunDirection;
    uniform vec4 disturbances[12],trails[12];
    varying vec3 vLocal,vEye,vTx,vTz;
    varying float vDepth,vCompression;
    const float PI=3.14159265359;
    float aaStep(float edge,float v){float a=max(fwidth(v),.007);return smoothstep(edge-a,edge+a,v);}
    float caustic(vec2 p){
      p+=vec2(sin(p.y*1.71+time*.52),cos(p.x*1.42-time*.46))*.27;
      float a=sin(p.x*3.7+time*.61)+sin(p.y*4.1-time*.43)+cos((p.x+p.y)*2.2+time*.3);
      return pow(max(0.,1.-abs(a)*.48),7.);
    }
    vec3 sky(vec3 ray){
      float h=clamp(ray.y,0.,1.);
      vec3 c=mix(vec3(.28,.37,.45),vec3(.065,.15,.255),pow(h,.55));
      vec2 uv=ray.xz/max(.18,ray.y+.28);
      float cloud=texture2D(waterNoise,uv*.11+vec2(.17,.21)).a;
      cloud=smoothstep(.47,.70,cloud)*smoothstep(.01,.23,h);
      return mix(c,vec3(.70,.74,.76),cloud*.60);
    }
    void main(){
      if(opacity<.002)discard;
      vec2 q=vLocal.xz-current*time;
      vec4 n0=texture2D(waterNoise,q*.19);
      vec4 n1=texture2D(waterNoise,vec2(-q.y,q.x)*.37+vec2(time*.017,-time*.011));
      vec2 slope=(n0.rg*2.-1.)*.32+(n1.rg*2.-1.)*.20;
      if(detail>1.5){vec4 n2=texture2D(waterNoise,q*.81+vec2(-time*.019,0.));slope+=(n2.rg*2.-1.)*.09;}
      slope*=mix(.55,1.,motion);
      float wake=0.,splash=0.;
      for(int i=0;i<12;i++){
        if(i>=eventLimit)break;
        vec4 e=disturbances[i],tr=trails[i];float age=time-e.z;
        if(age<0.||age>3.2||e.w<=0.||motion<.5)continue;
        vec2 p=vLocal.xz-e.xy-current*age*.55;
        float fade=pow(max(0.,1.-age/3.2),2.)*smoothstep(0.,.06,age);
        if(tr.w>.5){
          float radius=tr.z+age*1.35,l=length(p),band=exp(-abs(l-radius)/( .09+age*.07));
          splash+=band*fade*e.w;
          slope+=p/max(.08,l)*cos((l-radius)*14.)*band*fade*.18;
        }else{
          float speed=length(tr.xy);vec2 d=tr.xy/max(.01,speed),perp=vec2(-d.y,d.x);
          float along=dot(p,-d),across=dot(p,perp);
          float width=tr.z+max(0.,along)*.31;
          float arms=exp(-abs(abs(across)-width)/(.11+max(0.,along)*.055));
          float center=exp(-across*across/(width*width+.02))*.26;
          float tail=smoothstep(-tr.z,.15,along)*(1.-smoothstep(1.,3.8,along));
          wake+=(arms+center)*tail*fade*e.w;
          slope+=perp*sin(across*10.+along*2.-age*3.)*arms*tail*fade*.035;
        }
      }
      vec3 tx=normalize(vTx),tz=normalize(vTz),normal=normalize(cross(vTz,vTx));
      normal=normalize(normal-slope.x*tx-slope.y*tz);
      if(!gl_FrontFacing)normal=-normal;
      vec3 eye=normalize(vEye);
      float nv=max(.015,abs(dot(normal,eye)));
      vec3 reflection=reflect(-eye,normal)*mat3(viewMatrix);
      float fresnel=.0204+.9796*pow(1.-nv,5.);
      // Known-bed optical shading, NOT a sample of the scene colour/depth buffer.
      float path=min(14.,vDepth/max(.22,nv));
      vec3 transmittance=exp(-absorption*path);
      vec3 bentRay=refract(-eye,normal,.752);
      vec2 bedDirection=vec2(dot(bentRay,tx),dot(bentRay,tz));
      vec2 bedUV=vLocal.xz+bedDirection*min(8.,vDepth/max(.25,abs(dot(bentRay,normal))))+slope*vDepth*.12;
      float sand=texture2D(waterNoise,bedUV*.48).b;
      vec3 bed=mix(vec3(.17,.20,.13),vec3(.37,.36,.21),sand);
      if(detail>.5)bed+=vec3(.15,.23,.12)*caustic(bedUV)*exp(-vDepth*.65);
      vec3 color=mix(deepColor,bed,transmittance);
      color=mix(color,sky(reflection),min(.92,fresnel));
      vec3 light=normalize(mat3(viewMatrix)*sunDirection),halfway=normalize(light+eye);
      float nl=max(0.,dot(normal,light)),nh=max(0.,dot(normal,halfway));
      float r=clamp(roughness+length(fwidth(normal))*.50,.09,.55),a=r*r,a2=a*a;
      float denom=nh*nh*(a2-1.)+1.;
      float distribution=a2/(PI*denom*denom+.0001);
      float k=(r+1.)*(r+1.)*.125;
      float visibility=(nv/(nv*(1.-k)+k))*(nl/(nl*(1.-k)+k));
      vec3 spec=vec3(1.,.86,.65)*distribution*visibility*.028/max(.15,4.*nv*nl);
      color+=min(vec3(.95),spec)*nl;
      color+=vec3(.035,.12,.09)*pow(max(0.,dot(eye,-light)),3.)*(1.-nv)*vCompression;
      float breakup=n0.b*.6+n1.b*.4;
      float crest=smoothstep(.065,.22,vCompression)*aaStep(.50,breakup);
      float sideDistance=max(0.,halfWidth-abs(vLocal.x));
      float edgeWave=.30+.16*sin(vLocal.z*1.9-time*1.3)+.16*n1.a;
      float shore=(1.-smoothstep(edgeWave,edgeWave+.4,sideDistance))*aaStep(.36,breakup);
      float shallows=(1.-smoothstep(.06,.35,vDepth))*aaStep(.39,breakup);
      float foam=clamp((crest*.55+shore*.6+shallows*.35+wake+splash)*foamStrength,0.,.86);
      foam*=.45+.55*aaStep(.31,breakup);
      color=mix(color,vec3(.70,.83,.78),foam);
      float rim=smoothstep(0.,.13,sideDistance);
      float ends=smoothstep(0.,.35,halfLength-abs(vLocal.z-centerZ));
      float haze=1.-exp(-length(vEye)*.016);color=mix(color,vec3(.13,.22,.275),haze*.45);
      float alpha=opacity*rim*ends*clamp(.57+.33*(1.-exp(-vDepth))+.10*fresnel+foam*.15,0.,1.);
      gl_FragColor=vec4(color,alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;

  /**
   * Create an independently owned water surface. Supply your EXISTING THREE object.
   * update() accepts host-clock seconds, optional tide, opacity, quiet and read-only
   * body observations {id,x,z,radius}. Does not advance or change any game state.
   */
  function create(THREE, input = {}) {
    const T = THREE;
    if (!T?.Mesh || !T?.ShaderMaterial || !T?.DataTexture) throw new TypeError('Pass an existing compatible THREE namespace.');
    if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
    const cfg = options(input), baseBedLevel = cfg.level, pool = new Disturbances(), tracking = new Map(), geometries = new Map();
    const p = PRESETS[cfg.preset];
    let disposed = false, currentTime = 0, initialized = false, receivedBodies = 0, resets = 0;
    let quality = cfg.quality, quiet = cfg.quiet, visible = true, immersive = false;
    const waterNoise = new T.DataTexture(noiseData(128, cfg.seed), 128, 128, T.RGBAFormat, T.UnsignedByteType);
    waterNoise.name = 'Currentworks / generated periodic water data';
    waterNoise.wrapS = waterNoise.wrapT = T.RepeatWrapping;
    waterNoise.magFilter = T.LinearFilter;
    waterNoise.minFilter = T.LinearMipmapLinearFilter;
    waterNoise.generateMipmaps = true;
    waterNoise.colorSpace = T.NoColorSpace;
    waterNoise.needsUpdate = true;
    const uniforms = {
      time: { value: 0 }, level: { value: cfg.level }, motion: { value: quiet ? 0 : 1 },
      opacity: { value: cfg.opacity }, amplitude: { value: p.amplitude }, chop: { value: p.chop },
      current: { value: new T.Vector2(cfg.flowX, cfg.flowZ) }, meshStep: { value: 0 },
      detail: { value: QUALITY[quality].detail }, eventLimit: { value: QUALITY[quality].events },
      roughness: { value: p.roughness }, foamStrength: { value: p.foam },
      absorption: { value: new T.Vector3(...p.absorption) }, deepColor: { value: new T.Vector3(...p.deep) },
      sunDirection: { value: new T.Vector3(-0.39, 0.78, 0.48).normalize() },
      halfWidth: { value: cfg.width / 2 }, centerZ: { value: cfg.centerZ }, halfLength: { value: cfg.length / 2 },
      waterNoise: { value: waterNoise },
      disturbances: { value: Array.from({ length: MAX_WAKES }, () => new T.Vector4(0, 0, -1e6, 0)) },
      trails: { value: Array.from({ length: MAX_WAKES }, () => new T.Vector4(0, 0, 0.3, 0)) }
    };
    const material = new T.ShaderMaterial({ name: 'Currentworks Water ' + VERSION, uniforms,
      vertexShader, fragmentShader, transparent: true, depthWrite: false, depthTest: true,
      side: T.DoubleSide, forceSinglePass: true, toneMapped: true });
    function geometry(q) {
      if (geometries.has(q)) return geometries.get(q);
      const lod = QUALITY[q];
      const g = new T.PlaneGeometry(cfg.width, cfg.length, lod.x, lod.z);
      g.rotateX(-Math.PI / 2); g.translate(0, 0, cfg.centerZ);
      const coords = g.attributes.position, beds = new Float32Array(coords.count);
      for (let i = 0; i < beds.length; i++) {
        const x = coords.getX(i), z = coords.getZ(i);
        const depth = cfg.depth + (cfg.shoreDepth - cfg.depth) * smooth(cfg.width * 0.27, cfg.width * 0.50, Math.abs(x));
        const b = typeof input.bedHeight === 'function' ? input.bedHeight(x, z) : baseBedLevel - depth;
        if (!finite(b)) { g.dispose(); throw new TypeError('bedHeight must return finite local-space heights.'); }
        beds[i] = b;
      }
      g.setAttribute('bedHeight', new T.BufferAttribute(beds, 1));
      // CPU geometry has y=0; bounds must contain all shader-displaced tide/waves.
      g.boundingBox = new T.Box3(new T.Vector3(-cfg.width / 2 - 0.2, -1001, cfg.centerZ - cfg.length / 2 - 0.2),
        new T.Vector3(cfg.width / 2 + 0.2, 1001, cfg.centerZ + cfg.length / 2 + 0.2));
      g.computeBoundingSphere();
      geometries.set(q, g);
      return g;
    }
    let mesh;
    try { mesh = new T.Mesh(geometry(quality), material); }
    catch (e) { waterNoise.dispose(); material.dispose(); throw e; }
    mesh.name = 'Currentworks Water / local-space surface';
    // Bound is host-tide dependent and may be transformed/recentered in XR.
    mesh.frustumCulled = false;
    mesh.renderOrder = 0;
    const stepFor = q => Math.max(cfg.width / QUALITY[q].x, cfg.length / QUALITY[q].z);
    uniforms.meshStep.value = stepFor(quality);

    function reset(time = 0) {
      if (disposed) return;
      pool.clear(); tracking.clear(); initialized = false; receivedBodies = 0; resets++;
      currentTime = number(time, 0, 0, 1e7);
      uniforms.time.value = quiet ? 0 : currentTime;
      copyEvents();
    }
    function copyEvents() {
      // Newest observations first so Light retains recent effects, not arbitrary slots.
      for (let j = 0; j < MAX_WAKES; j++) {
        const w = pool.items[(pool.cursor - 1 - j + MAX_WAKES * 2) % MAX_WAKES];
        uniforms.disturbances.value[j].set(w.x, w.z, w.born, w.strength);
        uniforms.trails.value[j].set(w.vx, w.vz, w.radius, w.kind);
      }
    }
    function setQuality(q, xr = false) {
      if (disposed) return;
      if (!Object.hasOwn(QUALITY, q)) q = 'balanced';
      // Do not take an unmeasured maximum-quality mesh into a stereo session.
      if (xr && q === 'cinematic') q = 'balanced';
      if (q !== quality) { mesh.geometry = geometry(q); quality = q; }
      uniforms.meshStep.value = stepFor(q);
      uniforms.detail.value = QUALITY[q].detail;
      uniforms.eventLimit.value = QUALITY[q].events;
    }
    function bodiesAt(bodies, time) {
      const seen = new Set(); let births = 0;
      for (const body of Array.isArray(bodies) ? bodies : []) {
        if (seen.size >= MAX_BODIES) break;
        if (!body || (typeof body.id !== 'string' && !Number.isSafeInteger(body.id)) ||
            ![body.x, body.z].every(finite) || seen.has(body.id)) continue;
        seen.add(body.id);
        let old = tracking.get(body.id);
        if (!old) {
          tracking.set(body.id, { x: body.x, z: body.z, time, emitted: time });
          continue; // A spawn/recenter is not a travelled wake segment.
        }
        const dt = time - old.time, distance = Math.hypot(body.x - old.x, body.z - old.z);
        if (dt <= 0) continue;
        if (dt > 0.35 || distance > 3) { Object.assign(old, { x: body.x, z: body.z, time, emitted: time }); continue; }
        const vx = (body.x - old.x) / dt - cfg.flowX, vz = (body.z - old.z) / dt - cfg.flowZ;
        const speed = Math.hypot(vx, vz);
        if (time - old.emitted >= 0.18 && speed > 0.12 && births < 3) {
          pool.add(body.x, body.z, time, vx, vz, number(body.radius, 0.38, 0.12, 2.5), Math.min(1, speed * 0.42), 0);
          old.emitted = time; births++;
        }
        Object.assign(old, { x: body.x, z: body.z, time });
      }
      for (const id of tracking.keys()) if (!seen.has(id)) tracking.delete(id);
      receivedBodies = seen.size;
    }
    function update(frame = {}) {
      if (disposed) return false;
      if (!frame || typeof frame !== 'object' || Array.isArray(frame)) return false;
      const t = number(frame.time, currentTime, 0, 1e7);
      const nextQuiet = typeof frame.quiet === 'boolean' ? frame.quiet : quiet;
      const nextVisible = typeof frame.visible === 'boolean' ? frame.visible : visible;
      const nextXR = typeof frame.xr === 'boolean' ? frame.xr : immersive;
      if ((initialized && (t < currentTime || t - currentTime > 1)) || nextQuiet !== quiet || nextVisible !== visible || nextXR !== immersive) {
        pool.clear(); tracking.clear();
      }
      quiet = nextQuiet; visible = nextVisible; immersive = nextXR; cfg.quiet = quiet; mesh.visible = visible;
      currentTime = t; initialized = true;
      cfg.level = number(frame.level, cfg.level, -1000, 1000);
      cfg.opacity = number(frame.opacity, cfg.opacity, 0, 1);
      uniforms.time.value = quiet ? 0 : t;
      uniforms.level.value = cfg.level; uniforms.opacity.value = cfg.opacity;
      uniforms.motion.value = quiet ? 0 : 1;
      setQuality(frame.quality || quality, immersive);
      if (!quiet && visible) bodiesAt(frame.bodies, t);
      else { tracking.clear(); receivedBodies = 0; }
      copyEvents();
      return true;
    }
    function splash(x, z, strength = 0.6, radius = 0.22) {
      if (disposed || quiet || !visible) return false;
      const emitted = pool.add(x, z, currentTime, 0, 0, radius, strength, 1);
      copyEvents();
      return emitted;
    }
    function sample(x, z) {
      if (disposed || ![x, z].every(finite)) return null;
      // Invert the horizontal Gerstner displacement; a vertical-only lookup is wrong.
      let px = x, pz = z;
      for (let i = 0; i < 5; i++) {
        const a = evaluate(px, pz, currentTime, cfg, uniforms.meshStep.value);
        const rx = a.position[0] - x, rz = a.position[2] - z;
        const det = a.dx[0] * a.dz[2] - a.dz[0] * a.dx[2];
        if (Math.abs(det) < 0.1) break;
        px -= (rx * a.dz[2] - rz * a.dz[0]) / det;
        pz -= (rz * a.dx[0] - rx * a.dx[2]) / det;
      }
      const a = evaluate(px, pz, currentTime, cfg, uniforms.meshStep.value);
      return { height: a.position[1], normal: a.normal, x: a.position[0], z: a.position[2] };
    }
    function dispose() {
      if (disposed) return;
      disposed = true; mesh.removeFromParent(); tracking.clear(); pool.clear();
      for (const g of geometries.values()) g.dispose(); geometries.clear();
      waterNoise.dispose(); material.dispose();
    }
    return Object.freeze({ mesh, material, uniforms, update, splash, reset, sample, setQuality, dispose,
      get stats() { return { module: 'Currentworks Water', version: VERSION, quality, quiet, visible, xr: immersive,
        time: currentTime, opacity: cfg.opacity, level: cfg.level, bodies: receivedBodies,
        liveDisturbances: quiet ? 0 : pool.count(currentTime), emitted: pool.emitted,
        effectCapacity: MAX_WAKES, bodyCapacity: MAX_BODIES, geometries: geometries.size,
        vertices: disposed ? 0 : mesh.geometry.attributes.position.count,
        triangles: disposed ? 0 : mesh.geometry.index.count / 3,
        renderTargets: 0, textures: disposed ? 0 : 1, disposed, resets }; }
    });
  }
  const api = Object.freeze({ VERSION, QUALITY, PRESETS, WAVES, MAX_WAKES, MAX_BODIES, LIFE,
    options, evaluate, Disturbances, noiseData, create, shaders: Object.freeze({ vertexShader, fragmentShader }) });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SVGNWater = api;
})(globalThis);
