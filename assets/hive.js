/* The Links page's backdrop: the face of a brood comb deep in a hive, lit faintly from the entrance and otherwise
   left in the dark. Drawn into <canvas id="hive">.
   The comb is laid out the way bees lay out a real frame: capped brood in a broad oval in the middle (with a few
   open cells holding eggs and curled larvae), a ring of pollen around it in mixed dull colours, and an arch of
   honey above, open nectar near the pollen and wax-capped honey further out. Empty cells show their floor, three
   rhombs meeting in a Y. Cells are the true hexagon, with a worker bee about two and a half cells long.
   Bees crawl over it slowly, stop, put their heads into cells; one does the waggle dance (a straight run with
   the body shaking, then a loop back, alternately left and right) with a few followers turned towards her.
   The comb is painted once; only the bees move, at a low frame rate, and not at all with reduced motion. */
(function(){
  const cv=document.getElementById('hive'); if(!cv) return;
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rng(seed){let s=seed>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  /* smooth value noise, for organic edges between the zones */
  function noise(seed){const r=rng(seed),T=new Float32Array(256);for(let i=0;i<256;i++)T[i]=r();
    const h=(x,y)=>T[(x*73+y*151)&255], f=t=>t*t*(3-2*t);
    return (x,y)=>{const X=Math.floor(x),Y=Math.floor(y),u=f(x-X),v=f(y-Y);return (h(X,Y)*(1-u)+h(X+1,Y)*u)*(1-v)+(h(X,Y+1)*(1-u)+h(X+1,Y+1)*u)*v}}
  let W=0,H=0,dpr=1,s=10,comb=null,bees=[],dancer=null,sprites=null,LX=0,LY=0,LR=1;

  /* darkness: one soft light from the upper left (the entrance), everything else falling into shadow */
  const STOPS=[[0,.22],[.3,.55],[.65,.82],[1,.95]];
  function shade(x,y){const d=Math.min(1,Math.hypot(x-LX,y-LY)/LR);for(let i=1;i<STOPS.length;i++)if(d<=STOPS[i][0]){const[a,p]=STOPS[i-1],[b,q]=STOPS[i];return p+(q-p)*(d-a)/(b-a)}return .93}

  function hex(c,x,y,r){c.moveTo(x,y-r);for(let k=1;k<6;k++){const a=k*Math.PI/3;c.lineTo(x+Math.sin(a)*r,y-Math.cos(a)*r)}c.closePath()}
  const POLLEN=['#8a6426','#7a4420','#66652e','#94773a','#5a3822','#735030','#86582a'];
  function paint(){
    const r=rng(808), n=noise(17), w=Math.sqrt(3)*s, rh=1.5*s, cx=W/2, cy=H*.6, RX=W*.42, RY=H*.44;
    comb=document.createElement('canvas'); comb.width=cv.width; comb.height=cv.height;
    const c=comb.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0);
    c.fillStyle='#0c0906'; c.fillRect(0,0,W,H);
    const walls=new Path2D(), ys=[];
    for(let row=-1,y=-s;y<H+s*2;row++,y+=rh) for(let x=(row&1)*w/2-w;x<W+w;x+=w){
      const j=(n(x*.02,y*.02)-.5)*.6, e=Math.hypot((x-cx)/RX,(y-cy)/RY)+(n(x/90+9,y/90)-.5)*.32, q=r(), k=s*.82;
      hex(walls,x,y,s+j*.4);
      if(e<1){                                             // brood
        if(q<.84){ const g=c.createRadialGradient(x-k*.3,y-k*.35,k*.1,x,y,k*1.05); g.addColorStop(0,'#8a6236'); g.addColorStop(1,'#3b2814'); c.fillStyle=g; c.beginPath(); hex(c,x,y,k); c.fill() }
        else if(q<.93){ floor(c,x,y,k); c.fillStyle='rgba(220,208,180,.16)'; c.beginPath(); c.arc(x,y,k*.62,0,Math.PI*2); c.fill();
          c.strokeStyle='rgba(214,202,172,.62)'; c.lineWidth=k*.36; c.lineCap='round'; c.beginPath(); c.arc(x,y,k*.3,.6+q*20,.6+q*20+Math.PI*1.25); c.stroke() }   // a curled larva in its milk
        else if(q<.97){ floor(c,x,y,k); c.strokeStyle='rgba(225,218,200,.55)'; c.lineWidth=k*.1; c.beginPath(); const a=q*40; c.moveTo(x-Math.cos(a)*k*.18,y-Math.sin(a)*k*.18); c.lineTo(x+Math.cos(a)*k*.18,y+Math.sin(a)*k*.18); c.stroke() } // an egg
        else floor(c,x,y,k);
      } else if(e<1.17){                                   // pollen
        if(q<.86){ c.fillStyle=POLLEN[Math.floor(r()*POLLEN.length)]; c.beginPath(); c.arc(x,y,k*.86,0,Math.PI*2); c.fill();
          c.fillStyle='rgba(255,240,200,.08)'; c.beginPath(); c.arc(x-k*.25,y-k*.25,k*.4,0,Math.PI*2); c.fill() }
        else floor(c,x,y,k);
      } else if(y<cy+RY*.35){                              // honey: open nectar near the pollen, capped further out
        if(e>1.38&&q<.9){ const g=c.createLinearGradient(x,y-k,x,y+k); g.addColorStop(0,'#8c7448'); g.addColorStop(1,'#5e4a2a'); c.fillStyle=g; c.beginPath(); hex(c,x,y,k); c.fill() }
        else if(q<.85){ const g=c.createRadialGradient(x,y+k*.2,k*.1,x,y,k); g.addColorStop(0,'#c07a22'); g.addColorStop(1,'#4a2808'); c.fillStyle=g; c.beginPath(); hex(c,x,y,k); c.fill();
          c.strokeStyle='rgba(255,226,160,.5)'; c.lineWidth=k*.1; c.beginPath(); c.arc(x,y,k*.55,-2.6,-1.6); c.stroke() }
        else floor(c,x,y,k);
      } else if(q<.12){ const g=c.createRadialGradient(x,y,k*.1,x,y,k); g.addColorStop(0,'#9a5a18'); g.addColorStop(1,'#3a1e06'); c.fillStyle=g; c.beginPath(); hex(c,x,y,k); c.fill() }
      else floor(c,x,y,k);                                 // empty drawn comb below
    }
    c.strokeStyle='#5c4524'; c.lineWidth=s*.15; c.lineJoin='round'; c.stroke(walls);
    c.strokeStyle='rgba(255,236,190,.06)'; c.lineWidth=s*.05; c.stroke(walls);
    const g=c.createRadialGradient(LX,LY,0,LX,LY,LR); for(const[a,p]of STOPS) g.addColorStop(a,`rgba(6,4,2,${p})`); c.fillStyle=g; c.fillRect(0,0,W,H);
  }
  function floor(c,x,y,k){                                 // an empty cell: dark, with the Y where the floor's rhombs meet
    c.fillStyle='#120d08'; c.beginPath(); hex(c,x,y,k); c.fill();
    c.strokeStyle='rgba(150,110,60,.28)'; c.lineWidth=k*.07; c.beginPath();
    for(let a=0;a<3;a++){const t=a*Math.PI*2/3; c.moveTo(x,y); c.lineTo(x+Math.sin(t)*k*.6,y-Math.cos(t)*k*.6)} c.stroke();
  }

  /* bee sprites, drawn once, nose along +x: two leg poses and a head-in-cell pose, each at a few brightnesses */
  function makeSprites(){
    const L=s*Math.sqrt(3)*2.5, S=Math.ceil(L*1.3*dpr), out=[];
    for(const pose of [0,1,2]){ const row=[];
      for(const lit of [1,.7,.48,.3,.17]){
        const b=document.createElement('canvas'); b.width=b.height=S; const c=b.getContext('2d');
        c.translate(S/2,S/2); c.scale(dpr,dpr);
        if(pose<2){ c.strokeStyle='#1a1008'; c.lineWidth=L*.025; c.lineCap='round';      // six legs, tripod gait
          for(const [i,sd] of [[0,1],[1,1],[2,1],[0,-1],[1,-1],[2,-1]]){ const ph=((i+(sd>0?0:1)+pose)&1)?.18:-.18, ax=L*(.1-i*.09), a=sd*(1.1+(i-1)*.55)+ph*sd;
            c.beginPath(); c.moveTo(ax,0); c.lineTo(ax+Math.cos(a)*L*.22,Math.sin(a)*L*.22); c.lineTo(ax+Math.cos(a+sd*.4*(i-1))*L*.36,Math.sin(a)*L*.34); c.stroke() } }
        c.save(); c.beginPath(); c.ellipse(-L*.27,0,L*.29,L*.16,0,0,Math.PI*2); c.clip();       // abdomen with bands
        c.fillStyle='#7a5020'; c.fillRect(-L*.6,-L*.2,L*.7,L*.4); c.fillStyle='#1f1309';
        for(const bx of [-.12,-.24,-.36,-.48]) c.fillRect(L*bx-L*.055,-L*.2,L*.06,L*.4);
        c.fillRect(-L*.62,-L*.2,L*.08,L*.4); c.restore();
        if(pose<2){ let g=c.createRadialGradient(L*.02,0,0,L*.02,0,L*.13); g.addColorStop(0,'#7d6236'); g.addColorStop(1,'#2e2010');   // furred thorax
          c.fillStyle=g; c.beginPath(); c.arc(L*.03,0,L*.13,0,Math.PI*2); c.fill();
          c.fillStyle='#160e07'; c.beginPath(); c.ellipse(L*.21,0,L*.07,L*.095,0,0,Math.PI*2); c.fill();                       // head
          c.strokeStyle='#160e07'; c.lineWidth=L*.018; for(const sd of [1,-1]){c.beginPath(); c.moveTo(L*.26,sd*L*.04); c.lineTo(L*.33,sd*L*.08); c.lineTo(L*.4,sd*L*.06); c.stroke()} }
        for(const sd of [1,-1]){ c.save(); c.translate(-L*.12,sd*L*.05); c.rotate(-sd*.14);                                         // folded wings
          c.fillStyle='rgba(225,215,190,.17)'; c.strokeStyle='rgba(240,228,200,.32)'; c.lineWidth=L*.008;
          c.beginPath(); c.ellipse(-L*.08,0,L*.27,L*.075,0,0,Math.PI*2); c.fill(); c.stroke(); c.restore() }
        c.globalCompositeOperation='source-atop'; c.fillStyle=`rgba(6,4,2,${1-lit})`; c.fillRect(-S,-S,S*2,S*2);
        row.push(b) }
      out.push(row) }
    return {L,S,out};
  }
  function setup(){
    const r=rng(42), w=Math.sqrt(3)*s, n=W<700?10:Math.round(W*H/22000), M=(W-Math.min(980,W-48))/2, cx=W/2, cy=H*.6;
    bees=[];
    for(let i=0;i<n*6&&bees.length<n;i++){
      const x=r()*W, y=r()*H, e=Math.hypot((x-cx)/(W*.42),(y-cy)/(H*.44)), under=x>M&&x<W-M&&y>40;
      if(r()>(e<1.1?1:.35)*(under?.08:1)) continue;                        // nurse bees crowd the brood; few under the page
      if(bees.some(b=>Math.hypot(b.x-x,b.y-y)<sprites.L*.7)) continue;
      bees.push({x,y,a:r()*Math.PI*2,turn:0,v:0,mode:r()<.2?2:0,t:r()*6,ph:r()})
    }
    const dx=M>140?M*.5:W*.5, dy=M>140?H*.42:H*.88;                   // the dancer works in the left margin, under the light
    dancer={x:dx,y:dy,dir:-Math.PI/2+(r()-.5)*.8};
    bees=bees.filter(b=>Math.hypot(b.x-dx,b.y-dy)>sprites.L*1.6);
    for(let k=0;k<4;k++){ const a=dancer.dir+Math.PI/2+k*Math.PI/3-Math.PI/2*.3+(k>1?Math.PI*.7:0), d=sprites.L*1.05;
      bees.push({x:dx+Math.cos(a)*d,y:dy+Math.sin(a)*d,a:a+Math.PI,turn:0,v:0,mode:3,t:0,ph:r()}) }
  }
  function draw(c,b,pose,x,y,a){
    const lit=1-shade(x,y), lv=lit>.75?0:lit>.5?1:lit>.32?2:lit>.18?3:4, img=sprites.out[pose][lv], S=sprites.S;
    c.setTransform(Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),x*dpr,y*dpr); c.drawImage(img,-S/2,-S/2);
  }
  let last=0;
  function frame(ts){
    const t=ts/1000, dt=last?Math.min(.12,(ts-last)/1000):0; last=ts;
    const c=cv.getContext('2d'); c.setTransform(1,0,0,1,0,0); c.drawImage(comb,0,0);
    const L=sprites.L;
    for(const b of bees){
      if(b.mode===0){                                       // crawling: slow, wandering, turning smoothly
        b.turn+=(Math.random()-.5)*dt*3; b.turn*=.96; b.a+=b.turn*dt*2; b.v=L*(.22+.12*Math.sin(t*.7+b.ph*9));
        b.x+=Math.cos(b.a)*b.v*dt; b.y+=Math.sin(b.a)*b.v*dt;
        if(b.x<-L||b.x>W+L||b.y<-L||b.y>H+L) b.a+=Math.PI;
        if((b.t-=dt)<0){ b.mode=Math.random()<.35?2:1; b.t=2+Math.random()*6 }
      } else if(b.mode<3&&(b.t-=dt)<0){ b.mode=0; b.t=3+Math.random()*7 }
      const pose=b.mode===2?2:b.mode===0?((t*6+b.ph*2)|0)&1:0;
      draw(c,b,pose,b.x,b.y,b.a+(b.mode===1?Math.sin(t*1.3+b.ph*7)*.06:0));
    }
    // the waggle dance
    const D=dancer, R=L*1.1, cyc=3.6, u=still?.2:(t%(cyc*2))/cyc, side=u<1?1:-1, v=u%1, ca=Math.cos(D.dir), sa=Math.sin(D.dir);
    let x,y,a;
    if(v<.42){ const k=v/.42, wg=Math.sin(t*2*Math.PI*13); x=-R/2+k*R; y=wg*L*.05; a=wg*.42 }
    else { const k=(v-.42)/.58, th=Math.PI*k; x=R/2*Math.cos(th); y=side*R*.5*Math.sin(th); a=Math.PI/2*side+th*side }
    draw(c,D,((t*8)|0)&1,D.x+x*ca-y*sa,D.y+x*sa+y*ca,a+D.dir);
  }
  let lt=0;
  function loop(ts){ if(!document.hidden&&ts-lt>45){lt=ts;frame(ts)} requestAnimationFrame(loop) }
  function size(){
    dpr=Math.min(2,devicePixelRatio||1); W=cv.clientWidth; H=cv.clientHeight; cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
    s=W<700?8:13; LX=W*.16; LY=-H*.05; LR=Math.hypot(W,H)*.95;
    paint(); sprites=makeSprites(); setup(); frame(performance.now());
  }
  let rt; addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(size,200)});
  requestAnimationFrame(()=>setTimeout(()=>{ size(); if(!still) requestAnimationFrame(loop) },0));
})();
