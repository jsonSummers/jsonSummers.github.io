/* The brushstroke swirl, from the first version of the hobby site: short strokes following a flow with a few
   vortices, coloured across the window from persimmon through gold, moss and indigo to wisteria and vermilion,
   on a dark ground. Drawn once into <canvas id="swirl">, in batches so the page never waits for it. */
(function(){
  const cv=document.getElementById('swirl'); if(!cv) return;
  const PAL=['#e8743b','#d6a14a','#86a35a','#5b77bd','#a07ccb','#d0473c'];
  function rng(seed){let s=seed>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  let job=0;
  function draw(){
    const id=++job, r=rng(57), dpr=Math.min(2,devicePixelRatio||1), W=cv.clientWidth, H=cv.clientHeight;
    cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
    const c=cv.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0);
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
      if(i<n) setTimeout(step,0);
    }
    requestAnimationFrame(()=>setTimeout(step,0));
  }
  let t; addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(draw,250)});
  draw();
})();
