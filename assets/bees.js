/* The Links page's backdrop: a late-summer meadow seen as a printed pattern. Drawn into <canvas id="meadow">.
   Ground: deep honey-umber with a faint honeycomb (the hexagonal cells bees build, the tightest way to tile a plane).
   Flowers: abstract, each built from real flower geometry. The heads are phyllotaxis spirals (each seed turned the
   golden angle, 137.5 degrees, from the last, as in a sunflower), ringed by petals and set on stems; colours are
   ochre, rust, sage, plum and cream, never bright.
   Bees: small, striped, with glassy wings. Some forage, drifting from flower to flower and pausing on each;
   one dances the waggle dance near the middle (a straight run with the body shaking, then a loop back round,
   alternately left and right, which is how a bee tells the hive where the flowers are).
   The meadow is painted once; only the bees move, at a calm frame rate, and not at all with reduced motion. */
(function(){
  const cv=document.getElementById('meadow'); if(!cv) return;
  const root=document.documentElement, still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dark=matchMedia('(prefers-color-scheme: dark)');
  function rng(seed){let s=seed>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  const GOLD=Math.PI*(3-Math.sqrt(5));
  let W=0,H=0,dpr=1,meadow=null,flowers=[],bees=[],dancer=null;

  function pal(night){ return night
    ? {ground:['#1d150c','#2a1e10'],comb:'rgba(214,170,90,.07)',ochre:'#b8892f',rust:'#9a4a26',sage:'#6f7a4c',plum:'#5e3646',cream:'#d9c69a',seed:'#3a2410',stem:'#4f5634'}
    : {ground:['#3a2a15','#4a3519'],comb:'rgba(240,200,120,.08)',ochre:'#c99a3c',rust:'#a5502a',sage:'#7d8a5a',plum:'#6b3f4f',cream:'#e8d8b0',seed:'#4a2c12',stem:'#5e6640'} }

  function comb(c,P){
    const s=W<700?14:18, h=s*Math.sqrt(3);
    c.strokeStyle=P.comb; c.lineWidth=1;
    for(let y=-h,row=0;y<H+h;y+=h/2,row++) for(let x=(row%2)*s*1.5;x<W+s*3;x+=s*3){
      c.beginPath(); for(let k=0;k<6;k++){const a=k*Math.PI/3; const px=x+Math.cos(a)*s, py=y+Math.sin(a)*s; k?c.lineTo(px,py):c.moveTo(px,py)} c.closePath(); c.stroke();
    }
  }
  /* one flower: stem, a ring (or two) of petals, and a phyllotaxis head */
  function flower(c,r,x,y,R,P){
    const kinds=[P.ochre,P.rust,P.plum,P.cream,P.sage], petal=kinds[Math.floor(r()*kinds.length)], ring2=kinds[Math.floor(r()*kinds.length)];
    c.strokeStyle=P.stem; c.lineWidth=Math.max(1.5,R*.06); c.lineCap='round';
    const sl=R*(2.5+r()*3), lean=(r()-.5)*.6;
    c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x+Math.sin(lean)*sl*.5,y+sl*.5,x+Math.sin(lean)*sl,y+sl); c.stroke();
    const n=Math.round(8+r()*10), style=Math.floor(r()*3), rot=r()*Math.PI;
    for(const [rr,col,len,wid] of [[R*1.05,ring2,R*.9,.28],[R*.9,petal,R*.75,.34]]){
      if(style===2&&col===ring2) continue;
      c.fillStyle=col; c.globalAlpha=.9;
      for(let k=0;k<n;k++){
        const a=rot+k/n*Math.PI*2+(col===petal?Math.PI/n:0), cx=x+Math.cos(a)*rr*.62, cy=y+Math.sin(a)*rr*.62;
        c.save(); c.translate(cx,cy); c.rotate(a);
        c.beginPath();
        if(style===1){ c.arc(0,0,len*.42,-Math.PI/2,Math.PI/2); c.closePath() }                         // half-moons
        else { c.moveTo(-len*.45,0); c.quadraticCurveTo(0,-len*wid,len*.55,0); c.quadraticCurveTo(0,len*wid,-len*.45,0) }   // pointed petals
        c.fill(); c.restore();
      }
    }
    c.globalAlpha=1;
    c.fillStyle=P.seed; c.beginPath(); c.arc(x,y,R*.48,0,Math.PI*2); c.fill();
    const seeds=Math.round(R*R*.22), sc=R*.46/Math.sqrt(seeds);
    for(let i=1;i<seeds;i++){                                                                          // the golden-angle spiral of seeds
      const a=i*GOLD, d=sc*Math.sqrt(i), t=i/seeds;
      c.fillStyle=t<.5?P.ochre:P.cream; c.globalAlpha=.55+.4*t;
      c.beginPath(); c.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,Math.max(.6,sc*.42),0,Math.PI*2); c.fill();
    }
    c.globalAlpha=1;
  }
  function paint(){
    const night=dark.matches, P=pal(night), r=rng(1609);
    meadow=document.createElement('canvas'); meadow.width=cv.width; meadow.height=cv.height;
    const c=meadow.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0);
    const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,P.ground[0]); g.addColorStop(1,P.ground[1]); c.fillStyle=g; c.fillRect(0,0,W,H);
    comb(c,P);
    // flowers mostly in the margins and along the bottom, so the page sits in a clearing
    flowers=[];
    const M=Math.max(70,(W-980)/2), n=Math.round(W*H/52000)+6;
    for(let i=0;i<n*4&&flowers.length<n;i++){
      const side=r(), x=side<.4?r()*M*1.1:side<.8?W-r()*M*1.1:r()*W, y=side<.8?r()*H:H*(.78+r()*.2), R=(W<700?12:16)+r()*r()*(W<700?22:34);
      if(flowers.some(f=>Math.hypot(f.x-x,f.y-y)<(f.R+R)*1.5)) continue;
      flowers.push({x,y,R});
    }
    flowers.sort((a,b)=>a.y-b.y).forEach(f=>flower(c,r,f.x,f.y,f.R,P));
    const v=c.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.hypot(W,H)*.6); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.35)'); c.fillStyle=v; c.fillRect(0,0,W,H);
  }
  /* bees */
  function bee(c,x,y,a,s,t,P){
    c.save(); c.translate(x,y); c.rotate(a); c.scale(s,s);
    const flap=still?.5:(Math.sin(t*70)*.5+.5);
    c.fillStyle='rgba(235,240,245,.42)'; c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=.4;
    for(const side of [-1,1]){ c.save(); c.rotate(side*(.5+flap*.5)); c.beginPath(); c.ellipse(-1,side*-4.5,3.6,2.1,side*.3,0,Math.PI*2); c.fill(); c.stroke(); c.restore() }
    c.fillStyle='#d9a441'; c.beginPath(); c.ellipse(0,0,5.2,3.2,0,0,Math.PI*2); c.fill();          // abdomen and thorax
    c.fillStyle='#2a1c10'; for(const sx of [-2.4,-.3,1.8]){ c.beginPath(); c.ellipse(sx,0,.75,3.05,0,0,Math.PI*2); c.fill() }   // stripes
    c.fillStyle='#2a1c10'; c.beginPath(); c.arc(5.4,0,1.9,0,Math.PI*2); c.fill();                   // head
    c.restore();
  }
  function setup(){
    const r=rng(42);
    bees=Array.from({length:W<700?3:6},()=>({f:Math.floor(r()*flowers.length),x:r()*W,y:r()*H,a:0,wait:r()*3,ph:r()*10}));
    dancer={x:W*(W<700?.5:.08)+ (W<700?0:Math.max(0,(W-980)/2)*.4), y:H*.55, dir:-.6+r()*1.2};
  }
  let last=0;
  function frame(ts){
    const t=ts/1000, dt=last?Math.min(.1,(ts-last)/1000):0; last=ts;
    const c=cv.getContext('2d'); c.setTransform(1,0,0,1,0,0); c.drawImage(meadow,0,0); c.setTransform(dpr,0,0,dpr,0,0);
    const P=pal(dark.matches), sc=W<700?1.6:2.3;
    for(const b of bees){
      const f=flowers[b.f]; if(!f) continue;
      const tx=f.x+Math.cos(b.ph)*f.R*.2, ty=f.y-f.R*.25, dx=tx-b.x, dy=ty-b.y, d=Math.hypot(dx,dy);
      if(d>3){ const sp=60*dt, wob=Math.sin(t*3+b.ph)*.6; b.a=Math.atan2(dy,dx)+wob*.3; b.x+=Math.cos(b.a)*Math.min(sp,d); b.y+=Math.sin(b.a)*Math.min(sp,d) }
      else if((b.wait-=dt)<0){ b.f=Math.floor(Math.random()*flowers.length); b.wait=2+Math.random()*4 }
      bee(c,b.x,b.y,b.a,sc,t+b.ph,P);
    }
    // the waggle dance: a straight run with the body shaking, then a half-loop back, alternately left and right
    const D=dancer, L=24*sc, cyc=4.2, u=(t%(cyc*2))/cyc, side=u<1?1:-1, v=u%1;
    let x,y,a;
    if(v<.45){ const k=v/.45; x=-L/2+k*L; y=Math.sin(t*28)*2.2*sc; a=Math.sin(t*28)*.35 }
    else { const k=(v-.45)/.55, th=Math.PI*k; x=L/2*Math.cos(th); y=side*L*.55*Math.sin(th); a=th*side+Math.PI*(side>0?.5:-.5)+Math.PI/2*side }
    const ca=Math.cos(D.dir), sa=Math.sin(D.dir);
    c.strokeStyle='rgba(232,216,176,.10)'; c.lineWidth=1; c.setLineDash([2,4]);
    c.beginPath(); c.moveTo(D.x-ca*L/2,D.y-sa*L/2); c.lineTo(D.x+ca*L/2,D.y+sa*L/2); c.stroke(); c.setLineDash([]);
    bee(c,D.x+x*ca-y*sa,D.y+x*sa+y*ca,a+D.dir,sc,t,P);
  }
  let lt=0;
  function loop(ts){ if(!document.hidden&&ts-lt>40){lt=ts;frame(ts)} requestAnimationFrame(loop) }
  function size(){ dpr=Math.min(2,devicePixelRatio||1); W=cv.clientWidth; H=cv.clientHeight; cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); paint(); setup(); frame(performance.now()) }
  let rt; addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(size,200)});
  dark.addEventListener?.('change',size);
  requestAnimationFrame(()=>setTimeout(()=>{ size(); if(!still) requestAnimationFrame(loop) },0));
})();
