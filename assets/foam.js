/* The home page's backdrop: foam and dark water seen from above, like a fluid pour, drawn on the GPU into
   <canvas id="ink">. The currents come from domain warping (noise fed through itself twice), which folds the
   surface into marbled swirls. Foam laces along the edges between currents (cell borders of a Voronoi pattern
   carried by the same flow) with finer bubbles inside the white. The dark ink carries fine striations; a wet
   gloss comes from the slope of the surface; there is film grain over everything. Mostly black and white, with
   psychedelic colour bleeding out where dark meets foam, in some places and not others. It drifts very slowly,
   and scrolling moves you across it more slowly than the page. With ?bg=diatoms, assets/ink.js draws instead. */
(function(){
  const cv=document.getElementById('ink'); if(!cv) return;
  if(new URLSearchParams(location.search).get('bg')==='diatoms') return;
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl=cv.getContext('webgl2',{antialias:false,premultipliedAlpha:false});
  if(!gl){ cv.style.background='radial-gradient(120% 90% at 30% 20%,#e8e8e6,#2a2c2e 60%,#0c0d0e)'; return }

  const VS=`#version 300 es
in vec2 a; void main(){ gl_Position=vec4(a,0.,1.); }`;
  const FS=`#version 300 es
precision highp float;
uniform vec2 res; uniform float t; uniform float scroll; uniform float seed;
out vec4 o;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
vec2 hash2(vec2 p){ return vec2(hash(p),hash(p+19.19)); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y); }
const mat2 R=mat2(.8,.6,-.6,.8);
float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<6;i++){ s+=a*noise(p); p=R*p*2.03+3.1; a*=.5; } return s; }
vec2 worley(vec2 p){ vec2 i=floor(p), f=fract(p); float d1=8., d2=8.;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g=vec2(x,y), c=g+hash2(i+g)-f; float d=dot(c,c);
    if(d<d1){ d2=d1; d1=d; } else if(d<d2){ d2=d; } }
  return sqrt(vec2(d1,d2)); }
void main(){
  vec2 uv=gl_FragCoord.xy/res.y;
  vec2 p=uv*1.55+vec2(seed,seed*.7)+vec2(0.,-scroll);
  float T=t*.018;
  vec2 q=vec2(fbm(p+vec2(0.,0.)+T), fbm(p+vec2(5.2,1.3)-T));
  vec2 r=vec2(fbm(p+3.6*q+vec2(1.7,9.2)+.15*T), fbm(p+3.6*q+vec2(8.3,2.8)-.12*T));
  float f=fbm(p+3.9*r);

  float ink=smoothstep(.42,.66,f);                                  // 0 = foam and pale water, 1 = dark ink
  float v=mix(.95,.08,ink);
  v-=.07*ink*(.5+.5*sin(f*70.+length(r)*9.));                        // striations in the dark currents
  v+=.05*(1.-ink)*(fbm(p*6.+r*3.)-.5);                               // soft mottling in the pale

  // fine filaments: thin bright and dark threads following the flow through the greys
  float f2=fbm(p*1.7+5.2*r+q);
  float fil=pow(abs(sin(f2*34.)),22.);
  float greys=smoothstep(.2,.45,f)*(1.-smoothstep(.7,.9,f));
  v=mix(v,v>.5?.2:.88,fil*greys*.3);

  // foam lace, dragged by the current: cell borders in coordinates stretched along the flow
  vec2 fl=normalize(r-.5+.001);
  mat2 A=mat2(fl.x,fl.y,-fl.y,fl.x);
  vec2 w=worley(A*(p*vec2(5.5,2.6))+3.4*r+1.5*q);
  float lace=1.-smoothstep(.0,.055+.05*noise(p*9.),w.y-w.x);
  float edgeZone=smoothstep(.3,.5,f)*(1.-smoothstep(.6,.78,f));
  v=mix(v,.97,lace*edgeZone*.8);

  // bubbles: irregular, sparse, only in some patches of foam
  vec2 bq=p*22.+5.*r+2.*q;
  vec2 b=worley(bq+.8*vec2(noise(bq*.3),noise(bq*.3+7.)));
  float clump=smoothstep(.55,.8,fbm(p*2.3+r*2.));
  float bubble=smoothstep(.05,.0,abs(b.x-.28-.12*noise(bq)))*(1.-ink)*clump;
  v=mix(v,.58,bubble*.4);
  float pock=smoothstep(.13,.04,b.x+.08*noise(bq*.7))*smoothstep(.6,.78,f)*(1.-smoothstep(.85,.95,f))*clump;
  v=mix(v,.82,pock*.45);

  // psychedelic colour bleeding out where dark meets foam, under a slow mask so some regions stay black and white
  vec3 pal=.5+.5*cos(6.2831*(vec3(0.,.33,.67)+length(r)*1.5+f*.9+T*.6));
  float mid=1.-abs(ink-.5)*2.;
  float mask=smoothstep(.42,.72,fbm(p*.6-T*.4+11.));
  float bleed=clamp(mid*mask*1.2+lace*edgeZone*mask*.45+fil*greys*mask*.5,0.,1.);
  vec3 col=mix(vec3(v),pal*mix(.25,1.05,v),bleed*.8);

  // a wet gloss from the slope of the surface
  vec2 g=vec2(dFdx(f),dFdy(f))*res.y*.9;
  vec3 n=normalize(vec3(-g,1.));
  float spec=pow(max(dot(reflect(normalize(vec3(-.4,-.5,-1.)),n),vec3(0,0,1)),0.),28.);
  col+=spec*.22*(1.-ink*.4);

  col+=(hash(gl_FragCoord.xy+fract(t)*91.)-.5)*.045;              // film grain
  vec2 c=gl_FragCoord.xy/res-.5; col*=1.-dot(c,c)*.35;               // a little vignette
  o=vec4(col,1.);
}`;
  function sh(type,src){const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s}
  const fallback=()=>{cv.style.background='radial-gradient(120% 90% at 30% 20%,#e8e8e6,#2a2c2e 60%,#0c0d0e)'};
  const pr=gl.createProgram();
  try{ gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS)); gl.linkProgram(pr); if(!gl.getProgramParameter(pr,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr)) }
  catch(e){ console.warn('foam shader:',e.message); fallback(); return }
  gl.useProgram(pr);
  const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const U={res:gl.getUniformLocation(pr,'res'),t:gl.getUniformLocation(pr,'t'),scroll:gl.getUniformLocation(pr,'scroll'),seed:gl.getUniformLocation(pr,'seed')};
  gl.uniform1f(U.seed,3.7);

  let scale=1;
  function size(){
    // drawn below screen resolution and scaled up: the image is soft by nature, and it keeps the GPU cool
    scale=Math.min(1,(innerWidth<700?.55:.7)*Math.min(2,devicePixelRatio||1));
    cv.width=Math.round(cv.clientWidth*scale); cv.height=Math.round(cv.clientHeight*scale);
    gl.viewport(0,0,cv.width,cv.height); gl.uniform2f(U.res,cv.width,cv.height);
  }
  function frame(ts){
    gl.uniform1f(U.t,still?40:ts/1000+40);
    gl.uniform1f(U.scroll,scrollY/innerHeight*.35);                  // the surface moves past more slowly than the page
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  let last=0;
  function loop(ts){ if(!document.hidden&&ts-last>45){last=ts;frame(ts)} requestAnimationFrame(loop) }
  addEventListener('resize',()=>{size();frame(performance.now())});
  if(still) addEventListener('scroll',()=>requestAnimationFrame(frame),{passive:true});
  size(); frame(0); if(!still) requestAnimationFrame(loop);
})();
