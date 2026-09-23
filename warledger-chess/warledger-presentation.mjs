// Presentation only. The legal-move engine remains the rules authority.
export const MODAL_MODES = new Set(['market','promotion','confirm','options','help']);
export const PIECE_GUIDES = Object.freeze({
  K:'One square in any direction. Keep your king out of check.',
  Q:'Any distance along a clear rank, file, or diagonal.',
  R:'Any distance along a clear rank or file.',
  B:'Any distance along a clear diagonal.',
  N:'A 2-by-1 jump. Other pieces do not block the jump.',
  P:'Forward to move; diagonally to capture. Promote on the last rank.',
  D:'Chancellor: rook lines plus knight jumps.',
  Z:'Zebra: a 3-by-2 jump, not a knight jump.',
  C:'Queen-like quiet moves. Captures follow the target piece pattern.',
  A:'Rook-like quiet moves. A capture needs exactly one screen.'
});

export function actionAllowed(mode, action) {
  const name=String(action||'').split(':')[0];
  if(!name)return false;
  if(!MODAL_MODES.has(mode))return true;
  // Undo cancels a pending promotion rather than silently committing it.
  if(['cancel','exit','undo'].includes(name))return true;
  const allowed={
    market:['market','buy'],promotion:['buy','promote','market'],confirm:['confirm'],
    options:['options','smaller','larger','higher','lower','flip','place','fit','view','gallery','help','new','lab'],
    help:['help']
  };
  return allowed[mode]?.includes(name)||false;
}

export function safeViewport(width,height,top=0,bottom=0) {
  const w=Math.max(1,width),h=Math.max(1,height);
  const t=Math.min(Math.max(0,top),h*.42),b=Math.min(Math.max(0,bottom),h*.24);
  return {width:w,height:h,top:t,bottom:b,centerX:w/2,centerY:(t+h-b)/2,
    halfWidth:Math.max(1,w/2-14),halfHeight:Math.max(1,(h-t-b)/2-14),offsetY:(b-t)/2};
}

export function selectedDescription(state,square,legalMoves,pieces) {
  if(!square)return '';
  const r=8-Number(square[1]),c=square.charCodeAt(0)-97,p=state.board[r]?.[c];
  if(!p)return '';
  const count=legalMoves.filter(move=>move.fromSquare===square).length;
  return `${pieces[p.type].name} on ${square} | ${count} legal ${count===1?'move':'moves'}. ${PIECE_GUIDES[p.type]}`;
}

// Allocate markers once. Re-rendering a menu must not leak geometries or textures.
export function createBoardMarkers(THREE,board,tiles) {
  const group=new THREE.Group();group.name='tactical-markers';board.add(group);
  const shapes={dot:new THREE.CircleGeometry(.011,24),ring:new THREE.RingGeometry(.031,.035,32),
    selected:new THREE.RingGeometry(.037,.039,32),last:new THREE.RingGeometry(.028,.030,32)};
  const materials={move:0x62f7d2,capture:0xff7f69,selected:0xffd26c,check:0xff6258,last:0x65baff};
  for(const key of Object.keys(materials))materials[key]=new THREE.MeshBasicMaterial({color:materials[key],side:THREE.DoubleSide});
  const markers=tiles.map(tile=>{
    const g=new THREE.Group();g.position.copy(tile.position);g.position.y=.002;g.userData.square=tile.userData.square;group.add(g);
    const parts={};
    for(const [key,shape] of [['move','dot'],['capture','ring'],['selected','selected'],['check','selected'],['last','last']]){
      const mesh=new THREE.Mesh(shapes[shape],materials[key]);mesh.rotation.x=-Math.PI/2;mesh.visible=false;
      mesh.position.y=key==='check'?.0015:key==='selected'?.001:0;g.add(mesh);parts[key]=mesh;
    }
    return {square:tile.userData.square,parts};
  });
  return {group,markers,
    update({selected,targets,lastMove,checkedSquare}) {
      for(const {square,parts} of markers){
        const target=targets.get(square);
        parts.move.visible=!!target&&!target.capture;
        parts.capture.visible=!!target&&!!target.capture;
        parts.selected.visible=square===selected;
        parts.check.visible=square===checkedSquare;
        parts.last.visible=!!lastMove&&(lastMove.from===square||lastMove.to===square)&&!target&&square!==selected;
      }
    }
  };
}
