/* A spore print, after a photographed one. The cap's gills are free (they stop short of the stem, leaving a large
   bare circle) and crowded, with shorter gills between the long ones starting at different distances out. Each
   gill is a thin, crisp line where no spores fell; in places the gills wave, and neighbouring gills wave together,
   as real ones do. Between them the deposit is dense and fine, a little heavier in the middle of each gap, with
   paler patches drawn out along the gills where the cap sat unevenly. The rim is a fringe: each gap's deposit
   ends at its own distance, so the edge is toothed rather than drawn.
   Each pixel is worked out directly (which gill is nearest, how far the deposit reaches there, how dense it is),
   with smooth gradient noise for the patches and a fine grain like settled powder. It is worked out off the page,
   a little at a time between frames, and shown only when whole, fading in; it is redrawn only when its width
   changes (not when a phone's address bar slides away), and the old one stays up until the new one is ready.
   Where there is a graphics card, the finished print is shown through a tiny shader that lets it breathe and
   sends the faintest ripple out across it; with reduced motion, or without a graphics card, it stays still. */
(function(){
  const cv=document.querySelector('canvas.print'); if(!cv) return;
  const root=document.documentElement, still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rng(seed){let s=seed>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}   // mulberry32
  const fr=x=>x-Math.floor(x), hash=i=>fr(Math.sin(i*12.9898+4.1)*43758.5453);
  const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
  /* gradient (Perlin) noise that wraps round in x every P cells, so it runs round the print without a seam and
     without the blocky steps of value noise */
  function perlinP(seed){
    const r=rng(seed), GX=new Float32Array(1024), GY=new Float32Array(1024);
    for(let i=0;i<1024;i++){const a=r()*Math.PI*2; GX[i]=Math.cos(a); GY[i]=Math.sin(a)}
    const h=(x,y)=>{let k=Math.imul(x,0x27d4eb2d)^Math.imul(y,0x165667b1); k^=k>>>15; k=Math.imul(k,0x85ebca6b); return (k^k>>>13)&1023};
    const f=t=>t*t*t*(t*(t*6-15)+10);
    return (x,y,P)=>{
      const X=Math.floor(x),Y=Math.floor(y),dx=x-X,dy=y-Y,x0=((X%P)+P)%P,x1=(x0+1)%P,u=f(dx),v=f(dy);
      const g=(ix,iy,ax,ay)=>{const k=h(ix,iy);return GX[k]*ax+GY[k]*ay};
      const a=g(x0,Y,dx,dy)+(g(x1,Y,dx-1,dy)-g(x0,Y,dx,dy))*u, b=g(x0,Y+1,dx,dy-1)+(g(x1,Y+1,dx-1,dy-1)-g(x0,Y+1,dx,dy-1))*u;
      return .5+.75*(a+(b-a)*v);
    };
  }
  /* ---- working the print out, into an off-page canvas ---- */
  function render(N,done,cancelled){
    const buf=document.createElement('canvas'); buf.width=buf.height=N;
    const c=buf.getContext('2d'), r=rng(+cv.dataset.seed||1), TAU=Math.PI*2, nz=perlinP(+cv.dataset.seed||1);
    const ink=root.dataset.v==='ocean'?[236,241,242]:[58,40,28];
    const R=N*.47, cx=N/2, cy=N/2, px=N/800;                           // px: one pixel of the 800-wide design
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
    const wav=a=>.0012+.011*sm(.5,.8,nz(a/TAU*9,3.7,9));               // how much the gills wave, round the print
    const img=c.createImageData(N,N), d=img.data, top=Math.max(0,Math.floor(cy-R*1.12)), bot=Math.min(N,Math.ceil(cy+R*1.12));
    let y=top;
    (function strip(){
      if(cancelled()) return;
      const t0=performance.now();
      for(;y<bot&&performance.now()-t0<10;y++) for(let x=0;x<N;x++){
        const dx=x+.5-cx, dy=y+.5-cy, rad=Math.hypot(dx,dy); if(rad>R*1.12) continue;
        let a=Math.atan2(dy,dx); if(a<0) a+=TAU;
        const h0=hole(a); if(rad<h0) continue;
        const u=rad/R, aw=a-wav(a)*Math.sin(u*15+a*2)*u;                    // undo the wave, then find the nearest gill
        let lo=0,hi=G; while(lo<hi){const m=(lo+hi)>>1; if(angs[m]<aw) lo=m+1; else hi=m}
        let best=1e9;
        for(let k=-4;k<=4;k++){ const g=gills[(lo+k+G)%G]; if(rad<g.start) continue;
          let e=Math.abs(aw-g.a-.0007*Math.sin(u*31+g.w*40)); if(e>Math.PI) e=TAU-e; e*=rad;
          if(e-g.hw<best) best=e-g.hw }
        const edge=rim(a)*(1+.045*(hash(lo)-.5)), fringe=sm(edge,edge-R*(.02+.04*hash(lo+7)),rad);   // each gap ends at its own radius
        if(fringe<=0) continue;
        let dep=sm(h0,h0+R*.07,rad)*fringe*sm(-.55*px,.55*px,best);                                  // bare centre, rim, the gill itself
        dep*=.86+.14*sm(0,2.2*px,best);                                                             // a little heavier mid-gap
        const m=nz(a/TAU*90,u*3.2,90)*.6+nz(a/TAU*180,u*6.4,180)*.4;                                // paler patches, drawn out along the gills
        dep*=(1-.42*sm(.38,.86,m))*(.9+.1*nz(a/TAU*12,u*2,12));
        dep*=.86+.28*Math.random();                                                                 // the grain of settled spores
        if(dep<=0) continue;
        const o=(y*N+x)*4; d[o]=ink[0]; d[o+1]=ink[1]; d[o+2]=ink[2]; d[o+3]=Math.min(255,dep*246);
      }
      if(y<bot) return setTimeout(strip,0);
      c.putImageData(img,0,0); done(buf);
    })();
  }
  /* ---- showing it: through a small shader if there is a graphics card, else as a plain picture ---- */
  let gl=null, U=null, run=false;
  function glInit(){
    if(still) return null;
    const probe=document.createElement('canvas').getContext('webgl2'); if(!probe) return null;
    const info=probe.getExtension('WEBGL_debug_renderer_info');
    if(/swiftshader|llvmpipe|software|basic render/i.test(info?probe.getParameter(info.UNMASKED_RENDERER_WEBGL):'')) return null;
    probe.getExtension('WEBGL_lose_context')?.loseContext();
    const g=cv.getContext('webgl2',{premultipliedAlpha:true,antialias:false}); if(!g) return null;
    const sh=(type,src)=>{const s=g.createShader(type);g.shaderSource(s,src);g.compileShader(s);return s};
    const pr=g.createProgram();
    g.attachShader(pr,sh(g.VERTEX_SHADER,`#version 300 es
in vec2 a; void main(){ gl_Position=vec4(a,0.,1.); }`));
    g.attachShader(pr,sh(g.FRAGMENT_SHADER,`#version 300 es
precision highp float;
uniform sampler2D tex; uniform vec2 res; uniform float t;
out vec4 o;
void main(){
  vec2 p=vec2(gl_FragCoord.x,res.y-gl_FragCoord.y)/res-.5; float r=length(p);
  float breathe=1.+.0035*sin(t*.52);                                        // the whole print swells and settles
  float ripple=.0009*sin(r*64.-t*1.1)*smoothstep(.12,.3,r);                 // a faint ring running outwards
  vec2 q=p/breathe+(r>0.?p/r:vec2(0.))*ripple;
  vec4 c=texture(tex,q+.5);
  o=c*(.965+.035*sin(t*.7-r*8.));                                           // and a slow pulse of density
}`));
    g.linkProgram(pr); if(!g.getProgramParameter(pr,g.LINK_STATUS)) return null;
    g.useProgram(pr);
    g.bindBuffer(g.ARRAY_BUFFER,g.createBuffer()); g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),g.STATIC_DRAW);
    const loc=g.getAttribLocation(pr,'a'); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc,2,g.FLOAT,false,0,0);
    g.bindTexture(g.TEXTURE_2D,g.createTexture());
    for(const [k,v] of [[g.TEXTURE_MIN_FILTER,g.LINEAR],[g.TEXTURE_MAG_FILTER,g.LINEAR],[g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE],[g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE]]) g.texParameteri(g.TEXTURE_2D,k,v);
    g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    U={res:g.getUniformLocation(pr,'res'),t:g.getUniformLocation(pr,'t')};
    return g;
  }
  let visible=true, last=0;
  function frame(ts){ gl.viewport(0,0,cv.width,cv.height); gl.uniform2f(U.res,cv.width,cv.height); gl.uniform1f(U.t,ts/1000); gl.drawArrays(gl.TRIANGLES,0,3) }
  function loop(ts){ if(visible&&!document.hidden&&ts-last>40){last=ts; frame(ts)} requestAnimationFrame(loop) }
  function present(buf){
    cv.width=cv.height=buf.width;
    if(gl===null) gl=glInit()||false;
    if(gl){ gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,buf); frame(performance.now()); if(!run){run=true; requestAnimationFrame(loop)} }
    else cv.getContext('2d').drawImage(buf,0,0);
    cv.classList.add('ready');
  }
  if('IntersectionObserver' in window) new IntersectionObserver(e=>{visible=e[0].isIntersecting}).observe(cv);
  let job=0, width=0;
  function draw(){
    const S=cv.clientWidth; if(!S||Math.abs(S-width)<2) return;            // only a change of width redraws it
    width=S; const id=++job;
    render(Math.round(S*Math.min(2,(devicePixelRatio||1)*1.25)),present,()=>id!==job);
  }
  let t; addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(draw,250)});
  draw();
})();
