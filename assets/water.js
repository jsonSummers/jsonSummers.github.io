/* The water around every page. Each page sits at a depth (body data-depth="from,to", in metres) and scrolling
   takes you from the first to the second. The water's colour is sunlight at the surface with each channel
   absorbed at its own rate (Beer-Lambert, coastal water: red goes first, green carries furthest). Marine snow
   drifts past in three layers, the nearest larger and softer, sinking and sliding up as you descend.
   Faint sensor noise, a wide-angle lens's barrel distortion and its darkened corners make it look filmed.
   Far off, barely there, a moon jelly (Aurelia aurita) drifts across: a clear bell with the four horseshoe rings
   of its gonads, a fringe of fine tentacles and four frilled oral arms, pulsing slowly (the bell contracts quickly
   and relaxes slowly, each beat lifting it a little) and seen through the same lens as everything else.
   Exposes window.Water and fires a 'depth' event on window with {depth, T, rgb}. */
(function(){
  const cv=document.getElementById('water'); if(!cv) return;
  const root=document.documentElement;
  const [D0,D1]=(document.body.dataset.depth||'0,10').split(',').map(Number);
  const K=[0.38,0.055,0.045], SUN=[242,240,232], DEEP=[2,7,15];
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T=d=>K.map(k=>Math.exp(-k*Math.max(0,d)));
  const at=(c,t)=>c.map((v,i)=>v*t[i]+DEEP[i]*(1-t[i]));
  const css=c=>`rgb(${c.map(v=>Math.round(Math.max(0,Math.min(255,v)))).join(',')})`;
  const lum=c=>{const l=c.map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});return .2126*l[0]+.7152*l[1]+.0722*l[2]};
  const scrollable=()=>Math.max(1,document.documentElement.scrollHeight-innerHeight);
  const depthAt=y=>D0+(D1-D0)*Math.max(0,Math.min(1,y/scrollable()));
  window.Water={K,SUN,DEEP,T,at,css,lum,depthAt};

  function rng(seed){let s=seed>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  const r=rng(2507);
  let W=0,H=0,dpr=1,flakes=[],noise=[];
  function size(){
    dpr=Math.min(2,devicePixelRatio||1); W=innerWidth; H=innerHeight;
    cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
    const n=Math.round(W*H/2400);
    flakes=Array.from({length:n},()=>{const z=r();return {x:r()*W,y:r()*H,z,s:.5+z*z*3.2,a:r()*Math.PI,e:.4+r()*.6,sink:.18+z*.55,sway:r()*6.28}});
    // a few tiles of sensor noise, cycled so the grain moves without being drawn fresh each frame
    noise=Array.from({length:4},()=>{const t=document.createElement('canvas');t.width=t.height=128;const c=t.getContext('2d'),im=c.createImageData(128,128);
      for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255}c.putImageData(im,0,0);return t});
  }
  let lastY=scrollY, frame=0, depth=D0;
  /* the moon jelly: drawn at a size s (the bell's width) with its bell's beat b (0 relaxed, 1 contracted) */
  const jel={x:.78,y:.62,vx:-.006,ph:0};
  function jelly(c,x,y,s,b,t,al){
    const w=s*(1-.14*b), h=s*(.42+.1*b);                                       // the bell narrows and deepens as it beats
    c.save(); c.translate(x,y); c.rotate(-.12+.05*Math.sin(t*.21));
    // oral arms and tentacles first, trailing behind (below) the bell
    c.lineCap='round';
    for(let k=0;k<4;k++){ const ox=(k-1.5)*w*.07, len=s*(.9+.15*k%2);
      c.strokeStyle=`rgba(225,240,250,${al*.55})`; c.lineWidth=s*.035; c.beginPath(); c.moveTo(ox,h*.05);
      for(let i=1;i<=12;i++){ const v=i/12; c.lineTo(ox+Math.sin(v*5+t*.7+k)*s*.06*v, h*.05+v*len) } c.stroke() }
    c.strokeStyle=`rgba(225,240,250,${al*.35})`; c.lineWidth=Math.max(.5,s*.006);
    for(let i=0;i<=40;i++){ const u=i/40, ex=-w/2+u*w, ey=h*.02*Math.sin(u*Math.PI), len=s*(.18+.1*Math.sin(i*1.7)), sw=Math.sin(t*.8+i*.4)*s*.03;
      c.beginPath(); c.moveTo(ex,ey); c.quadraticCurveTo(ex+sw*.5,ey+len*.5,ex+sw,ey+len); c.stroke() }
    // the bell: a shallow dome, clearer in the middle, with a brighter rim
    const g=c.createRadialGradient(0,-h*.2,0,0,-h*.2,w*.6); g.addColorStop(0,`rgba(235,245,252,${al*.25})`); g.addColorStop(.75,`rgba(235,245,252,${al*.45})`); g.addColorStop(1,`rgba(235,245,252,${al*.8})`);
    c.fillStyle=g; c.beginPath(); c.moveTo(-w/2,0); c.bezierCurveTo(-w/2,-h*1.25,w/2,-h*1.25,w/2,0); c.quadraticCurveTo(0,h*.12,-w/2,0); c.fill();
    c.strokeStyle=`rgba(240,248,255,${al*.9})`; c.lineWidth=Math.max(.6,s*.008); c.stroke();
    // the four gonads, seen through the bell as faint lilac horseshoes
    // arranged as a four-leaf clover round the bell's centre (seen from a little above), each opening outwards
    c.strokeStyle=`rgba(214,190,236,${al*.6})`; c.lineWidth=s*.016;
    for(let k=0;k<4;k++){ const a=Math.PI/4+k*Math.PI/2, gx=Math.cos(a)*w*.15, gy=-h*.55+Math.sin(a)*h*.22;
      c.save(); c.translate(gx,gy); c.scale(1,.55); c.beginPath(); c.arc(0,0,w*.075,a+.9,a+Math.PI*2-.9); c.restore(); c.stroke() }
    c.restore();
  }
  /* a soft sprite for the near, out-of-focus flakes, made once instead of a gradient per flake per frame */
  let blob=null;
  function sprite(){blob=document.createElement('canvas'); blob.width=blob.height=64; const c=blob.getContext('2d'), g=c.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,.5)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(0,0,64,64)}
  /* barrel distortion, as through a dome port: points are pushed outward the further they are from the centre */
  /* barrel distortion, as through a wide-angle lens behind a dome port: the further a point is from the centre, the
     more it is pulled in towards it (r' = r(1 - k r^2), r measured to the corner), so the middle of the view is
     magnified and the edges are squeezed; things near the edges look smaller and slower */
  const BARREL=.34;
  function lens(x,y){const D=Math.hypot(W,H)/2, nx=(x-W/2)/D, ny=(y-H/2)/D, q=1-BARREL*(nx*nx+ny*ny); return [W/2+nx*q*D, H/2+ny*q*D, q]}
  function draw(){
    const c=cv.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0);
    depth=depthAt(scrollY);
    const t=T(depth), mid=at(SUN,t), top=at(SUN,T(depth-4)), bot=at(SUN,T(depth+8));
    // the water's gradient: level bands, brighter above as the light comes from the surface
    const g=c.createLinearGradient(0,0,0,H);
    g.addColorStop(0,css(top)); g.addColorStop(.5,css(mid)); g.addColorStop(1,css(bot));
    c.fillStyle=g; c.fillRect(0,0,W,H);
    // marine snow: brighter against dark water, faint against bright shallows
    const L=lum(mid), dy=(scrollY-lastY); lastY=scrollY;
    const ink=L>.35?'255,255,255':'225,235,240', base=L>.35?.28:.5;
    if(!blob) sprite();
    for(const f of flakes){
      if(!still){f.y+=f.sink; f.x+=Math.sin(f.sway+=.012)*.25*f.z}
      f.y-=dy*(.25+f.z*.75);
      if(f.y>H+8){f.y=-8;f.x=r()*W} if(f.y<-8){f.y=H+8;f.x=r()*W}
      const [x,y,q]=lens(f.x,f.y), al=base*(.35+.65*(1-f.z*.6)), sz=f.s*q;
      if(f.z>.8){c.globalAlpha=Math.min(1,al*1.6); c.drawImage(blob,x-sz*1.8,y-sz*1.8,sz*3.6,sz*3.6); c.globalAlpha=1}
      else{c.fillStyle=`rgba(${ink},${al})`;c.beginPath();c.ellipse(x,y,sz,sz*f.e,f.a,0,6.283);c.fill()}
    }
    // the moon jelly, far off behind the snow
    { const tt=performance.now()/1000, cyc=(tt*.33)%1, b=cyc<.25?Math.sin(cyc/.25*Math.PI/2):Math.cos((cyc-.25)/.75*Math.PI/2);
      if(!still){ jel.x+=jel.vx/30; jel.y-=(.0004+.0016*b)-dy/H*.3; if(jel.x<-.2){jel.x=1.2;jel.y=.4+r()*.4} if(jel.y<-.25) jel.y=1.25; if(jel.y>1.3) jel.y=-.2 }
      const [x,y,q]=lens(jel.x*W,jel.y*H), s=Math.min(W,H)*.22*q;
      jelly(c,x,y,s,still?0:b,tt,L>.35?.05:.09) }
    // sensor noise, very faint
    c.globalAlpha=L>.35?.035:.05; c.fillStyle=c.createPattern(noise[frame++%noise.length],'repeat'); c.fillRect(0,0,W,H); c.globalAlpha=1;
    // a wide-angle lens darkens towards the corners (natural vignetting, roughly cos^4 of the angle off-axis)
    const v=c.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.hypot(W,H)*.5);
    v.addColorStop(0,'rgba(0,4,8,0)'); v.addColorStop(.42,'rgba(0,4,8,.08)'); v.addColorStop(.72,'rgba(0,4,8,.38)'); v.addColorStop(1,'rgba(0,4,8,.78)'); c.fillStyle=v; c.fillRect(0,0,W,H);
    root.style.setProperty('--water',css(mid));
    root.style.setProperty('--water-lum',L.toFixed(3));
    dispatchEvent(new CustomEvent('depth',{detail:{depth,T:t,rgb:mid}}));
  }
  let last=0;
  function loop(ts){
    if(!document.hidden&&ts-last>33){last=ts;draw()}
    requestAnimationFrame(loop);
  }
  addEventListener('resize',()=>{size();draw()});
  if(still) addEventListener('scroll',()=>requestAnimationFrame(draw),{passive:true});
  size(); draw();
  if(!still) requestAnimationFrame(loop);
})();
