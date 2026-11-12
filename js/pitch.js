/* Harp Bench: pitch detection for the microphone (YIN, de Cheveigné & Kawahara 2002).
   No page access, so it is tested in Node. */
"use strict";
function detectPitch(buf,sampleRate,opts){
  // Returns {freq, clarity (0..1), rms}; freq is 0 when no clear pitch is found.
  opts=opts||{};
  const minF=opts.minF||150, maxF=opts.maxF||3400, threshold=opts.threshold||.12, minRms=opts.minRms==null?.008:opts.minRms;
  const n=buf.length;
  let rms=0; for(let i=0;i<n;i++) rms+=buf[i]*buf[i]; rms=Math.sqrt(rms/n);
  if(rms<minRms) return {freq:0,clarity:0,rms};
  const tauMin=Math.max(2,Math.floor(sampleRate/maxF)), tauMax=Math.min(Math.floor(sampleRate/minF),Math.floor(n/2)-1);
  const w=n-tauMax, d=new Float32Array(tauMax+2);
  for(let tau=1;tau<=tauMax+1;tau++){let s=0; for(let i=0;i<w;i++){const x=buf[i]-buf[i+tau]; s+=x*x;} d[tau]=s;}
  // cumulative mean normalised difference
  const c=new Float32Array(tauMax+2); c[0]=1; let run=0;
  for(let tau=1;tau<=tauMax+1;tau++){run+=d[tau]; c[tau]=run?d[tau]*tau/run:1;}
  let tau=-1;
  for(let t=tauMin;t<=tauMax;t++){
    if(c[t]<threshold){ while(t+1<=tauMax&&c[t+1]<c[t]) t++; tau=t; break; }
  }
  if(tau<0){
    let best=tauMin; for(let t=tauMin;t<=tauMax;t++) if(c[t]<c[best]) best=t;
    if(c[best]>.35) return {freq:0,clarity:Math.max(0,1-c[best]),rms};
    tau=best;
  }
  // parabolic interpolation around the dip, on the raw difference (the normalised curve is biased at short periods)
  const x0=d[tau-1], x1=d[tau], x2=d[tau+1], den=x0+x2-2*x1;
  const shift=den?Math.max(-1,Math.min(1,.5*(x0-x2)/den)):0;
  let period=tau+shift;
  // High notes repeat every few samples, so one period is measured coarsely. Measure the k-th repeat instead
  // (the dip near k periods) and divide by k: the error shrinks by about k.
  const k=Math.min(8,Math.floor((tauMax-1)/period));
  if(k>=2){
    const guess=Math.round(k*period); let t=guess;
    for(let j=guess-2;j<=guess+2;j++) if(j>1&&j<=tauMax&&d[j]<d[t]) t=j;
    const y0=d[t-1], y1=d[t], y2=d[t+1], dn=y0+y2-2*y1;
    const sh=dn?Math.max(-1,Math.min(1,.5*(y0-y2)/dn)):0;
    const refined=(t+sh)/k;
    if(Math.abs(refined-period)<.5) period=refined;
  }
  return {freq:sampleRate/period,clarity:Math.max(0,Math.min(1,1-c[tau])),rms};
}
function freqToMidi(f){ return 69+12*Math.log2(f/440); }
