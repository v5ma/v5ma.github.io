/* Reading a notebook is not a gameplay action. A deliberately opened pause
 * menu may open its child while simulation/input remain paused. */
export function canOpenMenu(playing,paused,root){
 if(!playing)return false;
 if(!paused)return root==null;
 return root?.tagName==='DIALOG'&&root.id==='pause-dialog'&&root.open===true;
}
