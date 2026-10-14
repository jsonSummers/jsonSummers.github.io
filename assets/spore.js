/* A spore print, after a photographed one, white on the dark page: a soft stain rather than a drawing.
   The cap's gills are free (they stop short of the stem, leaving a large bare centre with a soft, slightly ragged
   edge) and crowded: about 190 long gills with shorter ones between, so the gaps stay narrow all the way out.
   Spores settle densely between the gills, so the deposit is nearly solid and each gill is left as a fine pale
   line, the spores heaped a little against it. In one or two sectors the gills wave hard (neighbours together);
   elsewhere they run straight. At the rim each gap's deposit runs out as a finger to its own length and narrows
   to a point. A few soft, thinner places are drawn out along the gills, and the stain has its own fine texture.
   Each pixel is worked out directly, off the page, a little at a time between frames; the print is shown only
   when whole, fading in, and redrawn only when its width changes (not when a phone's address bar slides away).
   Where there is a graphics card, it is shown through a tiny shader that lets it breathe and sends the faintest
   ripple out across it; with reduced motion, or without a graphics card, it stays still.
   data-gills, data-gw and data-wave (fewer, wider, calmer gills) make the small version used for the favicon. */
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
    const c=buf.getContext('2d'), seed=+cv.dataset.seed||1, r=rng(seed), TAU=Math.PI*2, nz=perlinP(seed);
    const ink=root.dataset.v==='ocean'?[238,243,245]:[70,44,26];
    const R=N*.47, cx=N/2, cy=N/2, px=N/800, gw=+cv.dataset.gw||1;  // px: one pixel of the 800-wide design; gw widens the gills (the favicon)
    // gills: long ones from the bare centre, and one or three short ones in each gap
    const F=+cv.dataset.gills||190, gills=[];
    for(let i=0;i<F;i++){
      const a=i/F*TAU+(r()-.5)*.25/F*TAU; gills.push({a,start:0,w:r()});
      const n=r()<.15?3:1;
      for(let k=1;k<=n;k++){ const lvl=(n===3&&k!==2)?.7+r()*.12:.45+r()*.15; gills.push({a:a+TAU/F*k/(n+1)+(r()-.5)*.15/F*TAU,start:R*lvl,w:r()}) }
    }
    gills.sort((x,y)=>x.a-y.a);
    const G=gills.length, angs=Float64Array.from(gills,g=>g.a);
    for(const g of gills) g.hw=px*gw*(.42+.38*g.w*g.w);              // half-width of the bare line each gill leaves
    const harm=Array.from({length:6},(_,k)=>[(r()-.5)*(k<2?.045:.016),r()*TAU]);
    const rim=a=>R*(1+harm.reduce((s,[m,p],k)=>s+m*Math.sin(a*(k+2)+p),0));
    const hole=a=>R*.3*(1+.04*Math.sin(2*a+1.3)+.03*Math.sin(3*a+.4)+.05*(nz(a/TAU*10,1.5,10)-.5));
    // waviness: strong in one or two sectors, nearly none elsewhere; the phase drifts slowly round the print,
    // so neighbouring gills wave together, as gills pressed out of line by the cap do
    const wv=cv.dataset.wave?+cv.dataset.wave:1, amp=a=>(.002+.03*sm(.52,.78,nz(a/TAU*5,7.3,5)))*wv, phase=a=>nz(a/TAU*14,2.2,14)*9;
    const img=c.createImageData(N,N), d=img.data, top=Math.max(0,Math.floor(cy-R*1.12)), bot=Math.min(N,Math.ceil(cy+R*1.12));
    let y=top;
    (function strip(){
      if(cancelled()) return;
      const t0=performance.now();
      for(;y<bot&&performance.now()-t0<10;y++) for(let x=0;x<N;x++){
        const dx=x+.5-cx, dy=y+.5-cy, rad=Math.hypot(dx,dy); if(rad>R*1.12) continue;
        let a=Math.atan2(dy,dx); if(a<0) a+=TAU;
        const h0=hole(a); if(rad<h0-R*.006) continue;
        const u=rad/R, ph=phase(a), aw=a-amp(a)*u*(.7*Math.sin(u*26+ph)+.3*Math.sin(u*47+ph*1.7));   // undo the wave
        let lo=0,hi=G; while(lo<hi){const m=(lo+hi)>>1; if(angs[m]<aw) lo=m+1; else hi=m}
        // the rim: each gap's deposit runs out as a finger to its own length, narrowing to a point
        const edge=rim(a)*(1+.05*(hash(lo)-.5)), feather=R*(.015+.035*hash(lo+7)), tip=sm(edge-feather,edge,rad);
        if(tip>=1) continue;
        let best=1e9;
        for(let k=-4;k<=4;k++){ const g=gills[(lo+k+G)%G]; if(rad<g.start) continue;
          let e=Math.abs(aw-g.a); if(e>Math.PI) e=TAU-e; e*=rad;
          const hw=g.hw+tip*tip*.45*Math.PI*rad/G;                                    // gills widen into the gaps at the very edge
          if(e-hw<best) best=e-hw }
        let dep=sm(-.6*px*gw,.6*px*gw,best)*(1-tip);                           // the gill itself: a fine pale line
        dep*=sm(h0-R*.006,h0+R*.012,rad)*(.88+.12*sm(h0,h0+R*.14,rad));          // the bare centre, its edge soft
        dep*=1+.1*Math.exp(-Math.pow(best/(1.4*px*gw),2));                    // spores heap a little against each gill
        const m=nz(a/TAU*40,u*2.4,40)*.6+nz(a/TAU*80,u*4.8,80)*.4;           // a few soft thinner places, drawn out along the gills
        dep*=1-.3*sm(.58,.82,m);
        dep*=.9+.12*nz(x*.35/px,y*.35/px,1e6)+.04*(Math.random()-.5);         // the stain's own fine texture
        if(dep<=0) continue;
        const o=(y*N+x)*4; d[o]=ink[0]; d[o+1]=ink[1]; d[o+2]=ink[2]; d[o+3]=Math.min(255,dep*238);
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
