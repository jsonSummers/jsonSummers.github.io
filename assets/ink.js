/* Backdrops for the home page, drawn once onto <canvas id="ink">.
   Default: suminagashi, floating-ink marbling. Ink is dropped onto still water in rings; every new drop pushes all
   the ink already there outward (a point p at distance d from a drop of radius r moves to distance sqrt(d^2+r^2),
   which keeps the area of every ring), and then the surface is drawn through with a comb in gentle waves.
   Mostly indigo and Prussian blue, with thin rings of rainbow among them.
   ?bg=diatoms: diatoms under dark-field light, glassy and symmetrical, glinting with structural colour. */
(function(){
  const cv=document.getElementById('ink'); if(!cv) return;
  const mode=new URLSearchParams(location.search).get('bg')==='diatoms'?'diatoms':'ink';
  const dark=matchMedia('(prefers-color-scheme: dark)');
  function rng(seed){let s=seed>>>0||1;return()=>((s=Math.imul(s^s>>>15,1|s)+0x6D2B79F5|0,((s^s>>>14)>>>0)/4294967296))}
  const hsl=(h,s,l,a=1)=>`hsla(${h},${s}%,${l}%,${a})`;

  /* ---------- suminagashi ---------- */
  function marble(c,W,H,night){
    const r=rng(1868), N=360, rings=[];
    const drop=(cx,cy,rad,col)=>{
      for(const g of rings) for(const p of g.pts){const dx=p[0]-cx, dy=p[1]-cy, d2=dx*dx+dy*dy, k=Math.sqrt(1+rad*rad/(d2||1e-6)); p[0]=cx+dx*k; p[1]=cy+dy*k}
      rings.push({col,pts:Array.from({length:N},(_,i)=>{const a=i/N*Math.PI*2;return [cx+Math.cos(a)*rad,cy+Math.sin(a)*rad]})});
    };
    // a tine drawn across the water along direction (mx,my) through point (ox,oy): ink moves with it, less the further away it is
    const tine=(ox,oy,mx,my,z,u)=>{const nx=-my,ny=mx; for(const g of rings) for(const p of g.pts){const d=Math.abs((p[0]-ox)*nx+(p[1]-oy)*ny), f=z*Math.pow(u,d); p[0]+=mx*f; p[1]+=my*f}};
    const water=night?'#0a1422':'#eef1f2';
    const inks=night?['#2c5a9e','#1d3f78','#3f78b8','#16305e']:['#1d3a6e','#2a5594','#122a52','#3c6aa8'];
    const sites=Array.from({length:Math.max(7,Math.round(W*H/170000))},()=>[r()*W,r()*H]);
    let hue=r()*360;
    for(let round=0;round<16;round++) for(const [x,y] of sites){
      const rad=(W<700?18:30)+r()*26, j=(r()-.5)*10;
      if(r()<.16){ drop(x+j,y+j,rad*.45,hsl(hue,70,night?62:52)); hue=(hue+47)%360 }    // a thin rainbow ring
      drop(x+j,y+j,rad,inks[Math.floor(r()*inks.length)]);
      drop(x+j,y+j,rad*.8,water);                                                       // a clear ring of surfactant between inks
    }
    // comb gently across, then back at an angle: the ink flows into long curving lines
    for(let k=0;k<7;k++) tine(W*(k+.5)/7,0,0,1,(k%2?-1:1)*H*.06,.994);
    for(let k=0;k<5;k++) tine(0,H*(k+.5)/5,1,.25,(k%2?1:-1)*W*.05,.995);
    c.fillStyle=water; c.fillRect(0,0,W,H);
    for(const g of rings){c.fillStyle=g.col; c.beginPath(); g.pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])); c.closePath(); c.fill()}
    // paper fibre: faint, so the ink sits on something
    c.globalAlpha=night?.05:.07;
    for(let i=0;i<W*H/120;i++){c.fillStyle=r()<.5?'#000':'#fff'; c.fillRect(r()*W,r()*H,1+r()*2,1)}
    c.globalAlpha=1;
  }

  /* ---------- diatoms ---------- */
  function diatoms(c,W,H,night){
    const r=rng(1904);
    c.fillStyle=night?'#03070c':'#0a1220'; c.fillRect(0,0,W,H);
    const g=c.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.7); g.addColorStop(0,'rgba(30,60,90,.35)'); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.fillRect(0,0,W,H);
    const glass=(a,rad,R)=>hsl((a*180/Math.PI*1.5+rad/R*220+200)%360,55,72,.85);   // structural colour shifts with angle and radius
    function centric(x,y,R,rot){
      c.save(); c.translate(x,y); c.rotate(rot);
      c.lineWidth=1.2; c.strokeStyle=hsl(195,60,80,.9); c.shadowColor='rgba(150,220,255,.5)'; c.shadowBlur=8;
      c.beginPath(); c.arc(0,0,R,0,6.283); c.stroke(); c.shadowBlur=0;
      c.beginPath(); c.arc(0,0,R*.93,0,6.283); c.stroke();
      const ribs=24+Math.floor(r()*24);
      for(let k=0;k<ribs;k++){const a=k/ribs*6.283; c.strokeStyle=glass(a,R,R); c.lineWidth=.8; c.beginPath(); c.moveTo(Math.cos(a)*R*.18,Math.sin(a)*R*.18); c.lineTo(Math.cos(a)*R*.92,Math.sin(a)*R*.92); c.stroke()}
      for(let ring=1;ring<7;ring++){ const rr=R*(.2+ring*.11), n=Math.round(ribs*rr/R*2.2);
        for(let k=0;k<n;k++){const a=(k+.5)/n*6.283; c.fillStyle=glass(a,rr,R); c.beginPath(); c.arc(Math.cos(a)*rr,Math.sin(a)*rr,R*.018,0,6.283); c.fill()} }
      c.strokeStyle=hsl(50,70,80,.8); c.beginPath(); c.arc(0,0,R*.16,0,6.283); c.stroke();
      c.restore();
    }
    function pennate(x,y,L,rot){
      c.save(); c.translate(x,y); c.rotate(rot);
      const w=L*.17, valve=new Path2D(); valve.moveTo(-L/2,0); valve.bezierCurveTo(-L*.35,-w,L*.35,-w,L/2,0); valve.bezierCurveTo(L*.35,w,-L*.35,w,-L/2,0);
      c.strokeStyle=hsl(190,60,80,.9); c.lineWidth=1.2; c.shadowColor='rgba(150,220,255,.5)'; c.shadowBlur=8; c.stroke(valve); c.shadowBlur=0;
      c.save(); c.clip(valve);
      for(let s=-L/2;s<L/2;s+=L/40){ c.strokeStyle=glass(s/L*3,Math.abs(s),L/2); c.lineWidth=.7; c.beginPath(); c.moveTo(s,-w); c.lineTo(s+w*.15,-w*.18); c.moveTo(s,w); c.lineTo(s+w*.15,w*.18); c.stroke() }
      c.restore();
      c.strokeStyle=hsl(45,70,82,.85); c.lineWidth=.9; c.beginPath(); c.moveTo(-L*.42,0); c.lineTo(-L*.04,0); c.moveTo(L*.04,0); c.lineTo(L*.42,0); c.stroke();
      c.beginPath(); c.arc(0,0,w*.12,0,6.283); c.stroke();
      c.restore();
    }
    function triangle(x,y,R,rot){
      c.save(); c.translate(x,y); c.rotate(rot);
      const tri=new Path2D(); for(let k=0;k<3;k++){const a=k/3*6.283-Math.PI/2, a2=(k+1)/3*6.283-Math.PI/2; const px=Math.cos(a)*R, py=Math.sin(a)*R; k?tri.lineTo(px,py):tri.moveTo(px,py); tri.quadraticCurveTo(Math.cos((a+a2)/2)*R*.62,Math.sin((a+a2)/2)*R*.62,Math.cos(a2)*R,Math.sin(a2)*R)}
      c.strokeStyle=hsl(200,60,80,.9); c.lineWidth=1.2; c.shadowColor='rgba(150,220,255,.5)'; c.shadowBlur=8; c.stroke(tri); c.shadowBlur=0;
      c.save(); c.clip(tri);
      for(let gx=-R;gx<R;gx+=R/9) for(let gy=-R;gy<R;gy+=R/9*.87){const px=gx+((Math.round(gy/(R/9*.87)))%2?R/18:0); c.fillStyle=glass(Math.atan2(gy,px),Math.hypot(px,gy),R); c.beginPath(); c.arc(px,gy,R*.03,0,6.283); c.fill()}
      c.restore(); c.restore();
    }
    const S=Math.min(W,H)/900;
    for(let i=0;i<Math.round(W*H/90000)+6;i++){
      const x=r()*W, y=r()*H, k=r();
      if(k<.45) centric(x,y,(40+r()*70)*S,r()*6.283); else if(k<.85) pennate(x,y,(120+r()*140)*S,r()*6.283); else triangle(x,y,(50+r()*50)*S,r()*6.283);
    }
  }

  function draw(){
    const dpr=Math.min(2,devicePixelRatio||1), W=cv.clientWidth, H=cv.clientHeight;
    cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
    const c=cv.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0);
    (mode==='diatoms'?diatoms:marble)(c,W,H,dark.matches);
  }
  let t; addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(draw,250)});
  dark.addEventListener?.('change',draw);
  draw();
})();

