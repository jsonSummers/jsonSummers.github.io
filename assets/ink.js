/* The diatom backdrop for the home page, loaded by assets/foam.js when the address has ?bg=diatoms.
   Diatoms under dark-field light: glassy and symmetrical, glinting with structural colour. */
(function(){
  const cv=document.getElementById('ink'); if(!cv) return;
  if(new URLSearchParams(location.search).get('bg')!=='diatoms') return;
  const dark=matchMedia('(prefers-color-scheme: dark)');
  function rng(seed){let s=seed>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  const hsl=(h,s,l,a=1)=>`hsla(${h},${s}%,${l}%,${a})`;

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
    diatoms(c,W,H,dark.matches);
  }
  let t; addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(draw,250)});
  dark.addEventListener?.('change',draw);
  draw();
})();
