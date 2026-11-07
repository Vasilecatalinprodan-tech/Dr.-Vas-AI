/* Dr.Vas true 3D molecular DNA double helix — dependency-free WebGL 1.
 * SVG remains the accessible/reduced-capability fallback. No external CDN or network request.
 */
(() => {
  "use strict";
  const root = document;
  const reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const vec3 = (x, y, z) => [x, y, z];
  const add = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
  const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
  const mul = (a, s) => [a[0]*s, a[1]*s, a[2]*s];
  const dot = (a, b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const norm = a => { const n=Math.hypot(a[0],a[1],a[2])||1; return mul(a,1/n); };
  const positions=[], normals=[], colors=[];
  const colorA=[0.16,0.91,0.83], colorB=[0.42,0.52,1.0], rungA=[0.55,0.98,0.91], rungB=[0.73,0.79,1.0];
  function vertex(p,n,c){ positions.push(...p); normals.push(...n); colors.push(...c); }
  function tri(a,na,b,nb,c,nc,col){
    vertex(a,na,col); vertex(b,nb,col); vertex(c,nc,col);
  }
  function quad(a,na,b,nb,c,nc,d,nd,col){
    tri(a,na,b,nb,c,nc,col); tri(a,na,c,nc,d,nd,col);
  }
  function helixPoint(t, phase){
    const a=t*Math.PI*2*4.35+phase, r=0.72;
    return vec3(Math.cos(a)*r,(t-.5)*6.25,Math.sin(a)*r);
  }
  function addHelixTube(phase,col){
    const steps=210, sides=14, radius=.105;
    for(let i=0;i<steps;i++){
      const t0=i/steps,t1=(i+1)/steps;
      const c0=helixPoint(t0,phase), c1=helixPoint(t1,phase);
      const tangent=norm(sub(c1,c0));
      const radial0=norm(vec3(Math.cos(t0*Math.PI*2*4.35+phase),0,Math.sin(t0*Math.PI*2*4.35+phase)));
      const radial1=norm(vec3(Math.cos(t1*Math.PI*2*4.35+phase),0,Math.sin(t1*Math.PI*2*4.35+phase)));
      const bin0=norm(cross(tangent,radial0)), bin1=norm(cross(tangent,radial1));
      for(let j=0;j<sides;j++){
        const a0=j/sides*Math.PI*2,a1=(j+1)/sides*Math.PI*2;
        const n00=norm(add(mul(radial0,Math.cos(a0)),mul(bin0,Math.sin(a0))));
        const n01=norm(add(mul(radial0,Math.cos(a1)),mul(bin0,Math.sin(a1))));
        const n10=norm(add(mul(radial1,Math.cos(a0)),mul(bin1,Math.sin(a0))));
        const n11=norm(add(mul(radial1,Math.cos(a1)),mul(bin1,Math.sin(a1))));
        const p00=add(c0,mul(n00,radius)),p01=add(c0,mul(n01,radius));
        const p10=add(c1,mul(n10,radius)),p11=add(c1,mul(n11,radius));
        quad(p00,n00,p10,n10,p11,n11,p01,n01,col);
      }
    }
  }
  function addCylinder(a,b,r,col,segments=10){
    const axis=norm(sub(b,a)), ref=Math.abs(axis[1])>.92?vec3(1,0,0):vec3(0,1,0);
    const u=norm(cross(axis,ref)),v=norm(cross(axis,u));
    for(let i=0;i<segments;i++){
      const t0=i/segments*Math.PI*2,t1=(i+1)/segments*Math.PI*2;
      const n0=norm(add(mul(u,Math.cos(t0)),mul(v,Math.sin(t0))));
      const n1=norm(add(mul(u,Math.cos(t1)),mul(v,Math.sin(t1))));
      const a0=add(a,mul(n0,r)),a1=add(a,mul(n1,r));
      const b0=add(b,mul(n0,r)),b1=add(b,mul(n1,r));
      quad(a0,n0,b0,n0,b1,n1,a1,n1,col);
    }
  }
  function addSphere(center,r,col,rows=8,segments=12){
    for(let y=0;y<rows;y++){
      const p0=-Math.PI/2+y/rows*Math.PI,p1=-Math.PI/2+(y+1)/rows*Math.PI;
      for(let x=0;x<segments;x++){
        const t0=x/segments*Math.PI*2,t1=(x+1)/segments*Math.PI*2;
        const point=(p,t)=>norm(vec3(Math.cos(p)*Math.cos(t),Math.sin(p),Math.cos(p)*Math.sin(t)));
        const n00=point(p0,t0),n01=point(p0,t1),n10=point(p1,t0),n11=point(p1,t1);
        const q=n=>add(center,mul(n,r));
        quad(q(n00),n00,q(n10),n10,q(n11),n11,q(n01),n01,col);
      }
    }
  }
  function buildGeometry(){
    addHelixTube(0,colorA); addHelixTube(Math.PI,colorB);
    for(let i=0;i<19;i++){
      const t=.035+i*.0515,a=helixPoint(t,0),b=helixPoint(t,Math.PI);
      const col=i%2?rungA:rungB;
      addCylinder(a,b,.036,col,9);
      addSphere(a,.078,colorA,7,10); addSphere(b,.078,colorB,7,10);
    }
  }
  function perspective(fovy,aspect,near,far){
    const f=1/Math.tan(fovy/2),nf=1/(near-far);
    return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);
  }
  function multiply(a,b){
    const o=new Float32Array(16);
    for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
    return o;
  }
  function lookAt(eye,center,up){
    const z=norm(sub(eye,center)),x=norm(cross(up,z)),y=cross(z,x);
    return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
  }
  function rotationY(a,radialScale=1){
    const c=Math.cos(a),s=Math.sin(a),k=clamp(radialScale,.5,1);
    return new Float32Array([c*k,0,-s*k,0,0,1,0,0,s*k,0,c*k,0,0,0,0,1]);
  }
  function shader(gl,type,source){
    const sh=gl.createShader(type); gl.shaderSource(sh,source); gl.compileShader(sh);
    if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){const msg=gl.getShaderInfoLog(sh);gl.deleteShader(sh);throw new Error(msg||"shader compile failed");}
    return sh;
  }
  function init(canvas){
    const gl=canvas.getContext("webgl",{alpha:true,antialias:true,depth:true,powerPreference:"low-power",premultipliedAlpha:true});
    if(!gl)throw new Error("WebGL unavailable");
    const vs=shader(gl,gl.VERTEX_SHADER,`
      attribute vec3 aPosition; attribute vec3 aNormal; attribute vec3 aColor;
      uniform mat4 uMvp; uniform mat4 uModel;
      varying vec3 vNormal; varying vec3 vColor; varying vec3 vPosition;
      void main(){ vec4 world=uModel*vec4(aPosition,1.0); vPosition=world.xyz; vNormal=normalize(mat3(uModel)*aNormal); vColor=aColor; gl_Position=uMvp*vec4(aPosition,1.0); }
    `);
    const fs=shader(gl,gl.FRAGMENT_SHADER,`
      precision mediump float; varying vec3 vNormal; varying vec3 vColor; varying vec3 vPosition;
      void main(){
        vec3 N=normalize(vNormal), L=normalize(vec3(-.45,.72,.8)), V=normalize(vec3(0.0,0.0,12.0)-vPosition);
        float diffuse=max(dot(N,L),0.0);
        float spec=pow(max(dot(reflect(-L,N),V),0.0),34.0);
        float rim=pow(1.0-max(dot(N,V),0.0),2.0);
        vec3 base=vColor*(.32+.76*diffuse)+vec3(.58,.9,1.0)*spec*.52+vec3(.08,.32,.42)*rim*.55;
        gl_FragColor=vec4(base,1.0);
      }
    `);
    const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||"program link failed");
    const vertexCount=positions.length/3,data=new Float32Array(vertexCount*9);
    for(let i=0;i<vertexCount;i++){const p=i*3,d=i*9;data[d]=positions[p];data[d+1]=positions[p+1];data[d+2]=positions[p+2];data[d+3]=normals[p];data[d+4]=normals[p+1];data[d+5]=normals[p+2];data[d+6]=colors[p];data[d+7]=colors[p+1];data[d+8]=colors[p+2];}
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
    const stride=9*4;
    gl.useProgram(program);
    const attrs=[["aPosition",0],["aNormal",3],["aColor",6]];
    attrs.forEach(([name,offset])=>{const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,stride,offset*4);});
    const uMvp=gl.getUniformLocation(program,"uMvp"),uModel=gl.getUniformLocation(program,"uModel");
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0,0,0,0);
    return {gl,program,vertexCount,uMvp,uModel};
  }
  function mount(host){
    if(host.dataset.dna3dReady==="true")return;
    const canvas=root.createElement("canvas");canvas.className="dna-helix-webgl";canvas.setAttribute("aria-hidden","true");
    host.insertBefore(canvas,host.firstChild);
    let scene;
    try{scene=init(canvas);}catch(error){canvas.remove();host.dataset.dna3dStatus="fallback";return;}
    host.dataset.dna3dReady="true";host.dataset.dna3dStatus="webgl";host.classList.add("dna-webgl-active");
    let width=0,height=0,visible=true,raf=0,lastTime=0,angle=0;
    const resize=()=>{
      const rect=host.getBoundingClientRect(),dpr=clamp(window.devicePixelRatio||1,1,1.5);
      const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
      if(w!==width||h!==height){width=w;height=h;canvas.width=w;canvas.height=h;scene.gl.viewport(0,0,w,h);}
    };
    const render=now=>{
      raf=0;if(!visible)return;
      resize();const gl=scene.gl;
      if(!reducedMotion&&lastTime)angle+=(now-lastTime)*.00022;
      lastTime=now;
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      const projection=perspective(40*Math.PI/180,width/height,.1,50);
      const view=lookAt(vec3(0,0,13),vec3(0,0,0),vec3(0,1,0));
      const model=rotationY(angle,clamp((width/height)/.25,.52,1));
      const mvp=multiply(multiply(projection,view),model);
      gl.useProgram(scene.program);gl.uniformMatrix4fv(scene.uMvp,false,mvp);gl.uniformMatrix4fv(scene.uModel,false,model);
      gl.drawArrays(gl.TRIANGLES,0,scene.vertexCount);
      if(!reducedMotion)raf=requestAnimationFrame(render);
    };
    const start=()=>{if(!visible||raf||reducedMotion&&lastTime)return;raf=requestAnimationFrame(render);};
    const observer=window.IntersectionObserver?new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible){lastTime=0;start();}else{if(raf)cancelAnimationFrame(raf);raf=0;}},{rootMargin:"120px"}):null;
    if(observer)observer.observe(host);
    if(window.ResizeObserver)new ResizeObserver(()=>{resize();if(reducedMotion){lastTime=0;render(performance.now());}}).observe(host);
    if(reducedMotion){lastTime=0;render(performance.now());}
    else start();
    canvas.addEventListener("webglcontextlost",event=>{event.preventDefault();if(raf)cancelAnimationFrame(raf);host.classList.remove("dna-webgl-active");host.dataset.dna3dStatus="fallback";canvas.remove();});
  }
  function boot(){buildGeometry();root.querySelectorAll(".dna-helix-visual").forEach(mount);}
  if(root.readyState==="loading")root.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
