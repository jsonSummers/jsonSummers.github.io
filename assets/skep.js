/* The Links page's backdrop: a medieval skep in a bee bole. A skep is a hive made of one rope of straw coiled
   round and up into a dome, each coil stitched to the one below with split bramble, the stitches staggered course
   by course. It sits on a plank in a bee bole, an arched recess in a dry-stone wall that kept the rain off.
   Here the wall is coursed rubble, the niche's arch is a ring of wedge-shaped voussoirs, and the skep is drawn
   coil by coil: each straw rope is a band seen a little from above (so it sags towards the middle), its stalks
   bunch towards the sides as the dome turns away, and the light comes from the left, as from a doorway.
   A few bees make orientation flights: widening arcs facing the entrance, as young bees do to learn where home is.
   The scene is painted once; only the bees and a slow drift of the doorway light move. Still with reduced motion.
   Drawn into <canvas id="skep">. */
(function(){
  const cv=document.getElementById('skep'); if(!cv) return;
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rng(seed){let s=seed>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  let W=0,H=0,dpr=1,c=null,base=null,E=null,bees=[];

  function paint(){
    const b=document.createElement('canvas'); b.width=cv.width; b.height=cv.height;
    const x=b.getContext('2d'); x.setTransform(dpr,0,0,dpr,0,0); const r=rng(17);
    const wide=W>1000, Hs=wide?Math.min(H*.56,W*.38):Math.min(H*.42,W*.78);    // skep height
    const R=Hs*.56, cx=wide?W*.76:W*.5, by=wide?H*.84:H*.8;                        // half-width at the base, centre, base line
    x.fillStyle='#0f0a06'; x.fillRect(0,0,W,H);
    // the wall: courses of rubble, each stone a slightly irregular block, mortar showing between
    for(let y=-r()*20;y<H;){ const ch=22+r()*20;
      for(let xx=-r()*60;xx<W;){ const w=30+r()*90, l=13+r()*9, h=ch*(.62+r()*.38), dy=(ch-h)*r();
        x.fillStyle=`rgb(${l+7|0},${l+2|0},${l-5|0})`; x.beginPath(); x.roundRect(xx+2.5,y+dy+2.5,w-5,h-5,[6+r()*8,3+r()*6,6+r()*8,3+r()*6]); x.fill();
        x.fillStyle='rgba(255,230,190,.02)'; x.fillRect(xx+6,y+dy+3,w-14,1.5); xx+=w }
      y+=ch }
    for(let i=0;i<W*H/60;i++){ x.fillStyle=r()<.5?'rgba(0,0,0,.18)':'rgba(255,220,170,.025)'; x.fillRect(r()*W,r()*H,1.5,1.5) }   // grit
    // the bee bole: a round-arched niche, dark inside, its arch a ring of voussoirs
    const nw=R*1.2, nb=by+Hs*.08, nt=by-Hs*.6, ar=nw;            // niche half-width, bottom, springing line, arch radius
    x.fillStyle='#070402'; x.beginPath(); x.moveTo(cx-nw,nb); x.lineTo(cx-nw,nt); x.arc(cx,nt,ar,Math.PI,0); x.lineTo(cx+nw,nb); x.closePath(); x.fill();
    const g0=x.createRadialGradient(cx,nt,0,cx,nt+Hs*.6,nw*1.6); g0.addColorStop(0,'rgba(60,38,18,.35)'); g0.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g0; x.fill();
    const nv=13, th=Hs*.13;
    for(let i=0;i<nv;i++){ const a0=Math.PI+i/nv*Math.PI+.012, a1=Math.PI+(i+1)/nv*Math.PI-.012, l=18+r()*10;
      x.fillStyle=`rgb(${l+12},${l+5},${l-4})`; x.beginPath(); x.arc(cx,nt,ar+th,a0,a1); x.arc(cx,nt,ar+2,a1,a0,true); x.closePath(); x.fill() }
    for(const s of [-1,1]) for(let y=nt;y<nb;){ const h=th*(.8+r()*.5), l=16+r()*10;          // the jambs
      x.fillStyle=`rgb(${l+12},${l+5},${l-4})`; x.beginPath(); x.roundRect(s<0?cx-nw-th:cx+nw+2,y+2,th-2,h-3,3); x.fill(); y+=h }
    // the plank, with its grain
    const pw=R*1.34, pt=by, ph=Hs*.07;
    x.fillStyle='#3a2414'; x.fillRect(cx-pw,pt,pw*2,ph); x.fillStyle='#4c3019'; x.fillRect(cx-pw,pt,pw*2,2);
    x.strokeStyle='rgba(20,10,4,.5)'; x.lineWidth=.7;
    for(let k=0;k<6;k++){ const yy=pt+3+k*ph/6.5; x.beginPath(); x.moveTo(cx-pw,yy); for(let xx=cx-pw;xx<=cx+pw;xx+=20) x.lineTo(xx,yy+Math.sin(xx*.02+k)*1.2); x.stroke() }
    x.fillStyle='rgba(0,0,0,.45)'; x.beginPath(); x.ellipse(cx,pt+1,R*1.08,ph*.5,0,0,6.3); x.fill();
    // the skep, coil by coil from the bottom: hw(u) is the dome's profile, sag the view from slightly above
    const n=Math.max(9,Math.round(Hs/(wide?30:24))), chh=Hs/n, sag=chh*.55;
    const hw=u=>R*Math.pow(Math.max(0,1-Math.pow(u,2.3)),.5)*(1+.05*(1-u));
    for(let i=0;i<n;i++){
      const u0=i/n, u1=(i+1)/n, w0=hw(u0), w1=Math.max(hw(u1),R*.12), yb=by-i*chh, yt=yb-chh*1.08, w=(w0+w1)/2;
      const band=new Path2D(); band.moveTo(cx-w0,yb); band.quadraticCurveTo(cx,yb+sag*(w0/R)*2,cx+w0,yb); band.lineTo(cx+w1,yt);
      band.quadraticCurveTo(cx,yt+sag*(w1/R)*2,cx-w1,yt); band.closePath();
      x.save(); x.clip(band);
      const gv=x.createLinearGradient(0,yt,0,yb+sag); gv.addColorStop(0,'#d7b064'); gv.addColorStop(.55,'#b48a42'); gv.addColorStop(1,'#5c3f1a'); x.fillStyle=gv; x.fillRect(cx-w0-2,yt-2,w0*2+4,chh*2+sag*2);
      // the stalks: short strokes slanting with the rope's twist, spaced evenly in angle round the dome
      const m=Math.round(w*1.1);
      for(let k=0;k<m;k++){ const th=-Math.PI/2+(k+r()*.6)/m*Math.PI, sx=cx+Math.sin(th)*w, f=Math.cos(th);
        const yy=yb-chh*.5+sag*(1-Math.sin(th)**2)*(w/R)*2*.95;
        x.strokeStyle=r()<.5?`rgba(240,205,130,${.25+.35*f})`:`rgba(90,58,22,${.35+.3*f})`; x.lineWidth=.6+r()*.7;
        x.beginPath(); x.moveTo(sx-chh*.32*f,yy-chh*.55); x.lineTo(sx+chh*.32*f,yy+chh*.55); x.stroke() }
      // the bramble stitches, staggered half a step from the course below
      const ns=Math.max(4,Math.round(w/(chh*1.5)));
      for(let k=0;k<ns;k++){ const th=-Math.PI/2+(k+.5+(i%2)*.5)/ns*Math.PI; if(th>Math.PI/2) continue;
        const sx=cx+Math.sin(th)*w, f=Math.cos(th), yy=yb-chh*.5+sag*(1-Math.sin(th)**2)*(w/R)*2*.95;
        x.fillStyle=`rgba(80,50,22,${.35+.3*f})`; x.beginPath(); x.ellipse(sx,yy,chh*.13*f+.5,chh*.6,.3,0,6.3); x.fill();
        x.fillStyle=`rgba(150,100,50,${.25*f})`; x.fillRect(sx-chh*.08*f,yy-chh*.5,1,chh*.9) }
      // light from the left, falling off round the dome; the crevice under each coil
      const gh=x.createLinearGradient(cx-w0,0,cx+w0,0); gh.addColorStop(0,'rgba(255,220,150,.12)'); gh.addColorStop(.35,'rgba(0,0,0,0)'); gh.addColorStop(1,'rgba(10,4,0,.62)');
      x.fillStyle=gh; x.fillRect(cx-w0-2,yt-2,w0*2+4,chh*2+sag*2);
      x.restore();
      x.strokeStyle='rgba(30,16,6,.7)'; x.lineWidth=1.4; x.beginPath(); x.moveTo(cx-w0,yb); x.quadraticCurveTo(cx,yb+sag*(w0/R)*2,cx+w0,yb); x.stroke() }
    // the cap: the coil's tight start at the crown
    const ty=by-n*chh-chh*.2; x.fillStyle='#a07a38'; x.beginPath(); x.ellipse(cx,ty+chh*.3,R*.14,chh*.5,0,0,6.3); x.fill();
    // the entrance: a small arch cut in the bottom coil
    const ex=cx-R*.12, ew=R*.13; x.fillStyle='#0a0503'; x.beginPath(); x.moveTo(ex-ew,by+sag*1.6); x.lineTo(ex-ew,by-chh*.45); x.arc(ex,by-chh*.45,ew,Math.PI,0); x.lineTo(ex+ew,by+sag*1.6); x.fill();
    E={x:ex,y:by-chh*.2,s:Hs};
    // a vignette so the page reads
    const v=x.createRadialGradient(cx,by-Hs*.5,Hs*.3,cx,by-Hs*.5,Math.hypot(W,H)); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.6)'); x.fillStyle=v; x.fillRect(0,0,W,H);
    base=b;
    const rb=rng(5); bees=Array.from({length:wide?5:3},(_,i)=>({ph:rb()*100,sp:.5+rb()*.5,ax:.6+rb()*.8,dir:rb()<.5?-1:1}));
  }
  // an orientation flight: loops in front of the hive, facing it, widening and then closing back to the entrance
  function bee(b,t){
    const T=t*b.sp+b.ph, cyc=(T%14)/14, wid=Math.sin(cyc*Math.PI), s=E.s*.55*b.ax*wid;
    const a=T*2.3*b.dir;
    return [E.x+Math.sin(a)*s*1.2+Math.sin(T*.7)*s*.25, E.y-s*.25-Math.abs(Math.cos(a))*s*.45-Math.sin(T*.5)*s*.15, wid];
  }
  function draw(t){
    c.setTransform(1,0,0,1,0,0); c.drawImage(base,0,0); c.setTransform(dpr,0,0,dpr,0,0);
    const lx=W*(.18+.08*Math.sin(t*.05)), g=c.createRadialGradient(lx,H*.1,0,lx,H*.1,Math.max(W,H)*.75);   // the doorway's light
    g.addColorStop(0,'rgba(255,196,120,.10)'); g.addColorStop(1,'rgba(255,196,120,0)'); c.globalCompositeOperation='lighter'; c.fillStyle=g; c.fillRect(0,0,W,H); c.globalCompositeOperation='source-over';
    if(!E) return;
    for(const b of bees){ const [x,y,w]=bee(b,t); if(w<.04) continue; const [x2,y2]=bee(b,t-.03), a=Math.atan2(y-y2,x-x2), z=Math.max(.8,E.s/250);
      c.save(); c.translate(x,y); c.rotate(a); c.scale(z,z);
      c.fillStyle='rgba(235,230,215,.35)'; c.beginPath(); c.ellipse(-.5,-2.2+Math.sin(t*90)*.6,2.2,1.1,-.5,0,6.3); c.ellipse(-.5,2.2-Math.sin(t*90)*.6,2.2,1.1,.5,0,6.3); c.fill();   // wings
      c.fillStyle='#e0a83c'; c.beginPath(); c.ellipse(0,0,3.2,1.7,0,0,6.3); c.fill();
      c.fillStyle='#2a1a08'; c.fillRect(-1.6,-1.7,1,3.4); c.fillRect(.2,-1.6,.9,3.2); c.beginPath(); c.arc(3.1,0,1.1,0,6.3); c.fill();
      c.restore() }
  }
  function size(){ dpr=Math.min(2,devicePixelRatio||1); W=cv.clientWidth; H=cv.clientHeight; cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); c=cv.getContext('2d'); paint(); draw(performance.now()/1000) }
  let last=0, step=33;
  function loop(ts){ requestAnimationFrame(loop); if(document.hidden||ts-last<step) return; last=ts; draw(ts/1000) }
  let rt; addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(size,150)});
  size(); step=1000/(W<700?20:30); if(!still) requestAnimationFrame(loop);
})();
