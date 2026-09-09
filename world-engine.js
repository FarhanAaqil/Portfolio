import * as T from './vendor/three.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {createStrawHats} from './straw-hats.js';
const host=document.querySelector('#scene');
let renderer;
try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(error){document.querySelector('#loading').hidden=true;window.enableReadingView();throw error;}
const mobile=()=>matchMedia('(max-width:700px), (max-height:500px) and (pointer:coarse)').matches;
renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1.25:1.7));renderer.setSize(mobile()?host.clientWidth:innerWidth,mobile()?host.clientHeight:innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;host.append(renderer.domElement);host.tabIndex=0;
const scene=new T.Scene();scene.background=new T.Color('#b7dedb');scene.fog=new T.Fog('#b7dedb',90,240);
const camera=new T.PerspectiveCamera(42,(mobile()?host.clientWidth/host.clientHeight:innerWidth/innerHeight),.1,450);
scene.add(new T.HemisphereLight('#ffedcf','#448eb0',1.15));const sun=new T.DirectionalLight('#fff0d8',2.1);sun.position.set(-25,50,30);scene.add(sun);renderer.shadowMap.enabled=!mobile();renderer.shadowMap.type=T.PCFSoftShadowMap;sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-35,right:35,top:35,bottom:-35,near:1,far:100});sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;scene.add(sun.target);
const inkBands=new T.DataTexture(new Uint8Array([60,145,220,255]),4,1,T.RedFormat);inkBands.minFilter=inkBands.magFilter=T.NearestFilter;inkBands.needsUpdate=true;
const mats={};const mat=(color)=>mats[color]??(mats[color]=new T.MeshToonMaterial({color,gradientMap:inkBands}));
function mesh(g,c,x=0,y=0,z=0,parent=scene){const o=new T.Mesh(g,typeof c==='string'?mat(c):c);o.position.set(x,y,z);parent.add(o);return o;}
const box=(x,y,z,w,h,d,c,p)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);
const cyl=(x,y,z,r1,r2,h,c,p,n=12)=>mesh(new T.CylinderGeometry(r1,r2,h,n),c,x,y,z,p);
const sphere=(x,y,z,r,c,p,sx=1,sy=1,sz=1)=>{const o=mesh(new T.SphereGeometry(r,16,10),c,x,y,z,p);o.scale.set(sx,sy,sz);return o;};
function rod(a,b,r,color,parent){const d=new T.Vector3().subVectors(b,a);const o=cyl(0,0,0,r,r,d.length(),color,parent,6);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
let seed=42;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
// A displaced surface, with directional wave normals and foam glints, rendered live.
const waterMat=new T.ShaderMaterial({uniforms:{time:{value:0},sea:{value:new T.Color('#278d92')}},vertexShader:`uniform float time;varying vec3 wp;varying float wave;void main(){vec3 p=position;float w=sin(p.x*.32+time*.8)*.19+cos(p.y*.23+time*.6)*.16; p.z+=w;wave=w;vec4 world=modelMatrix*vec4(p,1.);wp=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,fragmentShader:`uniform float time;uniform vec3 sea;varying vec3 wp;varying float wave;void main(){float lines=sin(wp.x*.8+wp.z*.44+time)*sin(wp.z*.63-time*.5);float sparkle=pow(max(0.,lines),28.);vec3 col=mix(sea,vec3(.48,.81,.75),wave*.65+.35);col+=sparkle*.15;float fog=smoothstep(90.,230.,length(cameraPosition-wp));col=mix(col,vec3(.66,.83,.81),fog);gl_FragColor=vec4(col,1.);}`});
const water=mesh(new T.PlaneGeometry(3500,3500,mobile()?120:200,mobile()?120:200),waterMat,0,-.1,-500);water.rotation.x=-Math.PI/2;
// Foosha: faceted shore, rolling hills and timber harbour.
const foosha=new T.Group();foosha.name='Foosha';scene.add(foosha);
cyl(0,-.9,0,13,10,2.8,'#d2b680',foosha,36);cyl(0,.6,0,12.6,12.9,.6,'#ddce97',foosha,36);cyl(-1,1.1,-1,11.5,12,.6,'#86a967',foosha,32);
sphere(-5,1,-5,5,'#6f9961',foosha,1.3,.65,1);sphere(3,1,-6,5,'#779e63',foosha,1,.7,1);
function house(x,z,s,color,parent,y=1.6){
const g=new T.Group();g.position.set(x,y,z);g.rotation.y=(rand()-.5)*.35;parent.add(g);const urban=parent.name==='Water 7';const floors=urban?2+Math.floor(rand()*2):1;const h=s*(urban?1.2*floors:1.6),w=s*1.4,d=s*1.25;
box(0,h/2,0,w,h,d,color,g);box(0,.1,0,w+.12,.2,d+.12,'#b9a48b',g);
// Gabled roof and individually modelled courses of red tiles.
const roofShape=new T.Shape();roofShape.moveTo(-w*.63,0);roofShape.lineTo(0,s*.75);roofShape.lineTo(w*.63,0);roofShape.closePath();const rg=new T.ExtrudeGeometry(roofShape,{depth:d*1.2,bevelEnabled:false});mesh(rg,'#a44732',0,h,-d*.6,g);
for(const side of [-1,1]){const slope=Math.atan2(s*.75,w*.63);for(let j=0;j<5;j++){const x=side*(j+.3)/5*w*.63;const yRoof=h+s*.75*(1-Math.abs(x)/(w*.63));const tile=box(x,yRoof+.018,0,.045,.04,d*1.23,'#cf7350',g);tile.rotation.z=-side*slope;}}
box(0,h+.04,0,w*1.28,.12,d*1.22,'#e4d0a6',g);box(0,s*.44,d*.51,s*.32,s*.88,.06,'#4a4034',g);
for(let f=0;f<floors;f++){const yy=urban?s*.65+f*s*1.2:s*1.05;for(const side of [-1,1]){const xx=side*s*.43;box(xx,yy,d*.512,s*.25,s*.43,.06,'#315f6e',g);box(xx,yy,d*.55,.035,s*.43,.07,'#f7e0b3',g);box(xx,yy,d*.55,s*.25,.035,.07,'#f7e0b3',g);for(const shutter of [-1,1])box(xx+shutter*s*.18,yy,d*.55,s*.09,s*.46,.08,urban?'#487c71':'#76654b',g);box(xx,yy-s*.24,d*.57,s*.4,.06,.13,'#f2dbaf',g);}
if(urban){box(0,yy-s*.47,d*.6,w*.88,.09,.3,'#cfb593',g);box(0,yy-s*.27,d*.73,w*.85,.035,.04,'#586e68',g);for(let i=-3;i<=3;i++)box(i*w*.13,yy-s*.35,d*.73,.025,.25,.025,'#586e68',g);}}
box(s*.42,h+s*.44,0,s*.2,s*.8,s*.24,'#ba9e82',g);box(s*.42,h+s*.86,0,s*.29,.1,s*.31,'#94735c',g);
return g;}
[[-6,2,1.4,'#f2dfb1'],[-2,0,1.5,'#eed39b'],[2,-3,1.3,'#d5dfbe'],[5,1,1.6,'#f1d8ab'],[-6,-3,1.1,'#e4c5a3'],[1,4,1.2,'#e9dfb8']].forEach(a=>house(...a,foosha));
// Windmill with four wooden lattice sails.
const mill=new T.Group();mill.position.set(-3,1.6,-5);foosha.add(mill);cyl(0,3.1,0,1.35,1.8,6.2,'#f2e7c8',mill,16);mesh(new T.ConeGeometry(1.8,2,16),'#a65338',0,7.1,0,mill);box(0,1,.0,1,1.8,3.5,'#e8dcb8',mill);box(0,1,1.78,.65,1.5,.1,'#614b36',mill);const blades=new T.Group();blades.position.set(0,5,1.6);mill.add(blades);cyl(0,0,0,.24,.24,.5,'#714c34',blades).rotation.x=Math.PI/2;
for(let k=0;k<4;k++){const arm=new T.Group();arm.rotation.z=k*Math.PI/2+.3;blades.add(arm);box(0,2.3,0,.16,5.2,.15,'#88633d',arm);for(let j=0;j<6;j++)box(.35,1+j*.53,0,1.1,.14,.12,'#e5d7a8',arm);box(-.2,2.4,0,.08,3.6,.1,'#89623e',arm);box(.85,2.4,0,.08,3.6,.1,'#89623e',arm)}
function tree(x,z,s,parent,y=1.4){cyl(x,y+s*.7,z,.14*s,.22*s,s*1.5,'#816742',parent,6);sphere(x,y+s*1.8,z,s,'#48795a',parent,1,1.2,1);sphere(x+.4*s,y+s*2.2,z,s*.7,'#65965b',parent)}
for(let i=0;i<22;i++){const a=rand()*Math.PI*2,r=7+rand()*3;tree(Math.cos(a)*r,Math.sin(a)*r,.6+rand()*.5,foosha)}
// Harbour, visible planks, mooring posts and crates.
for(let i=0;i<20;i++)box(5,.8,7+i*.45,3,.2,.39,'#a27a4c',foosha);for(let z=8;z<16;z+=2){for(const x of [3.6,6.4])cyl(x,.45,z,.12,.17,2.3,'#6d5a3c',foosha,6)}for(let i=0;i<3;i++)box(4+i*.75,1.3,8,.65,.8,.65,'#947548',foosha);
// Coastal rocks and rings of surf are geometry, not image planes.
for(let i=0;i<28;i++){const a=i/28*Math.PI*2; sphere(Math.cos(a)*12.7,.05,Math.sin(a)*12.7,.5+rand()*.6,'#89b2a3',foosha,1.4,.5,1)}
const foamMat=new T.MeshBasicMaterial({color:'#bce7d6',transparent:true,opacity:.5,side:T.DoubleSide});const surf=mesh(new T.RingGeometry(13.3,13.48,64),foamMat,0,.13,0,foosha);surf.rotation.x=-Math.PI/2;
// Water 7: concentric stone terraces, canal bands and a monumental fountain.
const city=new T.Group();city.name='Water 7';city.position.set(-130,0,-330);scene.add(city);
cyl(0,-.3,0,15,13.5,2.4,'#c5b997',city,48);cyl(0,1,0,14.8,15,.4,'#e3d6b4',city,48);
for(let tier=0;tier<3;tier++){const radius=12-tier*3.2,base=1.4+tier*3.3;cyl(0,base+1.1,0,radius,radius+.4,2.6,'#cebfa1',city,48);cyl(0,base+2.45,0,radius+.2,radius+.2,.25,'#f0e0ba',city,48);const canal=mesh(new T.RingGeometry(radius-.6,radius+.05,64),new T.MeshBasicMaterial({color:'#459fa6',side:T.DoubleSide}),0,base+2.6,0,city);canal.rotation.x=-Math.PI/2;const count=26-tier*6;for(let i=0;i<count;i++){const a=i/count*Math.PI*2;const r=radius-1.6;const g=house(Math.cos(a)*r,Math.sin(a)*r,.56+rand()*.2,['#eac79f','#f0d7b0','#d1d6ba','#f0dec0'][i%4],city,base+2.5);g.rotation.y=-a+Math.PI/2;}}
cyl(0,12,0,2.5,3,4.5,'#eadac0',city,24);cyl(0,14.4,0,3.1,3.1,.5,'#f3e7c8',city,24);cyl(0,15.1,0,2.7,2.7,.7,'#71bbba',city,24);cyl(0,16.5,0,.3,.5,3,'#d9ceb0',city,12);sphere(0,18.1,0,.65,'#e6d6a2',city);
const falls=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const x=Math.cos(a)*2.4,z=Math.sin(a)*2.4;const f=cyl(x,11,z,.16,.4,7,'#7bc8c7',city,6);falls.push(f);}
// Gate and elevated canal bridge facing the arriving ship.
const gate=new T.Group();gate.position.set(0,1,13);city.add(gate);box(-2.3,2,0,1.5,4,2,'#e3d5b4',gate);box(2.3,2,0,1.5,4,2,'#e3d5b4',gate);box(0,4,0,6.2,1.1,2,'#dfcba5',gate);const bridge=mesh(new T.TorusGeometry(2.2,.5,6,20,Math.PI),'#e9daba',0,1.5,1.1,gate);for(let i=0;i<9;i++)box(0,1,15+i,3.5,.3,.9,'#cbbb99',city);
for(let i=0;i<14;i++){const a=i/14*Math.PI*2;box(Math.cos(a)*14.8,2,Math.sin(a)*14.8,1.5,1.6,1.2,'#e5d5b1',city)}
// Thousand Sunny: procedural, modelled details; no image backdrops.
const ship=new T.Group();ship.name='Thousand Sunny';scene.add(ship);
const cream='#fff1cf',red='#a82e27',gold='#e9ad32',dark='#283336',wood='#824b2a';
const round=(x,y,z,r,c,p,sx=1,sy=1,sz=1)=>{const o=mesh(new T.SphereGeometry(r,24,16),c,x,y,z,p);o.scale.set(sx,sy,sz);return o};
function ovalBand(y,rx,rz,color,tube=.06){const points=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;points.push(new T.Vector3(Math.sin(a)*rx,y,Math.cos(a)*rz))}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),64,tube,5,false),color,0,0,0,ship)}
round(0,.7,0,1,wood,ship,1.85,1.2,3.65);round(0,1.05,0,1,red,ship,1.88,.8,3.6);
const deck=cyl(0,1.55,0,1,1,.18,'#cda567',ship,48);deck.scale.set(1.7,1,3.35);
for(let j=-7;j<=7;j++){const z=j*.42;const w=3.2*Math.sqrt(Math.max(0,1-z*z/11.8));box(0,1.65,z,w,.02,.022,'#9b733f',ship)}
for(const y of [.45,.85,1.25])ovalBand(y,1.8,3.48,'#572f22',.025);ovalBand(1.68,1.76,3.37,cream,.13);ovalBand(1.84,1.72,3.34,gold,.06);
for(const side of [-1,1]){for(let i=0;i<9;i++){const z=-2.8+i*.68;const x=side*1.77*Math.sqrt(1-z*z/13);box(x,1.15,z,.12,.83,.35,i%2===0?cream:red,ship)}for(let i=0;i<3;i++){const port=new T.Group();port.position.set(side*1.88,.95,-1.5+i*1.45);port.rotation.y=side*Math.PI/2;ship.add(port);mesh(new T.TorusGeometry(.4,.08,8,24),gold,0,0,0,port);mesh(new T.CircleGeometry(.34,24),'#263b3d',0,0,.015,port);mesh(new T.TorusGeometry(.29,.025,6,24),cream,0,0,.03,port);}}
// Lawn deck and stern cabin with observation-room windows.
box(0,1.72,.5,2.8,.08,2.4,'#629649',ship);
const cabin=new T.Group();cabin.position.set(0,1.7,-2.1);ship.add(cabin);box(0,.65,0,2.4,1.3,1.65,cream,cabin);for(const side of [-1,1]){box(side*1.23,.68,0,.05,.64,1.05,'#43869a',cabin);for(let j=-1;j<=1;j++)box(side*1.27,.68,j*.32,.05,.8,.06,gold,cabin)}box(0,.65,.84,1.35,.65,.05,'#398694',cabin);for(let j=-2;j<=2;j++)box(j*.3,.65,.88,.05,.8,.05,gold,cabin);box(0,1.35,0,2.65,.18,1.85,red,cabin);
const dome=round(0,1.75,-.2,1,red,cabin,1.25,.65,.85);for(let j=-3;j<=3;j++)box(j*.34,1.6,.59,.11,.35,.11,gold,cabin);
const stern=cyl(0,1.05,-3.45,.62,.62,.45,'#273c40',ship,24);stern.rotation.x=Math.PI/2;const sternRing=mesh(new T.TorusGeometry(.65,.12,8,24),gold,0,1.05,-3.72,ship);
// Main mast, crow's nest and a bowed cream sail with Straw Hat crest.
function cloth(w,h,z,y,striped=false){const geo=new T.PlaneGeometry(w,h,24,18);const a=geo.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),py=a.getY(i);a.setZ(i,.55*Math.cos(x/w*Math.PI)*(1-.18*Math.cos(py/h*Math.PI)));}geo.computeVertexNormals();const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const c=canvas.getContext('2d');c.fillStyle='#fff0cc';c.fillRect(0,0,512,512);if(striped){c.fillStyle='#b3332b';for(let i=0;i<7;i++)if(i%2===0)c.fillRect(i*74,0,74,512);}else{c.strokeStyle='#263335';c.lineWidth=21;c.lineCap='round';for(const [x1,y1,x2,y2]of [[155,332,359,202],[155,202,359,332]]){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();for(const[x,y]of [[x1,y1],[x2,y2]]){c.beginPath();c.arc(x,y,15,0,Math.PI*2);c.fillStyle='#263335';c.fill();}}c.fillStyle='#263335';c.beginPath();c.ellipse(256,255,78,75,0,0,Math.PI*2);c.fill();c.fillRect(218,307,77,31);c.fillStyle='#fff0cc';for(const x of [227,284]){c.beginPath();c.ellipse(x,265,18,22,0,0,Math.PI*2);c.fill()}c.fillRect(235,313,5,21);c.fillRect(256,313,5,21);c.fillRect(277,313,5,21);c.fillStyle='#d9a435';c.beginPath();c.ellipse(256,202,63,42,0,Math.PI,Math.PI*2);c.fill();c.fillStyle='#b42b27';c.fillRect(194,193,124,13);c.fillStyle='#e6b84d';c.beginPath();c.ellipse(256,212,112,17,0,0,Math.PI*2);c.fill();}c.strokeStyle='#6c59412a';c.lineWidth=2;for(let i=0;i<9;i++){c.beginPath();c.moveTo(i*64,0);c.lineTo(i*64,512);c.stroke()}const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const sail=mesh(geo,new T.MeshStandardMaterial({map:tex,side:T.DoubleSide,roughness:1}),0,y,z,ship);return sail;}
cyl(0,4.8,.6,.12,.19,7.2,wood,ship,12);box(0,7.3,.6,4.65,.13,.13,wood,ship);cloth(4.55,3.8,.68,5.35);cyl(0,7.85,.6,.48,.36,.55,cream,ship,20);cyl(0,8.15,.6,.52,.52,.12,gold,ship,20);
cyl(0,4,-2,.1,.16,4.7,wood,ship,10);box(0,6.1,-2,3.5,.11,.11,wood,ship);cloth(3.4,2.5,-1.92,4.8,true);
for(const z of [.6,-2]){for(const side of [-1,1]){rod(new T.Vector3(0,z===.6?7.3:6.1,z),new T.Vector3(side*1.7,1.8,z+1),.025,'#5a4c35',ship);rod(new T.Vector3(0,z===.6?7.3:6.1,z),new T.Vector3(side*1.3,1.8,z-1),.025,'#5a4c35',ship);}}
const flag=mesh(new T.PlaneGeometry(.9,.48),new T.MeshStandardMaterial({color:'#202e31',side:T.DoubleSide}),.49,8.62,.6,ship);
// Sunny's lion/sun figurehead: orange petal mane, muzzle, ears and crossbones.
const lion=new T.Group();lion.position.set(0,2.05,3.55);lion.rotation.x=-.1;ship.add(lion);
for(const angle of [-.65,.65]){const bone=box(0,0,-.13,2.65,.17,.18,cream,lion);bone.rotation.z=angle;for(const side of [-1,1]){round(Math.cos(angle)*side*1.28,Math.sin(angle)*side*1.28,-.13,.18,cream,lion)}}
for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const petal=round(Math.sin(a)*.78,Math.cos(a)*.78,0,.32,'#dc7b24',lion,.7,1.55,.55);petal.rotation.z=-a;}
round(0,0,.08,.77,'#f4bd3a',lion,1,1,.42);round(-.53,.5,.15,.23,gold,lion);round(.53,.5,.15,.23,gold,lion);round(-.23,.15,.4,.11,dark,lion,1,1.3,.4);round(.23,.15,.4,.11,dark,lion,1,1.3,.4);round(-.17,-.18,.4,.27,'#ffdc71',lion,1,.8,.6);round(.17,-.18,.4,.27,'#ffdc71',lion,1,.8,.6);round(0,-.08,.57,.13,'#704229',lion,1,.8,.5);const smile=mesh(new T.TorusGeometry(.26,.036,6,24,Math.PI),'#704229',0,-.2,.58,lion);smile.rotation.z=Math.PI;
// Tangerine trees on the upper deck and white railings.
for(const x of [-.7,.7]){cyl(x,2.7,-2.45,.07,.1,.7,wood,ship,6);round(x,3.25,-2.45,.42,'#3c854a',ship);for(let i=0;i<4;i++)round(x+Math.sin(i*2)*.3,3.3+Math.cos(i)*.16,-2.15,.09,'#f59b26',ship);}
for(const side of [-1,1])for(let i=0;i<12;i++){const z=-2.8+i*.52;const x=side*1.68*Math.sqrt(1-z*z/13);cyl(x,1.95,z,.035,.035,.5,cream,ship,6);}ovalBand(2.2,1.65,3.2,cream,.045);
ship.scale.setScalar(1.12);

// Clouds and distant land keep the same continuous horizon throughout the route.
const clouds=[];for(let i=0;i<18;i++){const g=new T.Group();g.position.set(-65+rand()*205,24+rand()*16,-90+rand()*85);for(let j=0;j<4;j++)sphere(j*2.5,rand(),0,2.7,'#f2f0dc',g,1.5,.65,1);g.userData.origin=g.position.clone();clouds.push(g);scene.add(g)}for(let i=0;i<8;i++)sphere(-70+i*30,-1,-90-rand()*25,6+rand()*7,'#7daf9b',scene,1,.8,1);

// Break the circular shore into a natural scalloped coastline.
for(const terrain of foosha.children.slice(0,3)){const p=terrain.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x);const k=1+.07*Math.sin(a*3)+.04*Math.cos(a*7);p.setX(i,x*k);p.setZ(i,z*k)}terrain.geometry.computeVertexNormals();}
// Pasture fence, paths and Makino's harbour tavern details.
for(let i=0;i<12;i++){const x=-8+i*.62;box(x,2,4,.09,.8,.09,'#b69968',foosha);if(i<11){box(x+.3,2.22,4,.65,.065,.07,'#b69968',foosha);box(x+.3,1.94,4,.65,.065,.07,'#b69968',foosha)}}
for(let i=0;i<18;i++){const a=i*.3;const p=mesh(new T.CircleGeometry(.37,8),'#cbbd90',1+Math.sin(a)*2,1.43,3+i*.3,foosha);p.rotation.x=-Math.PI/2;}
const tavern=house(-7,5,1.15,'#e2d5ae',foosha);box(0,1.25,.87,1.7,.35,.12,'#466d56',tavern);for(let i=-3;i<=3;i++)box(i*.25,.88,.95,.2,.12,.35,i%2===0?'#cf7660':'#f4e0b6',tavern);
// Water 7 aqueduct arches, cascading waterways and fountain crown.
for(let tier=0;tier<3;tier++){const r=12-tier*3.2,base=1.4+tier*3.3;for(let j=0;j<16-tier*3;j++){const a=j/(16-tier*3)*Math.PI*2;const arch=new T.Group();arch.position.set(Math.cos(a)*(r+.08),base+.85,Math.sin(a)*(r+.08));arch.rotation.y=Math.PI/2-a;city.add(arch);box(0,0,0,.64,1.1,.06,'#536e73',arch);mesh(new T.TorusGeometry(.35,.085,6,16,Math.PI),'#ecd6b0',0,.55,.04,arch);box(-.35,-.03,.04,.12,1.1,.1,'#ecd6b0',arch);box(.35,-.03,.04,.12,1.1,.1,'#ecd6b0',arch);}
for(const a of [.45,2.3,3.75,5.2]){const channel=box(Math.cos(a)*(r+.26),base+1.05,Math.sin(a)*(r+.26),.72,3.0,.16,'#56bfc9',city);channel.rotation.y=Math.PI/2-a;falls.push(channel);}}
cyl(0,15.5,0,3.6,2.8,.75,'#e7e4cd',city,48);cyl(0,15.91,0,3.4,3.4,.13,'#459ead',city,48);
for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const curve=new T.QuadraticBezierCurve3(new T.Vector3(0,17.9,0),new T.Vector3(Math.cos(a)*2,20,Math.sin(a)*2),new T.Vector3(Math.cos(a)*3.3,15.9,Math.sin(a)*3.3));mesh(new T.TubeGeometry(curve,16,.045,5,false),'#9ce2df',0,0,0,city)}
// Galley-La-style shipyard cranes beside the outer docks.
for(const x of [-8,8]){const cg=new T.Group();cg.position.set(x,1,12);city.add(cg);rod(new T.Vector3(0,0,0),new T.Vector3(0,5,0),.13,'#684d35',cg);rod(new T.Vector3(0,5,0),new T.Vector3(0,5,4),.13,'#684d35',cg);rod(new T.Vector3(0,3,0),new T.Vector3(0,5,3),.09,'#684d35',cg);rod(new T.Vector3(0,5,4),new T.Vector3(0,2,4),.025,'#434a41',cg);}

// Batch static architecture by material, leaving the windmill and waterfalls animated.
function batchStatic(root,excluded){root.updateWorldMatrix(true,true);const groups=new Map();root.traverse(o=>{if(!o.isMesh)return;let ancestor=o;while(ancestor){if(excluded.has(ancestor))return;ancestor=ancestor.parent;}const key=o.material.uuid;if(!groups.has(key))groups.set(key,{material:o.material,items:[]});groups.get(key).items.push(o);});for(const {material,items} of groups.values()){if(items.length<2)continue;const geometries=items.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();return g.applyMatrix4(o.matrixWorld)});const merged=mergeGeometries(geometries);if(merged){scene.add(new T.Mesh(merged,material));items.forEach(o=>{o.removeFromParent();o.geometry.dispose()})}geometries.forEach(g=>g.dispose())}}
// Additional destinations, constructed entirely from reusable geometry.
const reverse=new T.Group();reverse.position.set(145,0,-130);scene.add(reverse);
cyl(0,-.5,0,12,10,2,'#c29a6b',reverse,24);
for(let i=0;i<5;i++){const x=-8+i*4;const peak=mesh(new T.ConeGeometry(5+rand()*2,14+rand()*9,7),'#9b7053',x,6,-3+rand()*3,reverse);peak.rotation.y=rand();}
const river=box(0,6.5,3,2,15,.18,'#69cbd0',reverse);river.rotation.x=-.3;
for(const x of [-1.3,1.3]){const edge=box(x,6.5,3,.22,15,.22,'#eeddb7',reverse);edge.rotation.x=-.3;}
const sky=new T.Group();sky.position.set(160,0,-610);scene.add(sky);
for(let i=0;i<18;i++){const a=i/18*Math.PI*2;sphere(Math.cos(a)*9,7+rand(),Math.sin(a)*7,3.2,'#f8f2e3',sky,1.3,.6,1)}
cyl(0,8,0,8,9,1,'#e8dfbe',sky,32);cyl(0,8.65,0,7.7,8,.35,'#b4c99b',sky,32);
for(const x of [-4,0,4]){for(const z of [-2,2]){cyl(x,11,z,.35,.45,5,'#f1e9d1',sky,12);cyl(x,13.6,z,.6,.6,.3,'#ddcfaa',sky,12);}}
box(0,14,0,10,.65,6,'#f5e9c9',sky);const templeRoof=mesh(new T.ConeGeometry(6.4,2.5,4),'#d5bc72',0,15.5,0,sky);templeRoof.rotation.y=Math.PI/4;
const bell=new T.Group();bell.position.set(0,11.5,1);sky.add(bell);cyl(0,0,0,.65,1.1,1.5,'#d0a333',bell,24);cyl(0,-.8,0,1.2,1.2,.2,'#e0b646',bell,24);sphere(0,-1,0,.15,'#ac782f',bell);for(let i=0;i<5;i++)box(0,8.8+i*.3,6-i*.7,3.5,.3,.7,'#e7d8b9',sky);
const egg=new T.Group();egg.position.set(-230,0,-850);scene.add(egg);cyl(0,.2,0,13,11,2,'#a7bcbc',egg,40);cyl(0,1.4,0,12.8,13,.6,'#f1ede0',egg,40);
const domeEgg=sphere(0,9,-2,6,'#eef0df',egg,1,1.35,1);const ring=mesh(new T.TorusGeometry(8,.22,8,64),'#d8714e',0,9,-2,egg);ring.rotation.x=Math.PI/2-.28;const ring2=mesh(new T.TorusGeometry(7.3,.14,6,64),'#b4d7d4',0,10,-2,egg);ring2.rotation.x=.4;ring2.rotation.y=.7;
box(0,7,3.58,7,1.3,.22,'#4c969d',egg);for(let j=-3;j<=3;j++)box(j,7,3.76,.06,1.4,.06,'#e6dab6',egg);
for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const x=Math.sin(a)*9,z=Math.cos(a)*9;cyl(x,3.3,z,1.4,1.4,3.5,'#e1e7d8',egg,16);sphere(x,5.3,z,1.65,i%2?'#d77c58':'#78afb6',egg,1,.6,1);cyl(x,2.5,z,1.45,1.45,.3,'#579ba0',egg,16);}
for(const x of [-7,7]){cyl(x,7,0,.25,.35,12,'#d9dfcc',egg,12);sphere(x,13.2,0,1,'#ebba67',egg);mesh(new T.TorusGeometry(1.4,.08,6,24),'#bd714e',x,13.2,0,egg).rotation.x=Math.PI/2;}
const haven=new T.Group();haven.position.set(80,0,-1170);scene.add(haven);cyl(0,.2,0,9,8,2,'#dbbd82',haven,32);cyl(0,1.3,0,8.5,9,.4,'#b3b880',haven,32);cyl(-3,5,0,1,1.5,7,'#f0ddae',haven,16);cyl(-3,8.7,0,1.4,1.4,.5,'#ba6246',haven,16);cyl(-3,9.5,0,.85,.85,1.2,'#f3c662',haven,16);mesh(new T.ConeGeometry(1.5,1,16),'#ac5a43',-3,10.5,0,haven);
for(const x of [2,5]){tree(x,-2,1.4,haven);tree(x,3,1,haven)}for(let j=0;j<12;j++)box(0,1.2,7+j*.55,3,.18,.5,'#a2794a',haven);
batchStatic(reverse,new Set());batchStatic(sky,new Set());batchStatic(egg,new Set());batchStatic(haven,new Set());

batchStatic(foosha,new Set([blades]));batchStatic(city,new Set(falls));
function batchShip(){ship.updateMatrixWorld(true);const inv=new T.Matrix4().copy(ship.matrixWorld).invert();const groups=new Map();ship.traverse(o=>{if(!o.isMesh||o.material.map)return;const k=o.material.uuid;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(o)});for(const items of groups.values()){if(items.length<2)continue;const gs=items.map(o=>(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld)));const g=mergeGeometries(gs);if(g){const m=new T.Mesh(g,items[0].material);ship.add(m);items.forEach(o=>{o.removeFromParent();o.geometry.dispose()})}gs.forEach(x=>x.dispose())}}batchShip();
const stops=[
{id:'foosha',label:'FOOSHA VILLAGE',at:new T.Vector3(0,2,1),boat:new T.Vector3(6,.3,17),eye:new T.Vector3(24,16,38)},
{id:'about',label:'REVERSE MOUNTAIN',at:new T.Vector3(145,5,-130),boat:new T.Vector3(145,.3,-105),eye:new T.Vector3(175,19,-89)},
{id:'water7',label:'WATER 7',at:new T.Vector3(-130,5,-330),boat:new T.Vector3(-137,.3,-306),eye:new T.Vector3(-96,23,-289)},
{id:'projects',label:'SKYPIEA',at:new T.Vector3(160,10,-610),boat:new T.Vector3(156,.3,-584),eye:new T.Vector3(192,27,-568)},
{id:'egghead',label:'EGGHEAD',at:new T.Vector3(-230,6,-850),boat:new T.Vector3(-239,.3,-824),eye:new T.Vector3(-196,22,-807)},
{id:'contact',label:'THE NEW WORLD',at:new T.Vector3(80,3,-1170),boat:new T.Vector3(78,.3,-1145),eye:new T.Vector3(107,17,-1132)}
];stops.slice(1).forEach(s=>{s.boat.x=s.at.x+8;s.boat.z=s.at.z+19;});const chapters=stops.map(s=>document.getElementById(s.id));
const route=new T.CatmullRomCurve3(stops.map(s=>s.boat));
const trail=new T.Line(new T.BufferGeometry().setFromPoints(route.getPoints(180)),new T.LineDashedMaterial({color:'#dcebc9',dashSize:.7,gapSize:.7,transparent:true,opacity:.35}));trail.computeLineDistances();scene.add(trail);
// Cloud terraces extend Skypiea upward while retaining its original island.
const skyTerraces=new T.Group();scene.add(skyTerraces);
const projectCount=document.querySelectorAll('.discovery').length;for(let i=1;i<projectCount;i++){const g=new T.Group();g.position.set(160+Math.sin(i*1.1)*8,8+i*6,-610-i*3);for(let j=0;j<4;j++)sphere((j-1.5)*2.5,0,Math.sin(j)*1.5,2.6,'#f3eee0',g,1.35,.35,1);skyTerraces.add(g)}
const crew=createStrawHats(ship);let crewFocus=-1;
const crewSelect=document.getElementById('crew-select');crew.forEach((person,i)=>{const option=document.createElement('option');option.value=i;option.textContent=person.name;crewSelect.append(option)});
scene.traverse(o=>{if(o.isMesh&&o!==water){o.castShadow=true;o.receiveShadow=true;}});
// Match foliage and distant-cloud shadow behavior to the ground lighting.
scene.traverse(o=>{if(o.isMesh&&o.material.color?.getHexString()==='f2f0dc')o.castShadow=false;});
let progress=0,targetProgress=0,exploring=false,inspectShip=false,yaw=0,pitch=0,drag=null,frame=0,last=0,moving=!matchMedia('(prefers-reduced-motion: reduce)').matches;const pref=matchMedia('(prefers-reduced-motion: reduce)');
const tmp=new T.Vector3(),lookAt=new T.Vector3(),camPos=new T.Vector3();
function readScroll(){if(exploring)setExplore(false);targetProgress=T.MathUtils.clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight),0,1);requestFrame()}
const landmark=document.getElementById('landmark'),landmarkName=document.getElementById('landmark-name'),landmarkNote=document.getElementById('landmark-note');
const notes=['01 / THE BEGINNING','02 / A NEW PERSPECTIVE','03 / THE WORKSHOP','04 / '+projectCount+' DISCOVERIES','05 / KNOWLEDGE & MILESTONES','06 / THE NEXT ADVENTURE'];
const discoveries=[...document.querySelectorAll('.discovery')];
const projected=new T.Vector3(),tangent=new T.Vector3(),eyeOffset=new T.Vector3(),aimOffset=new T.Vector3();
const wake=new T.Group();for(let i=0;i<3;i++){const m=new T.Mesh(new T.RingGeometry(1+i*.6,1.055+i*.6,36,1,0,Math.PI),new T.MeshBasicMaterial({color:'#e1eed3',transparent:true,opacity:.28-i*.06,side:T.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.z=-3-i*1.1;m.scale.set(1,2,1);wake.add(m)}scene.add(wake);
let previousScroll=scrollY,scrollEnergy=0,previousDestination='';
function paint(now){
 frame=0;if(document.hidden||document.body.classList.contains('reading-view')||document.body.classList.contains('artifact-opened'))return;
 const dt=Math.min((now-last)/1000,.05)||.016;last=now;progress=targetProgress;
 const sy=scrollY,t=progress;scrollEnergy=moving?T.MathUtils.damp(scrollEnergy,Math.min(1,Math.abs(sy-previousScroll)/80),18,dt):0;previousScroll=sy;
 let index=0;for(let i=0;i<chapters.length;i++)if(sy+(mobile()?host.getBoundingClientRect().bottom+28:0)>=chapters[i].offsetTop-2)index=i;
 const current=stops[index],next=stops[Math.min(index+1,stops.length-1)],length=chapters[index].offsetHeight;
 const local=T.MathUtils.clamp((sy-chapters[index].offsetTop)/length,0,1);
 const departure=Math.max(innerHeight*.7,length-innerHeight*.8);
 const blend=index===stops.length-1?0:T.MathUtils.smoothstep(sy-chapters[index].offsetTop,departure,length);
 const routeT=(index+blend)/(stops.length-1),pos=route.getPoint(routeT);ship.position.copy(pos);
 tangent.copy(route.getTangent(Math.min(.9999,routeT)));ship.rotation.y=Math.atan2(tangent.x,tangent.z);
 ship.position.y+=moving?Math.sin(now*.0018)*.10:0;ship.rotation.z=moving?Math.sin(now*.0015)*.025+Math.sin(blend*Math.PI)*.045:0;
 eyeOffset.copy(current.eye).sub(current.boat).lerp(tmp.copy(next.eye).sub(next.boat),blend);
 aimOffset.copy(current.at).sub(current.boat).lerp(tmp.copy(next.at).sub(next.boat),blend);
 lookAt.copy(pos).add(aimOffset);camPos.copy(pos).add(eyeOffset);
 const climb=index===3?T.MathUtils.clamp((sy-chapters[index].offsetTop-innerHeight*.35)/Math.max(1,departure-innerHeight*.35),0,1)*Math.max(0,projectCount-1)*6*(1-blend):0;
 if(!exploring){camPos.y+=climb;lookAt.y+=climb;ship.position.y+=climb;}
 skyTerraces.visible=index===3;trail.visible=index!==3;
 if(moving&&!exploring){const orbit=camPos.clone().sub(lookAt);orbit.applyAxisAngle(new T.Vector3(0,1,0),Math.sin(local*Math.PI)*(index===1?.34:index===2?.4:.13));camPos.copy(lookAt).add(orbit);}
 const sunset=index===5?1:index===4?blend:0;scene.background.set('#b7dedb').lerp(new T.Color('#efc6a2'),sunset);scene.fog.color.copy(scene.background);
 if(mobile()){camPos.y+=6;camPos.z+=8;lookAt.lerp(tmp.copy(ship.position).add(new T.Vector3(0,5,0)),.2); }
 if(inspectShip){lookAt.copy(ship.position).add(new T.Vector3(0,3.3,0));camPos.copy(ship.position).add(new T.Vector3(mobile()?17:16,12,mobile()?25:22).applyAxisAngle(new T.Vector3(0,1,0),ship.rotation.y));}
 if(exploring){const offset=camPos.clone().sub(lookAt);const sph=new T.Spherical().setFromVector3(offset);sph.theta+=yaw;sph.phi=T.MathUtils.clamp(sph.phi+pitch,.2,1.45);camPos.copy(lookAt).add(offset.setFromSpherical(sph));}
 if(crewFocus>=0){const person=crew[crewFocus];ship.updateWorldMatrix(true,true);person.getWorldPosition(lookAt);lookAt.y+=.7*person.scale.y;camPos.copy(lookAt).add(new T.Vector3((person.position.x<0?-1:1)*3.1*Math.cos(yaw),2.1+pitch,1+Math.sin(yaw)*2.5).applyAxisAngle(new T.Vector3(0,1,0),ship.rotation.y));}
 const vw=mobile()?host.clientWidth:innerWidth,vh=mobile()?host.clientHeight:innerHeight;
 if(renderer.domElement.clientHeight!==vh||Math.abs(camera.aspect-vw/vh)>.001){renderer.setSize(vw,vh);camera.aspect=vw/vh;camera.updateProjectionMatrix();}
 if(exploring||mobile())camera.clearViewOffset();else camera.setViewOffset(vw,vh,-vw*.23*(window.voyageComposition??1),0,vw,vh);
 camera.position.copy(camPos);camera.lookAt(lookAt);camera.updateMatrixWorld();sun.target.position.copy(lookAt);sun.position.copy(lookAt).add(new T.Vector3(-25,42,25));
 if(moving){waterMat.uniforms.time.value=now*.00085;blades.rotation.z=now*.0003;falls.forEach((f,i)=>{f.scale.x=.9+Math.sin(now*.003+i)*.1;});}
 clouds.forEach((c,i)=>{c.position.copy(c.userData.origin);c.position.x+=lookAt.x+(moving?Math.sin(now*.00009+i)*7:0);c.position.z+=lookAt.z-25;});
 wake.position.copy(ship.position);wake.position.y=.10;wake.rotation.y=ship.rotation.y;wake.visible=!exploring;wake.scale.setScalar(1+scrollEnergy*.35);
 projected.copy(current.at).add(new T.Vector3(0,index===3?9+climb:13,0)).project(camera);
 landmark.style.left=T.MathUtils.clamp((projected.x*.5+.5)*innerWidth,innerWidth*.15,innerWidth*.86)+'px';landmark.style.top=T.MathUtils.clamp((-projected.y*.5+.5)*innerHeight,110,innerHeight*.46)+'px';landmark.style.opacity=String(1-Math.sin(blend*Math.PI));
 if(previousDestination!==current.id){landmarkName.textContent=current.label;landmarkNote.textContent=notes[index];previousDestination=current.id;document.body.dataset.destination=current.id;document.querySelector('#destination').value=current.id;document.querySelectorAll('[data-sail]').forEach(b=>{b.classList.toggle('active',b.dataset.sail===current.id);if(b.dataset.sail===current.id)b.setAttribute('aria-current','location');else b.removeAttribute('aria-current')});}
 if(index===3){let active=0;discoveries.forEach((entry,i)=>{if(entry.getBoundingClientRect().top<innerHeight*.7)active=i;});landmarkNote.textContent='DISCOVERY '+String(active+1).padStart(2,'0')+' / '+String(projectCount).padStart(2,'0')+' · '+discoveries[active].querySelector('h3').textContent;}
 document.body.style.setProperty('--speed',String(scrollEnergy*Math.sin(blend*Math.PI)*.65));document.querySelector('#route-ship').style.left=t*100+'%';document.querySelector('#position').textContent=blend>.03?'SAILING TO '+next.label:current.label;
 renderer.render(scene,camera);if(moving)requestFrame();
}
function requestFrame(){if(!frame)frame=requestAnimationFrame(paint)}
function setExplore(value){exploring=value;document.body.classList.toggle('exploring',value);document.querySelector('main').inert=value;document.querySelector('#look').setAttribute('aria-pressed',String(value));document.querySelector('#look').textContent=value?'Return to voyage ×':'Look around ⊹';document.querySelector('#explore-help').hidden=!value;if(value)host.focus({preventScroll:true});else{yaw=0;pitch=0;inspectShip=false;crewFocus=-1;document.getElementById('crew-panel').hidden=true;}document.querySelector('#inspect-sunny').setAttribute('aria-pressed',String(inspectShip));requestFrame();}
function showCrew(i){crewFocus=Number(i);inspectShip=false;setExplore(true);document.getElementById('crew-panel').hidden=false;document.getElementById('crew-select').value=String(crewFocus);document.getElementById('crew-title').textContent=crew[crewFocus].name;yaw=.15;pitch=0;requestFrame();}
document.getElementById('crew-open').addEventListener('click',()=>showCrew(0));crewSelect.addEventListener('change',e=>showCrew(e.target.value));document.getElementById('crew-next').addEventListener('click',()=>showCrew((crewFocus+1)%crew.length));document.getElementById('crew-prev').addEventListener('click',()=>showCrew((crewFocus+crew.length-1)%crew.length));
document.querySelector('#inspect-sunny').addEventListener('click',()=>{crewFocus=-1;document.getElementById('crew-panel').hidden=true;inspectShip=!inspectShip;yaw=0;pitch=0;setExplore(inspectShip)});
document.querySelector('#look').addEventListener('click',()=>setExplore(!exploring));document.querySelector('#reset').addEventListener('click',()=>{yaw=0;pitch=0;requestFrame()});host.addEventListener('pointerdown',e=>{if(!exploring)return;drag={x:e.clientX,y:e.clientY};host.setPointerCapture(e.pointerId)});host.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag.x)*.006;pitch-=(e.clientY-drag.y)*.004;pitch=T.MathUtils.clamp(pitch,-.6,.6);drag={x:e.clientX,y:e.clientY};requestFrame()});host.addEventListener('pointerup',()=>drag=null);host.addEventListener('pointercancel',()=>drag=null);
addEventListener('keydown',e=>{if(e.target.matches('select,input,textarea,button')){if(e.key==='Escape')setExplore(false);return}if(e.key==='Escape')setExplore(false);if(exploring&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')yaw+=.1;if(e.key==='ArrowRight')yaw-=.1;if(e.key==='ArrowUp')pitch-=.06;if(e.key==='ArrowDown')pitch+=.06;requestFrame()}});
window.addEventListener('voyage-navigate',()=>setExplore(false));function setMotion(v){moving=v;document.documentElement.classList.toggle('still',!v);document.querySelector('#motion').setAttribute('aria-pressed',String(v));document.querySelector('#motion').textContent=v?'Motion on':'Motion off';requestFrame()};document.querySelector('#motion').addEventListener('click',()=>setMotion(!moving));pref.addEventListener('change',()=>setMotion(!pref.matches));addEventListener('scroll',readScroll,{passive:true});addEventListener('resize',()=>{camera.aspect=(mobile()?host.clientWidth/host.clientHeight:innerWidth/innerHeight);camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1.25:1.7));renderer.shadowMap.enabled=!mobile();renderer.setSize(mobile()?host.clientWidth:innerWidth,mobile()?host.clientHeight:innerHeight);readScroll()});document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestFrame()});renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();moving=false;window.enableReadingView();});setMotion(moving);readScroll();document.querySelector('#loading').hidden=true;document.body.dataset.render='ready';
window.addEventListener('voyage-resume',()=>{last=0;readScroll()});
// Read-only diagnostics used for verifying that the prototype renders real geometry.
window.voyageDiagnostics=()=>({progress,destination:document.body.dataset.destination,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,crew:crew.map(p=>p.name),crewFocus,exploring,inspectShip,yaw,pitch,moving,cameraHeight:camera.position.y});

document.getElementById("crew-close")?.addEventListener("click",()=>setExplore(false));
