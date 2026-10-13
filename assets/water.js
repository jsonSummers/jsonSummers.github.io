/* The water around every page. Each page sits at a depth (body data-depth="from,to", in metres) and scrolling
   takes you from the first to the second. The water's colour is sunlight at the surface with each channel
   absorbed at its own rate (Beer-Lambert, coastal water: red goes first, green carries furthest). Marine snow
   drifts past in three layers, the nearest larger and softer, sinking slowly and sliding up as you descend.
   A faint sensor noise and the dark edge of a dome port make it look like it came through a camera.
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

  function rng(seed){let s=seed>>>0||1;return()=>((s=Math.imul(s^s>>>15,1|s)+0x6D2B79F5|0,((s^s>>>14)>>>0)/4294967296))}
  const r=rng(2507);
  let W=0,H=0,dpr=1,flakes=[],noise=[];
  function size(){
    dpr=Math.min(2,devicePixelRatio||1); W=innerWidth; H=innerHeight;
    cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
    const n=Math.round(W*H/5200);
    flakes=Array.from({length:n},()=>{const z=r();return {x:r()*W,y:r()*H,z,s:.5+z*z*3.2,a:r()*Math.PI,e:.4+r()*.6,sink:.04+z*.18,sway:r()*6.28}});
    // a few tiles of sensor noise, cycled so the grain moves without being drawn fresh each frame
    noise=Array.from({length:4},()=>{const t=document.createElement('canvas');t.width=t.height=128;const c=t.getContext('2d'),im=c.createImageData(128,128);
      for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255}c.putImageData(im,0,0);return t});
  }
  let lastY=scrollY, frame=0, depth=D0;
  function draw(){
    const c=cv.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0);
    depth=depthAt(scrollY);
    const t=T(depth), mid=at(SUN,t), top=at(SUN,T(depth-4)), bot=at(SUN,T(depth+8));
    const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,css(top)); g.addColorStop(.55,css(mid)); g.addColorStop(1,css(bot));
    c.fillStyle=g; c.fillRect(0,0,W,H);
    // marine snow: brighter against dark water, faint against bright shallows
    const L=lum(mid), dy=(scrollY-lastY); lastY=scrollY;
    const ink=L>.35?[255,255,255]:[225,235,240], base=L>.35?.28:.5;
    for(const f of flakes){
      if(!still){f.y+=f.sink; f.x+=Math.sin(f.sway+=.004)*.08*f.z}
      f.y-=dy*(.15+f.z*.45);
      if(f.y>H+6){f.y=-6;f.x=r()*W} if(f.y<-6){f.y=H+6;f.x=r()*W}
      const al=base*(.35+.65*(1-f.z*.6));
      if(f.z>.8){const gr=c.createRadialGradient(f.x,f.y,0,f.x,f.y,f.s*1.8);gr.addColorStop(0,`rgba(${ink},${al*.5})`);gr.addColorStop(1,`rgba(${ink},0)`);c.fillStyle=gr;c.beginPath();c.arc(f.x,f.y,f.s*1.8,0,6.283);c.fill()}
      else{c.fillStyle=`rgba(${ink},${al})`;c.beginPath();c.ellipse(f.x,f.y,f.s,f.s*f.e,f.a,0,6.283);c.fill()}
    }
    // sensor noise, very faint
    c.globalAlpha=L>.35?.035:.05; c.fillStyle=c.createPattern(noise[frame++%noise.length],'repeat'); c.fillRect(0,0,W,H); c.globalAlpha=1;
    // the dome port's dark edge
    const v=c.createRadialGradient(W/2,H/2,Math.min(W,H)*.45,W/2,H/2,Math.hypot(W,H)*.6);
    v.addColorStop(0,'rgba(0,4,8,0)'); v.addColorStop(1,'rgba(0,4,8,.35)'); c.fillStyle=v; c.fillRect(0,0,W,H);
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
