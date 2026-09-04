// Original vector illustrations. Stylized silhouettes, not specimen tracings.
export function dinosaurArt(d, fossil=false) {
  const fill = fossil ? '#e8d9b2' : d.color;
  const dark = fossil ? '#c9b789' : '#365a47';
  const head = d.type==='rex'||d.type==='runner'||d.type==='early';
  let body='', extras='', eye=[598,186];
  if (d.type==='longneck') {
    body='M75 238 Q165 187 278 184 Q334 149 415 177 Q453 185 483 132 L580 67 Q602 51 634 63 L650 82 Q637 101 603 87 L531 165 Q496 213 441 228 L428 301 L400 301 L400 240 L334 240 L320 301 L290 301 L296 232 Q204 218 75 238Z';
    eye=[627,73];
  } else if (d.type==='plates') {
    body='M73 227 Q170 175 260 157 Q295 111 376 132 Q436 144 466 195 L539 213 Q579 199 599 222 L596 244 L534 245 L472 229 L455 302 L428 302 L426 225 L331 221 L311 302 L281 302 L286 220 Q191 207 73 227Z';
    extras=Array.from({length:9},(_,i)=>{const x=200+i*30,y=165-Math.sin(i/9*Math.PI)*33,h=28+Math.sin(i/9*Math.PI)*41;return `<path d="M${x} ${y}l-8 -${h*.6} 20 -${h*.4} 18 ${h*.65} -9 ${h*.45}Z" fill="${i%2?dark:'#db9968'}"/>`;}).join('')+`<path d="M104 215l-13 -43 43 34M133 213l-7 -44 36 33" fill="${fossil?fill:'#efcf9b'}"/>`; eye=[583,225];
  } else if(d.type==='horns') {
    body='M88 210 Q178 159 271 160 Q318 123 393 150 Q443 160 475 192 L529 184 L584 234 Q606 239 603 255 L549 258 L498 236 L473 300 L442 300 L447 232 L321 232 L305 300 L272 300 L276 224 Q182 203 88 210Z';
    extras=`<ellipse cx="476" cy="174" rx="44" ry="74" fill="${dark}"/><ellipse cx="478" cy="173" rx="30" ry="55" fill="${fill}"/><path d="M492 173l48 -86 -21 96M511 188l58 -76 -31 91M567 224l25 -44 -1 58" fill="${fossil?fill:'#f6e3b8'}"/>`; eye=[544,218];
  } else {
    const small=d.type!=='rex';
    body=small ? 'M84 220 Q191 171 267 180 Q327 143 383 165 Q424 164 449 119 L486 80 Q519 71 561 86 L563 106 L505 110 L473 166 L430 214 L394 230 L399 267 L432 294 L422 305 L374 289 L350 230 L319 220 L294 259 L279 298 L251 299 L264 248 L280 211 Q185 202 84 220Z' : 'M71 224 Q168 173 272 168 Q343 114 406 150 L449 115 Q490 77 559 86 L626 110 L631 143 L603 158 L533 159 L508 150 L477 204 L423 224 L394 229 L406 269 L446 287 L443 304 L384 301 L358 260 L343 213 L313 242 L300 291 L270 301 L249 295 L278 226 Q176 204 71 224Z';
    extras=`<path d="M423 185l26 27 22 -5" fill="none" stroke="${dark}" stroke-width="${small?11:8}" stroke-linecap="round"/>`;
    eye=small?[544,90]:[574,112];
    if(!small) extras+=`<path d="M542 144l5 10 7 -10 6 10 7 -10 6 10 7 -10 6 10 7 -10" fill="#fff7db"/>`;
  }
  let skeleton='';
  if(fossil) {
    const long=d.type==='longneck';
    skeleton=`<path d="M140 216Q237 190 303 193Q363 166 422 200${long?'Q485 202 533 141L604 77':head?'L478 144L519 115':'L526 224'}" stroke="#fff4d1" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    skeleton+=Array.from({length:7},(_,i)=>`<path d="M${300+i*18} ${184+i*2}q-12 35 2 45" stroke="#fff4d1" fill="none" stroke-width="5"/>`).join('');
    skeleton+=`<path d="M308 212l-17 55 -7 30M409 214l8 57 14 25" stroke="#fff4d1" fill="none" stroke-width="9" stroke-linecap="round"/>`;
  }
  return `<svg viewBox="0 0 700 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${fossil?'Simplified skeleton illustration of ': 'Stylized illustration of '}${d.name}"><ellipse cx="356" cy="305" rx="229" ry="13" fill="#244d3e" opacity=".09"/>${extras}<path d="${body}" fill="${fill}" stroke="${fossil?'#ac9769':'#284e3f'}" stroke-opacity=".2" stroke-width="2"/>${d.type==='horns'?extras:''}${skeleton}<circle cx="${eye[0]}" cy="${eye[1]}" r="${fossil?9:5}" fill="${fossil?'#99805b':'#173f35'}"/>${fossil?'':`<circle cx="${eye[0]+1}" cy="${eye[1]-1}" r="1.4" fill="white"/>`}</svg>`;
}
export function landscapeArt(d) {
  const warm=d.period==='triassic';
  return `<div class="flat-landscape"><svg class="landscape-backdrop" viewBox="0 0 900 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="900" height="450" fill="${warm?'#f3e0b7':'#dce8de'}"/><circle cx="708" cy="89" r="44" fill="#fff4c4"/><path d="M0 259L147 113L295 267L443 143L625 275L804 130L900 224V450H0Z" fill="${warm?'#d8b58a':'#a9c5b1'}"/><path d="M0 297Q200 208 406 300T900 265V450H0Z" fill="${warm?'#c99f75':'#82ae91'}"/><path d="M0 363Q240 291 477 365T900 331V450H0Z" fill="${warm?'#e3bf8d':'#b5c6a0'}"/><path d="M635 302Q527 348 704 450H836Q603 351 686 300Z" fill="#94b8b1"/>${[[-15,90,1.3],[92,183,.8],[803,137,1.1],[733,220,.65]].map(([x,y,s])=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M50 44V196" stroke="#645e43" stroke-width="11"/><path d="M50 0L0 88H26L-11 133H23L-24 178H124L79 133H111L77 88H100Z" fill="#466f54"/></g>`).join('')}</svg><div class="flat-animal">${dinosaurArt(d)}</div><span class="scene-label">Illustrated field view</span></div>`;
}
