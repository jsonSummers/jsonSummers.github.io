/* The home page's backdrop: dark ink moving slowly over pale water, like the deep blacks and silvers of an old
   black-and-white film. Drawn on the GPU into <canvas id="ink">. The ink's shapes come from domain warping (noise
   fed through itself twice), carried by a slow swell so the whole surface rolls in long smooth waves. Colour sits
   underneath and only shows faintly where the ink thins. A little grain and the faintest flicker, as on film.
   With ?bg=diatoms, assets/ink.js draws diatoms instead. */
(function(){
  const cv=document.getElementById('ink'); if(!cv) return;
  if(new URLSearchParams(location.search).get('bg')==='diatoms'){ const s=document.createElement('script'); s.src=document.currentScript.src.replace('foam.js','ink.js'); document.body.appendChild(s); return }
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fallback=()=>{cv.style.background='radial-gradient(120% 90% at 30% 20%,#9a9a96,#262626 55%,#080808)'};

  const VS=`#version 300 es
in vec2 a; void main(){ gl_Position=vec4(a,0.,1.); }`;
  const FS=`#version 300 es
precision highp float;
uniform vec2 res; uniform float t; uniform float scroll; uniform float ocean;
out vec4 o;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*f*(f*(f*6.-15.)+10.);       // quintic: no creases
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y); }
const mat2 R=mat2(.8,.6,-.6,.8);
float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*noise(p); p=R*p*2.02+1.7; a*=.5; } return s; }
void main(){
  vec2 uv=gl_FragCoord.xy/res.y;
  float T=t*.035;
  vec2 p=uv*1.25+vec2(.3,-scroll);
  // the swell: long slow waves rolling through the surface
  p+=.12*vec2(sin(p.y*1.6+T*1.3)+.5*sin(p.y*3.1-T*.9), cos(p.x*1.3-T*1.1)+.5*cos(p.x*2.7+T*.7));
  vec2 q=vec2(fbm(p+T*.4), fbm(p+vec2(5.2,1.3)-T*.3));
  vec2 r=vec2(fbm(p+3.*q+vec2(1.7,9.2)+T*.2), fbm(p+3.*q+vec2(8.3,2.8)-T*.25));
  float f=fbm(p+3.2*r);

  // tone: deep black ink, silver water between, with soft long gradations and fine contour sheen
  float ink=smoothstep(.36,.7,f);
  float v=mix(.78,.035,ink);
  v+=.05*(1.-ink)*(fbm(p*3.+r)-.5);
  v+=.035*smoothstep(.2,.0,abs(ink-.5))*sin(f*38.);           // a faint sheen where the ink's edge thins
  v=pow(clamp(v,0.,1.),1.25);                                  // broodier

  // colour beneath: a slow rainbow, seen only where the ink is thin, and only a little
  vec3 under=.5+.5*cos(6.2831*(vec3(0.,.33,.67)+length(q)*1.2+T*.15));
  float thin=smoothstep(.15,.5,ink)*(1.-smoothstep(.5,.85,ink));
  float where=smoothstep(.5,.75,fbm(uv*.9-T*.1+7.));
  vec3 col=mix(vec3(v),under*(v*.9+.06),thin*where*.32);
  // the ocean variant: the same ink, read as Prussian blue; the pigment's deep dark where the ink is heavy, its
  // bright diluted cyan-blue in the middle tones, pale washed paper where it thins, and the colour beneath
  // leaking through more freely, a little stronger along the ink's edges
  float vig=.75;
  if(ocean>.5){
    vec3 deep=vec3(.0,.075,.19), mid=vec3(.03,.33,.6), foam=vec3(.8,.92,.97);
    vec3 sea=v<.35?mix(deep,mid,pow(v/.35,.8)):mix(mid,foam,(v-.35)/.65);
    vec3 bleed=.5+.5*cos(6.2831*(vec3(.0,.3,.62)+length(q)*1.4+T*.15));
    float w2=smoothstep(.32,.7,fbm(uv*.8-T*.08+3.));
    col=mix(sea,bleed*(v*.75+.18),clamp(thin*.9+.15*(1.-ink),0.,1.)*w2*.6);
    vig=.5;
    // the shore, seen from above: a white beach along the bottom of the window. The ink rolls in towards it as
    // waves, their crests (bent by the ink's own warp) breaking into lines of white foam that thicken as they
    // near the sand; at the waterline the swash runs up the beach and draws back, out of step along the shore,
    // leaving a darker band of wet sand and a lace of foam at its edge
    float yb=gl_FragCoord.y/res.y, xs=gl_FragCoord.x/res.y;
    float cyc=t*.3+xs*.7+2.5*fbm(vec2(xs*1.3,7.))+.6*sin(xs*2.3);
    float run=.5+.5*sin(cyc);                                                   // how far up the swash has run
    float shape=.09*fbm(vec2(xs*.9,3.1))+.025*abs(sin(xs*3.1+fbm(vec2(xs,9.))*2.));   // bays, and the cusps a beach makes
    float wl=.1+shape+.06*run;                                                  // the waterline
    float d=yb-wl;
    float ph=yb*(9.+14.*smoothstep(.6,.0,d))*3.1416-t*.9+3.*(r.x-.5)+2.*(fbm(vec2(xs*2.4,yb*2.-t*.04))-.5);  // wave crests coming in, bunching up near the sand
    float near=smoothstep(.65,.02,d);
    float crest=pow(max(0.,sin(ph)),6.)*near*smoothstep(.3,.6,fbm(p*2.3+vec2(t*.06,0.)))*1.3;
    vec3 foamc=vec3(.9,.96,.98);
    col=mix(col,mix(col,vec3(.16,.55,.66),.5),smoothstep(.18,.0,d)*.6);         // shallows over sand go green-blue
    col=mix(col,foamc,crest);
    float lace=smoothstep(.022,.0,abs(d-.006))*(.55+.45*fbm(vec2(xs*18.,t*.3)));  // the foam at the swash's edge
    vec3 sand=vec3(.95,.95,.93)*(.96+.04*fbm(uv*40.));
    float back=.5+.5*sin(cyc-.9);                                               // where the water has just been
    float wetTo=.1+shape+.06*max(run,back)-.004;
    vec3 wet=mix(sand,vec3(.5,.6,.68),.5);
    vec3 beach=mix(sand,wet,smoothstep(wetTo-.05,wetTo,yb));
    col=mix(col,beach,smoothstep(.004,-.004,d));
    col=mix(col,foamc,lace*.9);
  }

  vec2 c=gl_FragCoord.xy/res-.5; col*=1.-dot(c,c)*vig;            // a vignette, as from an old lens
  col*=.985+.015*sin(t*7.3)*sin(t*3.1);                          // the faintest flicker
  col+=(hash(gl_FragCoord.xy+fract(t*.37)*91.)-.5)*.035;         // grain
  o=vec4(col,1.);
}`;
  function start(){
    const gl=cv.getContext('webgl2',{antialias:false}); if(!gl){fallback(); return}
    const pr=gl.createProgram();
    // where the browser can, the shader compiles in the background; we only check on it between frames
    const par=gl.getExtension('KHR_parallel_shader_compile');
    const vs=gl.createShader(gl.VERTEX_SHADER), fs=gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vs,VS); gl.shaderSource(fs,FS); gl.compileShader(vs); gl.compileShader(fs);
    gl.attachShader(pr,vs); gl.attachShader(pr,fs); gl.linkProgram(pr);
    const ready=()=>!par||gl.getProgramParameter(pr,par.COMPLETION_STATUS_KHR);
    (function wait(){ if(!ready()) return requestAnimationFrame(wait);
      if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){ console.warn('ink shader:',gl.getShaderInfoLog(fs)||gl.getProgramInfoLog(pr)); fallback(); return }
      go() })();
    function go(){
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(pr,'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const U={res:gl.getUniformLocation(pr,'res'),t:gl.getUniformLocation(pr,'t'),scroll:gl.getUniformLocation(pr,'scroll'),ocean:gl.getUniformLocation(pr,'ocean')};
    gl.uniform1f(U.ocean,document.documentElement.dataset.v==='ocean'?1:0);
    // with no graphics card the shader runs on the processor: draw one small still frame and leave it at that
    const info=gl.getExtension('WEBGL_debug_renderer_info'), gpu=info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):'';
    const soft=/swiftshader|llvmpipe|software|basic render/i.test(gpu);
    let quality=soft?.18:1;
    function size(){
      // drawn below screen resolution and scaled up: the image is soft by nature, and it keeps the GPU cool
      const k=Math.min(1,(innerWidth<700?.5:.6)*Math.min(2,devicePixelRatio||1))*quality;
      cv.width=Math.round(cv.clientWidth*k); cv.height=Math.round(cv.clientHeight*k);
      gl.viewport(0,0,cv.width,cv.height); gl.uniform2f(U.res,cv.width,cv.height);
    }
    const t0=performance.now()-90000;
    function frame(ts){ gl.uniform1f(U.t,(ts-t0)/1000); gl.uniform1f(U.scroll,scrollY/innerHeight*.25); gl.drawArrays(gl.TRIANGLES,0,3) }
    // if frames come slowly, halve the resolution; if they are still slow, stop moving and keep the last frame
    let last=0, slow=0, run=true;
    function loop(ts){
      if(!document.hidden&&ts-last>33){ const gap=ts-last; last=ts; frame(ts);
        if(gap>80&&gap<1000){ if(++slow>20){ slow=0; if(quality>.4){quality/=2; size()} else run=false } } else slow=Math.max(0,slow-1) }
      if(run) requestAnimationFrame(loop)
    }
    addEventListener('resize',()=>{size();frame(performance.now())});
    if(still) addEventListener('scroll',()=>requestAnimationFrame(frame),{passive:true});
    size(); frame(still?t0+90000:performance.now()); if(!still&&!soft) requestAnimationFrame(loop);
    }
  }
  // start once the page has painted, so the text appears first
  requestAnimationFrame(()=>setTimeout(start,0));
})();
