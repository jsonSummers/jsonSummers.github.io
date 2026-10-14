/* A spore print, after a photographed one. The cap's gills are free (they stop short of the stem, leaving a large
   bare circle) and crowded, with shorter gills between the long ones starting at different distances out. Each
   gill is a thin, crisp line where no spores fell; in places the gills wave, and neighbouring gills wave together,
   as real ones do. Between them the deposit is dense and fine, a little heavier in the middle of each gap, with
   paler patches drawn out along the gills where the cap sat unevenly. The rim is a fringe: each gap's deposit
   ends at its own distance, so the edge is toothed rather than drawn.
   Each pixel is worked out directly (which gill is nearest, how far the deposit reaches there, how dense it is),
   with a fine grain like settled powder. Painted in strips between frames, so the page never waits for it. */
(function(){
  const cv=document.querySelector('canvas.print'); if(!cv) return;
  const root=document.documentElement;
  function rng(seed){let s=seed>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}   // mulberry32
  const fr=x=>x-Math.floor(x), hash=i=>fr(Math.sin(i*12.9898+4.1)*43758.5453);
  const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
  /* value noise that wraps round in x every P cells, so it can run round the print without a seam */
  function noiseP(seed){const T=new Float32Array(4096),r=rng(seed);for(let i=0;i<4096;i++)T[i]=r();
    const h=(x,y)=>T[((x*157)^(y*313))&4095];
    return (x,y,P)=>{const X=Math.floor(x),Y=Math.floor(y),u=sm(0,1,x-X),v=sm(0,1,y-Y),x0=((X%P)+P)%P,x1=(x0+1)%P;
      return (h(x0,Y)*(1-u)+h(x1,Y)*u)*(1-v)+(h(x0,Y+1)*(1-u)+h(x1,Y+1)*u)*v}}
  let job=0;
  function draw(){
    const S=cv.clientWidth; if(!S) return;
    const id=++job, dpr=Math.min(2,(devicePixelRatio||1)*1.25), N=Math.round(S*dpr);
    cv.width=cv.height=N;
    const c=cv.getContext('2d'), r=rng(+cv.dataset.seed||1), TAU=Math.PI*2, nz=noiseP(+cv.dataset.seed||1);
    const ink=root.dataset.v==='ocean'?[236,241,242]:[58,40,28];
    const R=N*.47, cx=N/2, cy=N/2, px=N/800;                           // px: one pixel of the 800-wide design
    // gills: long ones from the bare centre, and one or three short ones in each gap
    const F=160, gills=[];
    for(let i=0;i<F;i++){
      const a=i/F*TAU+(r()-.5)*.006; gills.push({a,start:0,w:r()});
      const n=r()<.28?3:1;
      for(let k=1;k<=n;k++){ const lvl=(n===3&&k!==2)?.66+r()*.12:.42+r()*.12; gills.push({a:a+TAU/F*k/(n+1)+(r()-.5)*.004,start:R*lvl,w:r()}) }
    }
    gills.sort((x,y)=>x.a-y.a);
    const G=gills.length, angs=Float64Array.from(gills,g=>g.a);
    for(const g of gills) g.hw=px*(g.w>.982?2:.36+.42*g.w*g.w*g.w);   // half-width; a few pressed wide
    const harm=Array.from({length:7},(_,k)=>[(r()-.5)*(k<3?.04:.014),r()*TAU]);
    const rim=a=>R*(1+harm.reduce((s,[m,p],k)=>s+m*Math.sin(a*(k+2)+p),0));
    const hole=a=>R*.29*(1+.05*Math.sin(2*a+1.3)+.03*Math.sin(5*a+.4));
    // waviness: how much the gills wave, varying round the print; neighbours share it, so they wave together
    const wav=a=>.0012+.011*sm(.5,.85,nz(a/TAU*9,3.7,9));
    const img=c.createImageData(N,N), d=img.data, top=Math.max(0,Math.floor(cy-R*1.12)), bot=Math.min(N,Math.ceil(cy+R*1.12));
    let y=top;
    function strip(){
      if(id!==job) return;
      const t0=performance.now(), y0=y;
      for(;y<bot&&performance.now()-t0<12;y++) for(let x=0;x<N;x++){
        const dx=x+.5-cx, dy=y+.5-cy, rad=Math.hypot(dx,dy); if(rad>R*1.12) continue;
        let a=Math.atan2(dy,dx); if(a<0) a+=TAU;
        const h0=hole(a); if(rad<h0) continue;
        const u=rad/R, aw=a-wav(a)*Math.sin(u*15+a*2)*u;                    // undo the wave, then find the nearest gill
        let lo=0,hi=G; while(lo<hi){const m=(lo+hi)>>1; if(angs[m]<aw) lo=m+1; else hi=m}
        let best=1e9, gap=1e9;
        for(let k=-4;k<=4;k++){ const g=gills[(lo+k+G)%G]; if(rad<g.start) continue;
          let e=Math.abs(aw-g.a-.0007*Math.sin(u*31+g.w*40)); if(e>Math.PI) e=TAU-e; e*=rad;
          if(e-g.hw<best){best=e-g.hw; gap=e} }
        const edge=rim(a)*(1+.045*(hash(lo)-.5)), fringe=sm(edge,edge-R*(.02+.04*hash(lo+7)),rad);   // each gap ends at its own radius
        if(fringe<=0) continue;
        let dep=sm(h0,h0+R*.07,rad)*fringe*sm(-.55*px,.55*px,best);                                  // bare centre, rim, the gill itself
        dep*=.86+.14*sm(0,2.2*px,best);                                                             // a little heavier mid-gap
        const m=nz(a/TAU*90,u*3.2,90)*.55+nz(a/TAU*180,u*6.4,180)*.3+nz(a/TAU*360,u*12.8,360)*.15;   // paler patches, drawn out along the gills
        dep*=(1-.55*sm(.6,.82,m))*(.9+.1*nz(a/TAU*12,u*2,12));
        dep*=.84+.32*Math.random();                                                                 // the grain of settled spores
        if(dep<=0) continue;
        const o=(y*N+x)*4; d[o]=ink[0]; d[o+1]=ink[1]; d[o+2]=ink[2]; d[o+3]=Math.min(255,dep*246);
      }
      c.putImageData(img,0,0,0,y0,N,y-y0);
      if(y<bot) setTimeout(strip,0);
    }
    requestAnimationFrame(()=>setTimeout(strip,0));
  }
  let t; addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(draw,200)});
  draw();
})();