/* Ripples spreading from the spore print across the page: each one a short train of crests and troughs, the
   crests catching the light and the troughs darkening, with a slightly uneven front. Drawn on <canvas id="ripples">
   laid over the hero in soft-light, so the page itself seems to ripple. */
(function(){
  const cv=document.getElementById('ripples'), orbit=document.querySelector('.orbit'); if(!cv||!orbit) return;
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches, PERIOD=16, COUNT=3, LIFE=PERIOD*COUNT;
  let W=0,H=0,dpr=1,cx=0,cy=0,R0=0;
  function size(){
    dpr=Math.min(2,devicePixelRatio||1); W=cv.clientWidth; H=cv.clientHeight; cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
    const a=cv.getBoundingClientRect(), b=orbit.getBoundingClientRect(); cx=b.left+b.width/2-a.left; cy=b.top+b.height/2-a.top; R0=b.width*.47;
  }
  function wobble(th,t,k){return Math.sin(th*5+t*.6+k)*2.2+Math.sin(th*11-t*.4+k*2)*1.2+Math.sin(th*23+k*3)*.6}
  function draw(t){
    const c=cv.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,W,H); c.filter='blur(2.5px)';
    const reach=Math.hypot(Math.max(cx,W-cx),Math.max(cy,H-cy));
    for(let k=0;k<COUNT;k++){
      const age=((t+k*PERIOD)%LIFE)/LIFE, front=R0+(reach-R0)*Math.pow(age,.8), fade=Math.sin(Math.PI*Math.min(1,age*1.15))*(1-age*.5);
      if(fade<=0) continue;
      for(let w=0;w<5;w++){                     // the train: crest, trough, crest... shrinking behind the front
        const rr=front-w*13, amp=fade*Math.exp(-w*.45);
        if(rr<R0*.98) continue;
        for(const [off,col] of [[0,'255,255,255'],[6.5,'0,0,0']]){
          c.strokeStyle=`rgba(${col},${(.2*amp).toFixed(3)})`; c.lineWidth=6; c.beginPath();
          for(let i=0;i<=180;i++){const th=i/180*6.283, rad=rr-off+wobble(th,t,k+w); const x=cx+Math.cos(th)*rad, y=cy+Math.sin(th)*rad; i?c.lineTo(x,y):c.moveTo(x,y)}
          c.stroke();
        }
      }
    }
  }
  let last=0,t0=performance.now();
  function loop(ts){ if(!document.hidden&&ts-last>40){last=ts;draw((ts-t0)/1000)} requestAnimationFrame(loop) }
  addEventListener('resize',()=>{size();draw((performance.now()-t0)/1000)});
  size(); draw(still?PERIOD*.6:0); if(!still) requestAnimationFrame(loop);
})();
