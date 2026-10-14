/* The brushstroke swirl, from the first version of the hobby site: short strokes following a flow with a few
   vortices, coloured across the window from persimmon through gold, moss and indigo to wisteria and vermilion,
   on a dark ground. Drawn once, in batches so the page never waits for it.
   Then, where there is a graphics card, the strokes flow very slightly: the painting is shown through a small
   shader that slides it a few pixels along the same flow field it was painted with. Two copies, half a cycle
   apart, take turns (each fades in as the other fades out), so the drift runs on forever without a jump; the
   same trick games use for flowing water. The painting itself is never redrawn; with reduced motion, or
   without a graphics card, it simply stays still. */
(function(){
  const cv=document.getElementById('swirl'); if(!cv) return;
  const PAL=['#e8743b','#d6a14a','#86a35a','#5b77bd','#a07ccb','#d0473c'];
  function rng(seed){let s=seed>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  let job=0;
  function draw(){
    const id=++job, r=rng(57), dpr=Math.min(2,devicePixelRatio||1), W=cv.clientWidth, H=cv.clientHeight;
    cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
    const gl=flow();
    const src=gl?document.createElement('canvas'):cv; if(gl){src.width=cv.width; src.height=cv.height}
    const c=src.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0);
    c.fillStyle='#14120e'; c.fillRect(0,0,W,H);
    const vort=Array.from({length:4},()=>({x:r()*W,y:r()*H*.8,s:(r()<.5?-1:1)*(.6+r()*.8),rad:80+r()*160}));
    const field=(x,y)=>{let a=Math.sin(x*.006+Math.sin(y*.009)*1.6)+Math.cos(y*.005-x*.002)*1.1;
      let vx=Math.cos(a),vy=Math.sin(a)*.6;
      for(const v of vort){const dx=x-v.x,dy=y-v.y,d=Math.hypot(dx,dy)+1,w=Math.exp(-d/v.rad)*2.2*v.s;vx+=-dy/d*w;vy+=dx/d*w}
      const m=Math.hypot(vx,vy)||1;return [vx/m,vy/m]};
    const n=Math.floor(W*H/300); c.lineCap='round';
    let i=0;
    function step(){
      if(id!==job) return;
      for(const end=Math.min(n,i+2500);i<end;i++){
        let x=r()*W,y=r()*H;
        const t=Math.min(.999,Math.max(0,x/W*.75+y/H*.25+(r()-.5)*.35));
        c.strokeStyle=PAL[Math.floor(t*PAL.length)]; c.globalAlpha=.22+r()*.5; c.lineWidth=1.2+r()*3.4;
        c.beginPath(); c.moveTo(x,y);
        const len=5+Math.floor(r()*9);
        for(let k=0;k<len;k++){const [dx,dy]=field(x,y);x+=dx*3.2;y+=dy*3.2;c.lineTo(x,y)}
        c.stroke();
      }
      c.globalAlpha=1;
      if(gl) gl.show(src,vort,dpr);
      if(i<n) setTimeout(step,0);
    }
    requestAnimationFrame(()=>setTimeout(step,0));
  }
  /* the flow: a WebGL2 view of the painting, or null to paint straight onto the page */
  let G=null;
  function flow(){
    if(G!==null) return G;
    G=false;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches) return G;
    const probe=document.createElement('canvas').getContext('webgl2'); if(!probe) return G;       // ask a spare canvas first, so the page's
    const info=probe.getExtension('WEBGL_debug_renderer_info');                                      // own canvas stays free for 2D if not
    if(/swiftshader|llvmpipe|software|basic render/i.test(info?probe.getParameter(info.UNMASKED_RENDERER_WEBGL):'')) return G;
    probe.getExtension('WEBGL_lose_context')?.loseContext();
    const gl=cv.getContext('webgl2',{antialias:false,alpha:false}); if(!gl) return G;
    const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s};
    const pr=gl.createProgram();
    gl.attachShader(pr,sh(gl.VERTEX_SHADER,`#version 300 es
in vec2 a; void main(){ gl_Position=vec4(a,0.,1.); }`));
    gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,`#version 300 es
precision highp float;
uniform sampler2D tex; uniform vec2 res; uniform float dpr, t; uniform vec4 vort[4];
out vec4 o;
vec2 field(vec2 p){                                   // the flow the strokes were painted along (field() in draw())
  float a=sin(p.x*.006+sin(p.y*.009)*1.6)+cos(p.y*.005-p.x*.002)*1.1;
  vec2 v=vec2(cos(a),sin(a)*.6);
  for(int i=0;i<4;i++){ vec2 d=p-vort[i].xy; float l=length(d)+1.; v+=vec2(-d.y,d.x)/l*exp(-l/vort[i].w)*2.2*vort[i].z; }
  return normalize(v);
}
void main(){
  vec2 p=vec2(gl_FragCoord.x,res.y-gl_FragCoord.y)/dpr, v=field(p);
  float A=4.5, p1=fract(t/7.), p2=fract(t/7.+.5);
  vec3 c1=texture(tex,(p-v*(p1-.5)*A)*dpr/res).rgb, c2=texture(tex,(p-v*(p2-.5)*A)*dpr/res).rgb;
  o=vec4(mix(c1,c2,abs(p1-.5)*2.),1.);
}`));
    gl.linkProgram(pr); if(!gl.getProgramParameter(pr,gl.LINK_STATUS)) return G;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(pr,'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const tex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,tex);
    for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D,k,v);
    const U=n=>gl.getUniformLocation(pr,n);
    let ready=false, last=0, slow=0;
    function frame(ts){
      if(!ready) return;
      gl.viewport(0,0,cv.width,cv.height); gl.uniform2f(U('res'),cv.width,cv.height); gl.uniform1f(U('t'),ts/1000);
      gl.drawArrays(gl.TRIANGLES,0,3);
    }
    function loop(ts){
      if(!document.hidden&&ts-last>40){ const gap=ts-last; last=ts; frame(ts); slow=gap>90&&gap<1000?slow+1:Math.max(0,slow-1) }
      if(slow<30) requestAnimationFrame(loop);                                  // a struggling machine keeps the still frame
    }
    G={show(src,vort,dpr){
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
      gl.uniform1f(U('dpr'),dpr); gl.uniform4fv(U('vort'),new Float32Array(vort.flatMap(v=>[v.x,v.y,v.s,v.rad])));
      if(!ready){ ready=true; requestAnimationFrame(loop) } frame(performance.now());
    }};
    return G;
  }
  let t; addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(draw,250)});
  draw();
})();
