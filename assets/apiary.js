/* The Links page as a leaf from a bestiary, after the apiary miniatures of the 13th-15th centuries.
   #vellum (the fixed backdrop) is the page itself: calfskin with its cockle and mottle, hair-follicle dots, the
   pricking and ruling a scribe laid out before writing, darkened and yellowed towards the edges where hands
   turned it, with a water stain's tide line and foxing. #mini is the miniature "De apibus": a frame of gold leaf
   laid over red bole (where the gold has flaked, the bole shows), and inside it, in flat colours outlined in ink,
   a skep banded with herringbone straw, two flowering plants, a strip of ground and a swarm of bees. The pigment
   is worn: small losses show the vellum through. Every line wavers a little, as a pen does. Painted once; nothing
   moves. */
(function(){
  function rng(seed){let s=seed>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  const T=(()=>{const r=rng(11),a=new Float32Array(1024);for(let i=0;i<1024;i++)a[i]=r();return a})();
  const h2=(x,y)=>T[((x*73856093)^(y*19349663))&1023];
  function vnoise(x,y){const X=Math.floor(x),Y=Math.floor(y),u=x-X,v=y-Y,fu=u*u*(3-2*u),fv=v*v*(3-2*v);
    return (h2(X,Y)*(1-fu)+h2(X+1,Y)*fu)*(1-fv)+(h2(X,Y+1)*(1-fu)+h2(X+1,Y+1)*fu)*fv}
  const fbm=(x,y,o)=>{let s=0,a=.5,f=1;for(let i=0;i<o;i++){s+=a*vnoise(x*f,y*f);f*=2.03;a*=.5}return s};
  const INK='#21160c';

  /* ---- the vellum ---- */
  function vellum(cv){
    const W=cv.clientWidth,H=cv.clientHeight; if(!W||!H) return;
    cv.width=W; cv.height=H;
    // the slow, soft fields (cockle, mottle, worn edges, stains) at a quarter of the size, then scaled up smoothly
    const q=4, w=Math.ceil(W/q), h=Math.ceil(H/q), lo=document.createElement('canvas'); lo.width=w; lo.height=h;
    const lx=lo.getContext('2d'), im=lx.createImageData(w,h), d=im.data, r=rng(4);
    const stains=[[W*(.08+r()*.2),H*(.7+r()*.25),Math.min(W,H)*(.12+r()*.08)],[W*(.6+r()*.35),H*(.02+r()*.15),Math.min(W,H)*(.07+r()*.06)]];
    for(let j=0;j<h;j++) for(let i=0;i<w;i++){ const X=i*q, Y0=j*q;
      const ck=fbm(X/260,Y0/260,3)-.5, mo=vnoise(X/38+50,Y0/38)-.5;
      const e=Math.min(X,Y0,W-1-X,H-1-Y0)/Math.min(W,H), edge=1-Math.min(1,e/.16);
      let L=1+.07*ck+.035*mo-.2*edge*edge, Yl=.5*edge*edge+.15*Math.max(0,ck);
      for(const [sx,sy,sr] of stains) if(Math.hypot(X-sx,Y0-sy)<sr*(.85+.3*fbm(X/60,Y0/60,2))){ L-=.018; Yl+=.16 }
      const k=(j*w+i)*4; d[k]=Math.min(255,(238-10*Yl)*L); d[k+1]=Math.min(255,(226-22*Yl)*L); d[k+2]=Math.min(255,(194-42*Yl)*L); d[k+3]=255 }
    lx.putImageData(im,0,0); const x=cv.getContext('2d'); x.imageSmoothingQuality='high'; x.drawImage(lo,0,0,W,H);
    // the tide lines of the stains, drawn at full size
    for(const [sx,sy,sr] of stains){ x.beginPath(); for(let a=0;a<=6.3;a+=.03){ const px=sx+Math.cos(a)*sr, py=sy+Math.sin(a)*sr, m=sr*(.85+.3*fbm(px/60,py/60,2)), qx=sx+Math.cos(a)*m, qy=sy+Math.sin(a)*m; a?x.lineTo(qx,qy):x.moveTo(qx,qy) }
      x.strokeStyle='rgba(120,85,45,.16)'; x.lineWidth=2.2; x.stroke() }
    // the grain: a small tile of noise repeated
    const gt=document.createElement('canvas'); gt.width=gt.height=128; const gx=gt.getContext('2d'), gi=gx.createImageData(128,128);
    for(let k=0;k<gi.data.length;k+=4){ const v=Math.random(); gi.data[k]=gi.data[k+1]=gi.data[k+2]=v<.5?60:255; gi.data[k+3]=Math.abs(v-.5)*26 }
    gx.putImageData(gi,0,0); x.fillStyle=x.createPattern(gt,'repeat'); x.fillRect(0,0,W,H);
    for(let n=0;n<W*H/2600;n++){ x.fillStyle=`rgba(110,80,50,${.12+r()*.18})`; x.beginPath(); x.arc(r()*W,r()*H,.5+r()*.7,0,6.3); x.fill() }   // hair follicles
    for(let c=0;c<5;c++){ const fx=r()*W,fy=r()*H; for(let n=0;n<14;n++){ x.fillStyle=`rgba(150,95,45,${.1+r()*.25})`;                     // foxing
      x.beginPath(); x.arc(fx+(r()-.5)*70,fy+(r()-.5)*50,.8+r()*3.2,0,6.3); x.fill() } }
    for(let n=0;n<3;n++){ const wx=r()*W,wy=r()*H; x.fillStyle='rgba(60,38,18,.75)'; x.beginPath(); x.ellipse(wx,wy,1.6,1.2,r()*3,0,6.3); x.fill() }  // worm holes
    // pricking and ruling for the text block
    const wide=W>1100, l=wide?Math.max(24,(W-980)/2+40):18, rr=wide?l+900:W-18, step=30;
    x.strokeStyle='rgba(140,100,60,.16)'; x.lineWidth=.7;
    for(let y=150;y<H-40;y+=step){ x.beginPath(); x.moveTo(l,y); x.lineTo(rr,y); x.stroke(); x.fillStyle='rgba(110,70,40,.4)'; x.fillRect(l-12,y-.8,1.6,1.6) }
    for(const xx of [l,rr]){ x.beginPath(); x.moveTo(xx,120); x.lineTo(xx,H-30); x.stroke() }
  }

  /* ---- pen lines: every path is subdivided and wavered by a smooth noise ---- */
  let S=1;
  function waver(pts,amp,closed){ const out=[]; const n=pts.length;
    for(let i=0;i<(closed?n:n-1);i++){ const [ax,ay]=pts[i],[bx,by]=pts[(i+1)%n], L=Math.hypot(bx-ax,by-ay), m=Math.max(1,Math.round(L/(6*S)));
      for(let k=0;k<m;k++){ const t=k/m, px=ax+(bx-ax)*t, py=ay+(by-ay)*t; out.push([px+(vnoise(px*.04,py*.04)-.5)*amp*S,py+(vnoise(px*.04+9,py*.04)-.5)*amp*S]) } }
    if(!closed) out.push(pts[n-1]); return out }
  function trace(x,pts,closed){ x.beginPath(); x.moveTo(pts[0][0],pts[0][1]); for(const p of pts.slice(1)) x.lineTo(p[0],p[1]); if(closed) x.closePath() }
  function ink(x,w){ x.strokeStyle=INK; x.lineWidth=w*S; x.lineJoin='round'; x.lineCap='round'; x.stroke() }
  function curve(f,a,b,n){ const p=[]; for(let i=0;i<=n;i++) p.push(f(a+(b-a)*i/n)); return p }
  const almond=(cx,cy,l,w,a)=>curve(t=>{ const u=Math.cos(t)*l/2, v=Math.sin(t)*w/2*Math.abs(Math.cos(t/2)+.25); return [cx+u*Math.cos(a)-v*Math.sin(a),cy+u*Math.sin(a)+v*Math.cos(a)] },0,6.283,28);

  /* ---- the miniature ---- */
  function mini(cv){
    const dpr=Math.min(2,devicePixelRatio||1), w=cv.clientWidth, h=cv.clientHeight; if(!w||!h) return;
    cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
    const x=cv.getContext('2d'); x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,w,h); S=Math.min(w/460,h/560); const r=rng(23);
    const wide=w/h>1.15;                                                        // the landscape miniature, with a wider garden
    // the frame: a band of gold, notched at the top left where a painted initial would sit
    const t=15*S, o=3*S, nw=w*.34, nd=h*.15;
    const outer=waver([[o,o+nd],[o+nw,o+nd],[o+nw,o],[w-o,o],[w-o,h-o],[o,h-o]],1.6,true);
    const inner=waver([[o+t,o+nd+t],[o+nw+t,o+nd+t],[o+nw+t,o+t],[w-o-t,o+t],[w-o-t,h-o-t],[o+t,h-o-t]],1.6,true);
    const band=new Path2D(), inside=new Path2D();
    for(const [P,path] of [[outer,band],[inner,band],[inner,inside]]){ path.moveTo(P[0][0],P[0][1]); for(const p of P.slice(1)) path.lineTo(p[0],p[1]); path.closePath() }
    x.save(); x.clip(band,'evenodd');
    x.fillStyle='#8a3c22'; x.fillRect(0,0,w,h);                                                // the red bole
    const g=x.createLinearGradient(0,0,w,h); [['#b98a2e',0],['#e9cc6c',.18],['#a97c25',.36],['#dcb453',.55],['#b48729',.75],['#ecd27a',.9],['#b07f26',1]].forEach(([c,s])=>g.addColorStop(s,c));
    x.fillStyle=g; x.fillRect(0,0,w,h);
    for(let i=0;i<w*h/90;i++){ x.fillStyle=r()<.6?`rgba(255,240,180,${r()*.35})`:`rgba(110,70,20,${r()*.3})`; x.fillRect(r()*w,r()*h,1+r()*1.5,1+r()*1.5) }  // burnish and wear
    for(let i=0;i<26;i++){ const px=r()*w,py=r()*h; x.fillStyle='#8a3c22'; trace(x,almond(px,py,(3+r()*9)*S,(2+r()*4)*S,r()*3),true); x.fill() }    // flakes of gold lost to the bole
    x.restore();
    trace(x,outer,true); ink(x,1.7); trace(x,inner,true); ink(x,1.4);
    x.save(); x.translate(0,0); trace(x,waver([[o+t+4*S,o+nd+t+4*S],[o+nw+t+4*S,o+nd+t+4*S],[o+nw+t+4*S,o+t+4*S],[w-o-t-4*S,o+t+4*S],[w-o-t-4*S,h-o-t-4*S],[o+t+4*S,h-o-t-4*S]],1,true),true); x.strokeStyle='rgba(176,64,42,.7)'; x.lineWidth=1*S; x.stroke(); x.restore();
    x.save(); x.clip(inside);
    const gy=h-o-t-26*S;                                                        // the ground line
    // the ground: a strip of green with trefoils of white and red
    const ga=u=>gy+Math.sin(u/w*9)*4*S+(vnoise(u*.02,3)-.5)*8*S;               // the ground's top edge at u
    const ground=waver(curve(u=>[u,ga(u)],0,w,30).concat([[w,h],[0,h]]),1,true);
    trace(x,ground,true); x.fillStyle='#7e9c55'; x.fill(); ink(x,1.3);
    for(let i=0;i<22;i++){ const fx=t+r()*(w-2*t), fy=gy+8*S+r()*14*S, c=r()<.6?'#f4ecd6':'#b4432c';
      for(let k=0;k<3;k++){ x.fillStyle=c; x.beginPath(); x.arc(fx+Math.cos(k*2.1)*2*S,fy+Math.sin(k*2.1)*2*S,1.3*S,0,6.3); x.fill() } }
    // the skep: a tall bell of straw rope, painted green as in the Aberdeen-style bestiaries, banded with herringbone
    const sx=wide?w*.62:w*.7, sw=Math.min(w*.19,h*.16), sh=h*.5, sb=gy+6*S;
    const prof=v=>sw*Math.pow(Math.max(0,1-Math.pow(v,3.2)),.5)*(1+.04*(1-v));
    const side=curve(v=>[sx+prof(v),sb-v*sh],0,1,24), skep=waver(side.concat(side.slice().reverse().map(([px,py])=>[2*sx-px,py])),1.2,true);
    const sp=new Path2D(); sp.moveTo(skep[0][0],skep[0][1]); for(const p of skep.slice(1)) sp.lineTo(p[0],p[1]); sp.closePath();
    x.save(); x.clip(sp);
    x.fillStyle='#6f9a58'; x.fillRect(sx-sw-4,sb-sh-4,sw*2+8,sh+8);
    const sg=x.createLinearGradient(sx-sw,0,sx+sw,0); sg.addColorStop(0,'rgba(220,240,190,.25)'); sg.addColorStop(.4,'rgba(0,0,0,0)'); sg.addColorStop(1,'rgba(20,50,20,.45)'); x.fillStyle=sg; x.fillRect(sx-sw-4,sb-sh-4,sw*2+8,sh+8);
    const nb=10, bh=sh/nb;
    for(let i=0;i<nb;i++){ const y0=sb-i*bh, dir=i%2?1:-1;
      x.strokeStyle='rgba(34,70,30,.8)'; x.lineWidth=1.1*S;
      for(let u=sx-sw;u<sx+sw;u+=5*S){ trace(x,waver([[u,y0-bh*.15],[u+dir*bh*.45,y0-bh*.85]],.8,false),false); x.stroke() }
      trace(x,waver([[sx-sw-2,y0-bh],[sx,y0-bh+3*S],[sx+sw+2,y0-bh]],1,false),false); ink(x,1) }
    for(let i=0;i<nb;i++){ const y0=sb-i*bh-bh*.5, v=(sb-y0)/sh, px=sx-prof(v)*.72;
      trace(x,waver([[px,y0-bh*.3],[px+4*S,y0+bh*.25]],.5,false),false); x.strokeStyle='rgba(250,252,235,.75)'; x.lineWidth=1.6*S; x.stroke() }
    x.restore();
    trace(x,skep,true); ink(x,1.6);
    const kn=waver(curve(a=>[sx+Math.cos(a)*7*S,sb-sh+1*S+Math.sin(a)*6*S],Math.PI,2*Math.PI,10).concat([[sx+7*S,sb-sh+2*S]]),.6,true);
    trace(x,kn,true); x.fillStyle='#6f9a58'; x.fill(); ink(x,1.3);                                   // the knob at the crown
    const ent=waver(curve(a=>[sx-sw*.25+Math.cos(a)*7*S,sb-4*S+Math.sin(a)*9*S],Math.PI,2*Math.PI,10).concat([[sx-sw*.25+7*S,sb],[sx-sw*.25-7*S,sb]]),.5,true);
    trace(x,ent,true); x.fillStyle='#2a1c10'; x.fill();
    // the plants: a tree of stacked leaves, and a flowering stem
    function stem(px,top,bend){ const g0=ga(px)+3*S, p=waver(curve(v=>[px+Math.sin(v*2.4)*bend*S,g0-v*(g0-top)],0,1,10),1,false); trace(x,p,false); x.strokeStyle='#5c7d3c'; x.lineWidth=3*S; x.stroke(); trace(x,p,false); ink(x,.9); return p }
    const TX=wide?w*.19:w*.21, boxes=[];                                       // where the plants stand (bees keep out of them)
    // a white mound at the tree's foot, as the plants in the bestiary grow from
    const mound=waver(curve(a=>[TX+Math.cos(a)*55*S,gy+4*S+Math.sin(a)*16*S],Math.PI,2*Math.PI,16),1.2,true);
    trace(x,mound,true); x.fillStyle='#efe8d6'; x.fill(); ink(x,1.2);
    for(let i=0;i<4;i++){ trace(x,waver([[TX-38*S+i*24*S,gy-2*S],[TX-34*S+i*24*S,gy-8*S]],.6,false),false); x.strokeStyle='rgba(60,45,30,.5)'; x.lineWidth=.9*S; x.stroke() }
    // the tree: a stem with leaves stacked up it into a flame, as in the first bestiary miniatures
    const tp=stem(TX,h*.26,3);
    for(let i=0;i<26;i++){ const v=.18+i/26*.82, [px,py]=tp[Math.round(v*(tp.length-1))], s=i%2?1:-1, env=Math.sin(Math.min(1,v*1.15)*Math.PI)*.8+.25;
      const a=-Math.PI/2+s*(.35+.75*env*(1-v*.4)), L=(22+26*env)*S, lf=almond(px+Math.cos(a)*L*.42,py+Math.sin(a)*L*.42,L,L*.5,a);
      trace(x,lf,true); x.fillStyle=['#8fb26a','#7da45b','#9cbd76'][i%3]; x.fill(); ink(x,1.1);
      trace(x,[[px,py],[px+Math.cos(a)*L*.8,py+Math.sin(a)*L*.8]],false); x.strokeStyle='rgba(40,70,30,.7)'; x.lineWidth=.8*S; x.stroke();
      trace(x,[[px+Math.cos(a)*L*.25-Math.sin(a)*2*S,py+Math.sin(a)*L*.25+Math.cos(a)*2*S],[px+Math.cos(a)*L*.6-Math.sin(a)*3*S,py+Math.sin(a)*L*.6+Math.cos(a)*3*S]],false); x.strokeStyle='rgba(255,255,240,.55)'; x.lineWidth=1*S; x.stroke() }
    const top=almond(tp[tp.length-1][0],tp[tp.length-1][1]-10*S,24*S,12*S,-Math.PI/2); trace(x,top,true); x.fillStyle='#8fb26a'; x.fill(); ink(x,1.1);
    // the flowering stems: rosettes of red-brown petals with gold hearts
    function flowers(px,topy,bend,n,col){ const fp=stem(px,topy,bend);
      for(let i=0;i<n;i++){ const v=.3+i*(.7/n), [qx,qy]=fp[Math.round(Math.min(1,v)*(fp.length-1))], s=i%2?1:-1, fx=qx+s*13*S, fy=qy-5*S;
        trace(x,[[qx,qy],[fx,fy]],false); x.strokeStyle='#5c7d3c'; x.lineWidth=1.8*S; x.stroke();
        const lf=almond(qx+s*5*S,qy+6*S,12*S,5*S,s>0?.5:Math.PI-.5); trace(x,lf,true); x.fillStyle='#8fb26a'; x.fill(); ink(x,.8);
        for(let k=0;k<5;k++){ const a=k/5*6.283+i; trace(x,almond(fx+Math.cos(a)*5.5*S,fy+Math.sin(a)*5.5*S,11*S,7*S,a),true); x.fillStyle=col; x.fill(); ink(x,.9) }
        x.fillStyle='#e0b24a'; x.beginPath(); x.arc(fx,fy,2.6*S,0,6.3); x.fill(); ink(x,.7) } }
    // lavender: a clump of thin grey-green stems, each topped with a spike of violet buds in pairs
    function lavender(px,topy,n){ boxes.push([px-26*S,px+26*S,topy]);
      const g0=ga(px)+3*S;
      for(let i=0;i<5;i++){ const a=-Math.PI/2+(i-2)*.5; trace(x,almond(px+Math.cos(a)*10*S,g0-3*S+Math.sin(a)*10*S,24*S,3.5*S,a),true); x.fillStyle='#93a487'; x.fill(); ink(x,.7) }
      for(let i=0;i<n;i++){ const f=(i-(n-1)/2)/((n-1)/2||1), tx=px+f*22*S, ty=topy+Math.abs(f)*14*S+(i%2)*6*S;
        const p=waver([[px+f*3*S,g0],[(px+tx)/2+f*4*S,(g0+ty)/2],[tx,ty]],.6,false); trace(x,p,false); x.strokeStyle='#7d9070'; x.lineWidth=1.6*S; x.stroke(); trace(x,p,false); ink(x,.5);
        for(let k=0;k<7;k++){ const by=ty+k*4.2*S, sz=(1-k/9)*S;
          for(const sd of [-1,1]){ trace(x,almond(tx+sd*2.3*sz,by,6*sz,3.6*sz,-Math.PI/2+sd*.5),true); x.fillStyle=k%2?'#8a74b8':'#7461a6'; x.fill(); ink(x,.55) } } } }
    // a stalk drawn as illuminators drew them: an ink edge, the colour inside, a fine white highlight along one side;
    // ends left square, as the stalks in the Luttrell Psalter stop short
    function tube(P,wd,col,hi){ x.lineJoin='round'; x.lineCap='butt';
      trace(x,P,false); x.strokeStyle=INK; x.lineWidth=(wd+1.8)*S; x.stroke(); trace(x,P,false); x.strokeStyle=col; x.lineWidth=wd*S; x.stroke();
      if(hi){ const Q=P.map((p,i)=>{ const q=P[Math.min(P.length-1,i+1)], o=P[Math.max(0,i-1)], dx=q[0]-o[0], dy=q[1]-o[1], l=Math.hypot(dx,dy)||1; return [p[0]-dy/l*wd*.22*S,p[1]+dx/l*wd*.22*S] });
        trace(x,Q.slice(1,-1),false); x.strokeStyle=hi; x.lineWidth=.9*S; x.stroke() } x.lineCap='round' }
    // a Luttrell bud: a green cup of three sepals holding a round head, orange above and white below
    function bud(bx,by,a,sz){ x.save(); x.translate(bx,by); x.rotate(a+Math.PI/2); x.scale(sz*S,sz*S);
      x.beginPath(); x.ellipse(0,-8.4,4.8,4.6,0,0,6.3); x.fillStyle='#f2ead4'; x.fill();
      x.save(); x.clip(); x.fillStyle='#e0874a'; x.fillRect(-6,-14,12,5.8); x.restore(); x.strokeStyle=INK; x.lineWidth=.8/sz; x.stroke();
      x.beginPath(); x.moveTo(-5.2,-4.6); x.lineTo(-3.6,-8.2); x.lineTo(-1.8,-5.2); x.lineTo(0,-8.8); x.lineTo(1.8,-5.2); x.lineTo(3.6,-8.2); x.lineTo(5.2,-4.6); x.quadraticCurveTo(4.4,1.6,0,2); x.quadraticCurveTo(-4.4,1.6,-5.2,-4.6);
      x.fillStyle='#4f9a72'; x.fill(); x.stroke(); x.restore() }
    // after the Luttrell Psalter: a blue stem that rises and curls into a spiral, buds on short stalks, some stalks cut short
    function luttrell(px,topy){ const R=44*S, g0=ga(px)+3*S, cx=px+R, cy=topy+R; boxes.push([px-30*S,px+2*R+30*S,topy-10*S]);
      const sp=curve(th=>{ const r=R*(1-.62*(th-Math.PI)/(2.3*Math.PI)); return [cx+Math.cos(th)*r,cy+Math.sin(th)*r] },Math.PI,3.3*Math.PI,60);
      const stem=waver(curve(v=>[px+6*S*Math.sin(v*3)-6*S*v,g0-v*(g0-cy)],0,1,14),.5,false);
      const all=stem.concat(sp);
      const at=th=>{ const r=R*(1-.62*(th-Math.PI)/(2.3*Math.PI)); return [cx+Math.cos(th)*r,cy+Math.sin(th)*r,r] };
      const branches=[];
      for(const [th,len,out,cut] of [[1.25,34,1,0],[1.7,36,1,0],[2.15,30,1,1],[2.55,34,1,0],[2.3,24,-1,0],[2.95,16,-1,0]]){
        const [bx,by]=at(th*Math.PI), n=out*1, ox=Math.cos(th*Math.PI)*n, oy=Math.sin(th*Math.PI)*n, tx=-Math.sin(th*Math.PI), ty=Math.cos(th*Math.PI);
        const ex=bx+(ox*.8+tx*.5)*len*S, ey=by+(oy*.8+ty*.5)*len*S;
        branches.push([waver([[bx,by],[bx+(ox*.6+tx*.2)*len*.55*S,by+(oy*.6+ty*.2)*len*.55*S],[ex,ey]],.4,false),cut,Math.atan2(ey-by,ex-bx)]) }
      for(const [v,sd,len,cut] of [[.28,-1,40,0],[.5,1,36,0],[.7,-1,26,1],[.38,1,22,1],[.62,-1,34,0]]){
        const [bx,by]=stem[Math.round(v*(stem.length-1))], ex=bx+sd*len*S, ey=by-len*.55*S;
        branches.push([waver([[bx,by],[bx+sd*len*.5*S,by-len*.05*S],[ex,ey]],.4,false),cut,Math.atan2(ey-by,ex-bx)]) }
      for(const [P] of branches) tube(P,3.6,'#2f4f9a','rgba(235,240,255,.85)');
      tube(all,6,'#2f4f9a','rgba(235,240,255,.9)');
      for(const [P,cut,a] of branches) if(!cut){ const [ex,ey]=P[P.length-1]; bud(ex+Math.cos(a)*7*S,ey+Math.sin(a)*7*S,a,1.75) } }
    // after the Voynich plant on folio 46v: big saw-toothed leaves at the foot, a pale forking stalk, aster heads
    // (a dark blue cup under a fringe of cream petals) at the ends, and a stalk or two cut short
    function voynich(px,topy){ const g0=ga(px)+3*S; boxes.push([px-80*S,px+80*S,topy-20*S]);
      for(const [a,L,c] of [[-2.6,84,'#5d9e88'],[-.55,80,'#6aa894'],[-1.95,60,'#57937e'],[-1.2,56,'#62a28c']]){                       // the leaves
        const dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx, pts=[];
        for(let i=0;i<=20;i++){ const u=i/20, ww=Math.sin(Math.PI*u)**.8*L*.22*S*(i%2?1.12:.88); pts.push([px+dx*L*S*u+nx*ww,g0-4*S+dy*L*S*u+ny*ww]) }
        for(let i=20;i>=0;i--){ const u=i/20, ww=Math.sin(Math.PI*u)**.8*L*.22*S*(i%2?1.12:.88); pts.push([px+dx*L*S*u-nx*ww,g0-4*S+dy*L*S*u-ny*ww]) }
        trace(x,waver(pts,.4,true),true); x.fillStyle=c; x.fill(); ink(x,.9);
        for(let k=0;k<7;k++){ const u=.15+k*.11; x.beginPath(); x.moveTo(px+dx*L*S*u,g0-4*S+dy*L*S*u); x.lineTo(px+dx*L*S*(u+.08)+nx*L*.12*S*(k%2?1:-1),g0-4*S+dy*L*S*(u+.08)+ny*L*.12*S*(k%2?1:-1)); x.strokeStyle='rgba(30,70,55,.6)'; x.lineWidth=.8*S; x.stroke() } }
      const qc=(a,c,b)=>curve(u=>[(1-u)*(1-u)*a[0]+2*u*(1-u)*c[0]+u*u*b[0],(1-u)*(1-u)*a[1]+2*u*(1-u)*c[1]+u*u*b[1]],0,1,14);   // smooth arcs, as the Voynich stalks bend
      const fy=g0-(g0-topy)*.42, st=waver([[px,g0],[px+2*S,(g0+fy)/2],[px,fy]],.4,false);
      const arms=[]; const arm=(P)=>{ arms.push(P); return P[P.length-1] };
      const L1=arm(qc([px,fy],[px-46*S,fy-2*S],[px-52*S,fy-40*S])), R1=arm(qc([px,fy],[px+44*S,fy-4*S],[px+50*S,fy-44*S]));
      const heads=[];
      const fork=(o,a,l)=>{ const e=[o[0]+Math.cos(a)*l*S,o[1]+Math.sin(a)*l*S]; arm(qc(o,[(o[0]+e[0])/2+Math.sin(a)*7*S,(o[1]+e[1])/2-Math.cos(a)*7*S],e)); heads.push([e,a]); return e };
      const A0=arms[0], A1=arms[1];                                              // heads branch off along each arm, not all at its end
      fork(A0[5],-2.0,26); fork(A0[10],-2.75,28); fork(L1,-1.75,24); fork(A1[5],-1.15,26); fork(A1[10],-.4,28); fork(R1,-1.4,24);
      fork([px,fy-6*S],-1.57,Math.max(30,(fy-topy)/S-10));
      arm(waver([[px-5*S,fy+6*S],[px-16*S,fy-2*S]],.3,false));                                                   // stalks cut short
      arm(waver([[R1[0]-6*S,R1[1]+12*S],[R1[0]+4*S,R1[1]+16*S]],.3,false));
      for(const P of [st,...arms]) tube(P,3.4,'#cdb88e','rgba(255,250,235,.7)');
      for(const [[hx,hy],a] of heads){ x.save(); x.translate(hx,hy); x.rotate(a+Math.PI/2); const k=1.75*S;
        x.beginPath(); x.moveTo(-6.6*k,-2*k);                                                  // the petals: one crown of points
        for(let i=0;i<9;i++){ const t=(i/8-.5)*2.3; x.lineTo(Math.sin(t)*9*k,-7.2*k+Math.abs(Math.sin(t))*2*k); if(i<8){ const t2=t+1.15/8; x.lineTo(Math.sin(t2)*6.8*k,-3.8*k) } }
        x.lineTo(6.6*k,-2*k); x.closePath(); x.fillStyle='#f3e8c6'; x.fill(); x.strokeStyle=INK; x.lineWidth=.45*k; x.stroke();                                              // the petals
        x.beginPath(); x.ellipse(0,-2.6*k,6.4*k,2.2*k,0,0,6.3); x.fillStyle='#d9b24a'; x.fill(); x.stroke();
        for(let i=0;i<7;i++){ x.fillStyle='#8a6a20'; x.beginPath(); x.arc((i-3)*1.6*k,-2.8*k+(i%2)*.8*k,.5*k,0,6.3); x.fill() }
        x.beginPath(); x.moveTo(-7*k,-2*k); x.quadraticCurveTo(-6.5*k,5*k,0,5.5*k); x.quadraticCurveTo(6.5*k,5*k,7*k,-2*k); x.closePath();             // the blue cup
        const cg=x.createLinearGradient(0,-2*k,0,5.5*k); cg.addColorStop(0,'#5b7fb4'); cg.addColorStop(1,'#2c4677'); x.fillStyle=cg; x.fill(); x.lineWidth=.9*k; x.stroke();
        x.strokeStyle='rgba(20,30,60,.6)'; x.lineWidth=.5*k; for(let i=-2;i<=2;i++){ x.beginPath(); x.moveTo(i*2.4*k,-1.6*k); x.lineTo(i*1.6*k,4.6*k); x.stroke() }
        x.restore() } }
    function flowersB(px,topy,bend,n,col){ boxes.push([px-22*S,px+22*S,topy]); flowers(px,topy,bend,n,col) }
    if(wide){ lavender(w*.065,h*.58,7); voynich(w*.365,h*.55);
      lavender(w*.775,h*.6,6); luttrell(w*.845,h*.52) }
    else { flowersB(w*.4,h*.44,-5,5,'#a8553a'); lavender(w*.075,h*.6,5) }
    boxes.push([TX-60*S,TX+60*S,h*.24]);
    // the bees, flying in from the flowers towards the hive
    const links=[...document.querySelectorAll('.bee')].map(e=>{ const c=getComputedStyle(e); return [parseFloat(c.left),parseFloat(c.top)] });   // the link bees (in the page) take these places
    const keep=[]; let tries=0;
    while(keep.length<8&&tries++<1200){ const bx=t+20*S+r()*(w-2*t-40*S), by=o+nd+t+20*S+r()*(gy-o-nd-t-50*S);
      if(Math.abs(bx-sx)<sw+14*S&&by>sb-sh-14*S) continue; if(boxes.some(([a0,a1,tp])=>bx>a0&&bx<a1&&by>tp-20*S)) continue; if(keep.some(([kx,ky])=>Math.hypot(kx-bx,ky-by)<38*S)) continue; if(links.some(([kx,ky])=>Math.abs(kx-bx)<96*S&&by-ky>-45*S&&by-ky<85*S)) continue; keep.push([bx,by]) }
    const BS=(document.querySelector('.bee svg')?.getBoundingClientRect().width||30*S*1.45)/30;   // the link bees' size
    for(const [bx,by] of keep){ const face=bx<sx?1:-1, a=(r()-.5)*.6;
      x.save(); x.translate(bx,by); x.rotate(a); x.scale(face*BS,BS);
      // the same bee as the link bees in the page (their SVG), so all the swarm matches
      x.strokeStyle=INK; x.lineJoin='round';
      for(const [cx,cy,rx,ry,ro,c] of [[-4,-6.5,3,6.5,-48,'#a7b4cf'],[0,-7,2.8,6.2,-18,'#b8c3da']]){ x.beginPath(); x.ellipse(cx,cy,rx,ry,ro*Math.PI/180,0,6.3); x.fillStyle=c; x.fill(); x.lineWidth=.9; x.stroke() }
      x.lineWidth=.7; x.beginPath(); x.moveTo(-3,3.5); x.lineTo(-4.5,7); x.moveTo(0,4); x.lineTo(-1,7.5); x.moveTo(3,3.6); x.lineTo(2.5,7); x.stroke();
      x.beginPath(); x.ellipse(0,0,8.5,4,0,0,6.3); x.fillStyle='#a26f40'; x.fill(); x.lineWidth=1.1; x.stroke();
      x.lineWidth=1.2; x.beginPath(); x.moveTo(-4,-3.6); x.quadraticCurveTo(-2.5,0,-4,3.6); x.moveTo(-.5,-3.9); x.quadraticCurveTo(1,0,-.5,3.9); x.stroke();
      x.beginPath(); x.arc(10,-.3,3,0,6.3); x.fillStyle='#5a3b20'; x.fill(); x.lineWidth=.9; x.stroke();
      x.restore() }
    x.restore();
    // wear: small losses of pigment where the vellum shows through, and a rubbed fading over the paint
    x.globalCompositeOperation='destination-out';
    for(let i=0;i<w*h/320;i++){ const px=r()*w,py=r()*h; x.fillStyle=`rgba(0,0,0,${.35+r()*.65})`; trace(x,almond(px,py,(1+r()*4.5)*S,(.8+r()*2.4)*S,r()*3),true); x.fill() }
    for(let i=0;i<6;i++){ const px=r()*w,py=r()*h; for(let k=0;k<30;k++){ x.fillStyle='rgba(0,0,0,.8)'; trace(x,almond(px+(r()-.5)*30*S,py+(r()-.5)*20*S,(1+r()*3)*S,(.8+r()*1.6)*S,r()*3),true); x.fill() } }   // patches where paint has flaked
    for(let i=0;i<10;i++){ const px=r()*w,py=r()*h,R=(20+r()*50)*S, rg=x.createRadialGradient(px,py,0,px,py,R); rg.addColorStop(0,'rgba(0,0,0,.3)'); rg.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=rg; x.fillRect(px-R,py-R,2*R,2*R) }
    x.globalCompositeOperation='source-over';
  }

  const vc=document.getElementById('vellum'), mc=document.getElementById('mini');
  function all(){ if(vc) vellum(vc); if(mc) mini(mc) }
  let rt, lw=innerWidth; addEventListener('resize',()=>{ if(innerWidth===lw) return; lw=innerWidth; clearTimeout(rt); rt=setTimeout(all,200) });   // ignore phone toolbar height changes
  requestAnimationFrame(()=>setTimeout(all,0));   // after the text has painted
})();
