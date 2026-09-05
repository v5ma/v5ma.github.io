"""Scoped integration; stage native source changes before verification."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];g=ROOT/'mario-maker-clone/svgn-paper-route'
p=g/'index.html';s=p.read_text()
if './adventure-score.js' not in s:
 s=s.replace('<script src="./campaign.js"></script>','<script src="./adventure-score.js"></script>\n<script src="./soundtrack.js"></script>\n<script src="./campaign.js"></script>')
 s=s.replace('<script src="./ground-runtime.js"></script>','<script src="./ground-runtime.js"></script>\n<script src="./adventure-game.js"></script>')
 s=s.replace('<link rel="stylesheet" href="./ground.css">','<link rel="stylesheet" href="./ground.css">\n<link rel="stylesheet" href="./adventure.css">')
 s=s.replace('window.__BUILD=1788606001;', 'window.__BUILD=1788639901;')
p.write_text(s,newline='\r\n')
p=g/'ground-runtime.js';s=p.read_text()
s=s.replace('routeQuota=Math.min(meta.quota,boxes.length);','routeQuota=0;')
s=s.replace("if(p.inv>0)p.inv--;interactTiles(p);\n   }else{", "if(p.inv>0)p.inv--;interactTiles(p);\n   }else{")
s=s.replace("No countdown, pits, enemies or required aerial tricks in the introductory routes. The former sky courses are still available as advanced challenges.","Longer adventures, friendly neighbors, patrol bots, shields and loop routes. Cross the finish to continue; every delivery is a bonus.")
s=s.replace("A friendly first ride, then optional ramps, curved shortcuts and whip practice. Stay on the ground, explore above it, or return later for a better run.","Explore six neighborhoods in Sunrise Borough, then continue along Waterwheel Boulevard and into Copperleaf Gardens. Ride, jump, meet neighbors, defeat bots and find optional high routes.")
s=s.replace("const text=state.steps<190?", "const text=state.steps<190?")
s=s.replace("C THROWS A PAPER. YOU CAN STOP AND TRY AGAIN.","C: BONUS DELIVERIES. SPACE: JUMP. THE FINISH IS ALWAYS OPEN.")
s=s.replace("DELIVERIES DONE. CONTINUE TO THE DEPOT AT YOUR OWN PACE.","REACH THE STRIPED FINISH. COLLECTIBLES AND MAIL ARE OPTIONAL.")
s=s.replace("const res=document.getElementById('delivery-results');", "const res=document.getElementById('delivery-results');")
s=s.replace("Route complete. ${state.upper.size} optional upper routes found. The ground route is a full completion; aerial exploration earns extra score. Your timer was informational, never a deadline.","Level complete! ${deliveries} bonus deliveries and ${state.upper.size} upper routes found. Crossing the finish completes the adventure.")
s=s.replace("if(b)b.textContent=meta.index<2?'Next neighborhood route':'Try an advanced challenge';", "if(b)b.textContent=meta.index<2?'Next level':'Choose another adventure';")
p.write_text(s)
p=g/'sw.js';s=p.read_text().replace('svgn-paper-route-ground-first-20260905','svgn-paper-route-adventure-score-20260905');p.write_text(s)
print('Integrated the original score and larger finish-to-finish adventures.')
