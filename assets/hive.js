/* The Links page's backdrop: a honeycomb drawn as structure, not as a picture.
   The comb is a true hexagonal tiling in fine gold lines, built outward from the lower right corner as bees build
   it: complete near where they started, then cells with only some walls up, then a few scattered first walls at
   the growing edge. A handful of cells near the top of the built part are capped with honey, a soft gold fill.
   One thing moves: a single gold line tracing the waggle dance, the figure-of-eight a bee runs to tell the hive
   where the flowers are (a straight run, its body waggling, then a loop back round, alternately left and right).
   The run's angle is the direction to the flowers; the line fades behind it. Nothing else moves.
   Drawn into <canvas id="hive">; the comb is painted once, the line at a calm frame rate (not at all with
   reduced motion, which shows the finished figure-of-eight). */
(function(){
  const cv=document.getElementById('hive'); if(!cv) return;
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rng(seed){let s=seed>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  let W=0,H=0,dpr=1,comb=null,dance=null,trail=[];
  const GOLD='214,170,92';
  function paint(){
    const r=rng(808), s=W<700?16:22, w=Math.sqrt(3)*s, rh=1.5*s;
    const ox=W*1.02, oy=H*1.04, R0=Math.hypot(W,H)*(W<700?.5:.42), R1=R0*1.45;   // built, then building, from the corner
    comb=document.createElement('canvas'); comb.width=cv.width; comb.height=cv.height;
    const c=comb.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0);
    const g=c.createLinearGradient(0,0,W,H); g.addColorStop(0,'#0b0907'); g.addColorStop(1,'#15100a'); c.fillStyle=g; c.fillRect(0,0,W,H);
    const corner=k=>[Math.sin(k*Math.PI/3)*s,-Math.cos(k*Math.PI/3)*s];
    for(let row=-1,y=-s;y<H+s*2;row++,y+=rh) for(let x=(row&1)*w/2-w;x<W+w;x+=w){
      const d=Math.hypot(x-ox,y-oy)+(r()-.5)*s*2, f=(d-R0)/(R1-R0);       // f<0 built; 0..1 building; >1 bare
      if(f>1.05) continue;
      // honey: capped cells in a band near the top of the built comb
      if(f<-.05&&f>-.4&&r()<.22){ const hg=c.createRadialGradient(x,y-s*.2,0,x,y,s); hg.addColorStop(0,`rgba(${GOLD},.2)`); hg.addColorStop(1,`rgba(${GOLD},.07)`);
        c.fillStyle=hg; c.beginPath(); for(let k=0;k<6;k++){const [a,b]=corner(k); k?c.lineTo(x+a*.9,y+b*.9):c.moveTo(x+a*.9,y+b*.9)} c.closePath(); c.fill() }
      const walls=f<0?6:Math.round(6*(1-f)*(.6+.8*r()));
      if(walls<=0) continue;
      const start=Math.floor(r()*6), al=f<0?.17:.17*(1-f*.6);
      c.strokeStyle=`rgba(${GOLD},${al})`; c.lineWidth=1; c.lineCap='round'; c.beginPath();
      for(let k=0;k<walls;k++){ const [a,b]=corner(start+k), [a2,b2]=corner(start+k+1); c.moveTo(x+a,y+b); c.lineTo(x+a2,y+b2) }
      c.stroke();
    }
    const v=c.createRadialGradient(W*.4,H*.4,Math.min(W,H)*.2,W*.4,H*.4,Math.hypot(W,H)*.75); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.45)');
    c.fillStyle=v; c.fillRect(0,0,W,H);
    // the dance floor: in the open margin on the left (above the content on a phone)
    const M=(W-Math.min(980,W-48))/2;
    dance=M>160?{x:M*.5,y:H*.42,L:Math.min(96,M*.42),dir:-1.05}:{x:W*.5,y:H*.88,L:W*.12,dir:-1.05};
    trail=[];
  }
  /* the dancer's position at time t: a straight run (with a fast sideways waggle) then a half loop back,
     alternately to the left and the right */
  function at(t){
    const D=dance, cyc=3.4, u=(t%(cyc*2))/cyc, side=u<1?1:-1, v=u%1;
    let x,y;
    if(v<.45){ const k=v/.45; x=-D.L/2+k*D.L; y=Math.sin(t*2*Math.PI*13)*D.L*.035 }
    else { const th=Math.PI*(v-.45)/.55; x=D.L/2*Math.cos(th); y=side*D.L*.42*Math.sin(th) }
    const ca=Math.cos(D.dir), sa=Math.sin(D.dir);
    return [D.x+x*ca-y*sa, D.y+x*sa+y*ca];
  }
  let last=0;
  function frame(ts){
    const t=ts/1000, c=cv.getContext('2d');
    c.setTransform(1,0,0,1,0,0); c.drawImage(comb,0,0); c.setTransform(dpr,0,0,dpr,0,0);
    if(still){ trail=[]; for(let i=0;i<240;i++) trail.push(at(i/240*6.8)); }
    else { trail.push(at(t)); if(trail.length>150) trail.shift() }
    c.lineCap='round'; c.lineJoin='round';
    for(let i=1;i<trail.length;i++){ const a=still?.5:i/trail.length;
      c.strokeStyle=`rgba(${GOLD},${(a*a*.75).toFixed(3)})`; c.lineWidth=1.4; c.beginPath(); c.moveTo(...trail[i-1]); c.lineTo(...trail[i]); c.stroke() }
    if(!still){ const [x,y]=trail[trail.length-1]; c.fillStyle=`rgba(${GOLD},.95)`; c.beginPath(); c.arc(x,y,2.2,0,Math.PI*2); c.fill() }
  }
  function loop(ts){ if(!document.hidden&&ts-last>33){last=ts;frame(ts)} requestAnimationFrame(loop) }
  function size(){ dpr=Math.min(2,devicePixelRatio||1); W=cv.clientWidth; H=cv.clientHeight; cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); paint(); frame(performance.now()) }
  let rt; addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(size,200)});
  requestAnimationFrame(()=>setTimeout(()=>{ size(); if(!still) requestAnimationFrame(loop) },0));
})();
