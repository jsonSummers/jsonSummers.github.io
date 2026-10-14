/* The Links page's backdrop: a quiet network. Points are scattered evenly (Poisson-disc sampling, so none crowd
   and none leave a hole), and each is joined by a hairline to its nearest neighbours, which makes a sparse mesh
   much like a nervous system or a map of servers. Now and then a point fires: a short pulse runs along a line to a
   neighbour, which lights for a moment and may pass it on to one or two of its own (spreading activation, fading
   as it goes), so signals wander through the mesh and die away. Hovering one of the page's links sends a pulse
   from the margin beside it. Mostly still; a handful of signals at most; not at all with reduced motion.
   Drawn into <canvas id="net">; the mesh is painted once, only the pulses each frame. */
(function(){
  const cv=document.getElementById('net'); if(!cv) return;
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rng(seed){let s=seed>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  const LINE='170,190,212', SIG='150,215,255';
  let W=0,H=0,dpr=1,mesh=null,P=[],N=[],pulses=[],glow=null;
  function build(){
    const r=rng(31), d=W<700?64:86, cell=d/Math.SQRT2, gw=Math.ceil(W/cell)+1, gh=Math.ceil(H/cell)+1, grid=new Int32Array(gw*gh).fill(-1);
    P=[]; const active=[];
    const put=(x,y)=>{P.push([x,y]); grid[Math.floor(y/cell)*gw+Math.floor(x/cell)]=P.length-1; active.push(P.length-1)};
    put(r()*W,r()*H);
    while(active.length){                                                    // Bridson's Poisson-disc sampling
      const k=Math.floor(r()*active.length), [ax,ay]=P[active[k]]; let ok=false;
      for(let t=0;t<20;t++){
        const a=r()*Math.PI*2, m=d*(1+r()), x=ax+Math.cos(a)*m, y=ay+Math.sin(a)*m;
        if(x<-d||y<-d||x>W+d||y>H+d) continue;
        const gx=Math.floor(x/cell), gy=Math.floor(y/cell); let free=true;
        for(let j=gy-2;j<=gy+2&&free;j++) for(let i=gx-2;i<=gx+2;i++){ if(i<0||j<0||i>=gw||j>=gh) continue; const q=grid[j*gw+i]; if(q>=0&&Math.hypot(P[q][0]-x,P[q][1]-y)<d){free=false;break} }
        if(free&&x>=0&&y>=0&&x<W&&y<H){ put(x,y); ok=true; break }
      }
      if(!ok) active.splice(k,1);
    }
    // each point joins its two or three nearest neighbours
    N=P.map(()=>[]); const seen=new Set();
    P.forEach(([x,y],i)=>{
      const near=P.map(([u,v],j)=>[Math.hypot(u-x,v-y),j]).filter(([m,j])=>j!==i&&m<d*1.9).sort((a,b)=>a[0]-b[0]).slice(0,2+(i%3===0?1:0));
      for(const [,j] of near){ const k=i<j?i+'-'+j:j+'-'+i; if(seen.has(k)) continue; seen.add(k); N[i].push(j); N[j].push(i) }
    });
    mesh=document.createElement('canvas'); mesh.width=cv.width; mesh.height=cv.height;
    const c=mesh.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0);
    const g=c.createRadialGradient(W*.5,H*.35,0,W*.5,H*.35,Math.hypot(W,H)*.7); g.addColorStop(0,'#0e1116'); g.addColorStop(1,'#07080a'); c.fillStyle=g; c.fillRect(0,0,W,H);
    c.strokeStyle=`rgba(${LINE},.1)`; c.lineWidth=1; c.beginPath();
    seen.forEach(k=>{ const [i,j]=k.split('-').map(Number); c.moveTo(P[i][0],P[i][1]); c.lineTo(P[j][0],P[j][1]) }); c.stroke();
    c.fillStyle=`rgba(${LINE},.22)`; for(const [x,y] of P){ c.beginPath(); c.arc(x,y,1.3,0,Math.PI*2); c.fill() }
    glow=new Float32Array(P.length); pulses=[];
  }
  function fire(i,energy){ if(!N[i].length||pulses.length>14) return;
    const n=1+(energy>.6&&Math.random()<.5?1:0);
    for(let k=0;k<n;k++){ const j=N[i][Math.floor(Math.random()*N[i].length)]; pulses.push({i,j,t:0,e:energy,len:Math.hypot(P[j][0]-P[i][0],P[j][1]-P[i][1])}) } }
  let last=0, next=0;
  function frame(ts){
    const dt=last?Math.min(.1,(ts-last)/1000):0; last=ts;
    const c=cv.getContext('2d'); c.setTransform(1,0,0,1,0,0); c.drawImage(mesh,0,0); c.setTransform(dpr,0,0,dpr,0,0);
    if(ts>next){ next=ts+1400+Math.random()*2600; fire(Math.floor(Math.random()*P.length),1) }   // a point fires on its own now and then
    c.lineCap='round';
    for(let k=pulses.length-1;k>=0;k--){
      const p=pulses[k]; p.t+=dt*90/p.len;                                     // 90 px a second
      const [x0,y0]=P[p.i], [x1,y1]=P[p.j], a=Math.min(1,p.t), b=Math.max(0,a-22/p.len);
      const g=c.createLinearGradient(x0+(x1-x0)*b,y0+(y1-y0)*b,x0+(x1-x0)*a,y0+(y1-y0)*a);
      g.addColorStop(0,`rgba(${SIG},0)`); g.addColorStop(1,`rgba(${SIG},${(.75*p.e).toFixed(3)})`);
      c.strokeStyle=g; c.lineWidth=1.3; c.beginPath(); c.moveTo(x0+(x1-x0)*b,y0+(y1-y0)*b); c.lineTo(x0+(x1-x0)*a,y0+(y1-y0)*a); c.stroke();
      if(p.t>=1){ pulses.splice(k,1); glow[p.j]=Math.max(glow[p.j],p.e); if(p.e>.25&&Math.random()<.8) fire(p.j,p.e*.72) }
    }
    for(let i=0;i<P.length;i++){ if(glow[i]<.02) continue; glow[i]*=Math.pow(.25,dt);
      const [x,y]=P[i], R=7*glow[i]+2, g=c.createRadialGradient(x,y,0,x,y,R); g.addColorStop(0,`rgba(${SIG},${(.6*glow[i]).toFixed(3)})`); g.addColorStop(1,`rgba(${SIG},0)`);
      c.fillStyle=g; c.beginPath(); c.arc(x,y,R,0,Math.PI*2); c.fill() }
  }
  function loop(ts){ if(!document.hidden&&ts-last>33) frame(ts); requestAnimationFrame(loop) }
  function size(){ dpr=Math.min(2,devicePixelRatio||1); W=cv.clientWidth; H=cv.clientHeight; cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); build(); frame(performance.now()) }
  // hovering a link sends a pulse from the margin beside it
  document.addEventListener('pointerover',e=>{ const a=e.target.closest&&e.target.closest('.links a'); if(!a||still||!P.length) return;
    const y=a.getBoundingClientRect().top+a.offsetHeight/2, side=e.clientX<W/2?0:W; let best=0,bd=1e9;
    P.forEach(([px,py],i)=>{const m=Math.hypot(px-side,py-y); if(m<bd){bd=m;best=i}}); glow[best]=1; fire(best,1) });
  let rt; addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(size,200)});
  requestAnimationFrame(()=>setTimeout(()=>{ size(); if(!still) requestAnimationFrame(loop) },0));
})();
