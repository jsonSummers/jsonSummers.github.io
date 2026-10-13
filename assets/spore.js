/* A spore print, made of spores. The cap's gills are free (they stop short of the stem, leaving a bare ring) and
   crowded, with shorter gills between the long ones that start at different distances from the rim; each gill is
   thin and very slightly wavy. Spores fall between the gills, so each gap fills with a wedge of dots, heaviest a
   third of the way out and thinning towards a rim that is never quite round. A few spores drift beyond it.
   Drawn into <canvas class="print">: about a million spores, each placed at a random radius drawn from that
   profile and a random angle, kept unless it lands on a gill, and counted into a buffer whose counts become ink
   density. It is laid down in small batches between frames, so the page never waits for it. */
(function(){
  const cv=document.querySelector('canvas.print'); if(!cv) return;
  const root=document.documentElement;
  function rng(seed){let s=seed>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}   // mulberry32
  let job=0;
  function draw(){
    const S=cv.clientWidth; if(!S) return;
    const id=++job, dpr=Math.min(2,(devicePixelRatio||1)*1.25), N=Math.round(S*dpr);
    cv.width=cv.height=N;
    const c=cv.getContext('2d'), r=rng(+cv.dataset.seed||1), TAU=Math.PI*2;
    /* v2 (?print=v2, and the white print of the ocean page) follows a real photographed print: dense, nearly
       solid deposit between the gills; gills of very different widths, a few pressed wide into white streaks;
       a lobed, uneven rim; a ragged bare centre; and a drift of spore dust off one edge */
    const v2=root.dataset.print==='v2'||root.dataset.v==='ocean';
    const ink=root.dataset.v==='ocean'?[236,240,240]:[43,35,30];
    const R=N*.47, free=R*.11, cx=N/2, cy=N/2;
    const F=v2?205:150, gills=[];
    for(let i=0;i<F;i++){
      const a=i/F*TAU+(r()-.5)*.004;
      gills.push({a,start:free*1.02,w:r()});
      const n=r()<.55?3:1;
      for(let k=1;k<=n;k++){ const lvl=(n===3&&k!==2)?.62+r()*.12:.34+r()*.14; gills.push({a:a+TAU/F*k/(n+1)+(r()-.5)*.003,start:R*lvl,w:r()}) }
    }
    gills.sort((x,y)=>x.a-y.a);
    const G=gills.length, angs=Float64Array.from(gills,g=>g.a);
    const rimH=Array.from({length:v2?11:7},(_,k)=>[r()*(v2?(k<4?.03:.012):.018),r()*TAU]), rim=a=>R*(1+rimH.reduce((s,[m,p],k)=>s+m*Math.sin(a*(k+2)+p),0));
    const hub=a=>free*(v2?1+.12*Math.sin(a*3+1)+.07*Math.sin(a*7+2):1);
    const wf=g=>v2?(g.w>.985?2.4:.5+1.15*g.w*g.w*g.w):1;   // how wide each gill presses
    const wave=(g,rad)=>.0025*Math.sin(rad/R*9+g.w*20);
    function gapAt(a,rad){
      let lo=0,hi=G; while(lo<hi){const m=(lo+hi)>>1; if(angs[m]<a) lo=m+1; else hi=m}
      let best=1;
      for(let d=-4;d<=4;d++){const g=gills[(lo+d+G)%G]; if(rad<g.start) continue; let x=Math.abs(a-(g.a+wave(g,rad)))/wf(g); if(x>Math.PI) x=TAU-x; if(x<best) best=x}
      return best*rad;
    }
    // the radial profile, as a table to draw radii from: rising off the bare ring, fullest a third of the way out
    const B=512, cdf=new Float64Array(B+1);
    for(let i=0;i<B;i++){const u=(i+.5)/B, rad=free+(R*1.03-free)*u; const env=Math.min(1,u*5)*Math.exp(-Math.pow(Math.max(0,u-.33)*1.3,2)); cdf[i+1]=cdf[i]+env*rad}
    const radius=()=>{const x=r()*cdf[B]; let lo=0,hi=B; while(lo<hi){const m=(lo+hi)>>1; if(cdf[m+1]<x) lo=m+1; else hi=m} return free+(R*1.03-free)*(lo+r())/B};
    const acc=new Float32Array(N*N), wall=R*.0042, total=Math.round(N*N*(v2?2.6:1.1)), batch=24000;
    const img=c.createImageData(N,N), d=img.data;
    if(v2){                                                                 // spore dust drifting off one edge, in clumps
      const s0=Math.PI*.82+r()*.3;                                         // lower left, clear of the menu
      for(let k=0;k<70;k++){ const a=s0+(r()-.5)*1.3, rad=rim(a)*(1+Math.pow(r(),2)*.09), cl=1+r()*R*.012;
        for(let j=0;j<40;j++){ const x=(cx+Math.cos(a)*rad+(r()-.5)*cl*2)|0, y=(cy+Math.sin(a)*rad+(r()-.5)*cl*2)|0; if(x>0&&y>0&&x<N&&y<N) acc[y*N+x]+=.5+r() } }
    }
    let done=0, steps=0;
    function step(){
      if(id!==job) return;
      const end=Math.min(total,done+batch);
      for(;done<end;done++){
        const a=r()*TAU, rad=radius(), edge=rim(a); if(rad<hub(a)) continue;
        if(rad>edge && r()>.03)continue;                                  // past the rim, only strays
        if(rad>edge*.94 && r()>(edge-rad)/(edge*.06)+.15)continue;          // the rim feathers out
        const gap=gapAt(a,rad); if(gap<wall*(.5+r()*.8))continue;           // none on the gill faces
        const x=cx+Math.cos(a)*rad+(r()-.5)*.7, y=cy+Math.sin(a)*rad*.985+(r()-.5)*.7;
        const xi=x|0, yi=y|0; if(xi<0||yi<0||xi>=N-1||yi>=N-1) continue;
        const fx=x-xi, fy=y-yi, o=yi*N+xi;
        acc[o]+=(1-fx)*(1-fy); acc[o+1]+=fx*(1-fy); acc[o+N]+=(1-fx)*fy; acc[o+N+1]+=fx*fy;
      }
      if(++steps%4===0||done>=total) for(let i=0;i<N*N;i++){ const v=acc[i]; if(!v) continue; d[i*4]=ink[0]; d[i*4+1]=ink[1]; d[i*4+2]=ink[2]; d[i*4+3]=(1-Math.exp(-v*(v2?.9:.6)))*(v2?250:240) }
      if(steps%4===0||done>=total) c.putImageData(img,0,0);
      if(done<total) setTimeout(step,0);
    }
    requestAnimationFrame(()=>setTimeout(step,0));
  }
  let t; addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(draw,200)});
  draw();
})();
