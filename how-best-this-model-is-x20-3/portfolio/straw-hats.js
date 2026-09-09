import * as T from './vendor/three.module.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';

// Hand-built, cel-shaded crew studies. All coordinates are local to the deck.
export function createStrawHats(ship) {
  const bands = new T.DataTexture(new Uint8Array([65,130,205,255]),4,1,T.RedFormat);
  bands.minFilter=bands.magFilter=T.NearestFilter; bands.needsUpdate=true;
  const palette=new Map();
  function material(color){if(!palette.has(color))palette.set(color,new T.MeshToonMaterial({color,gradientMap:bands}));return palette.get(color);}
  const ink=new T.ShaderMaterial({side:T.BackSide,vertexShader:'void main(){vec3 p=position+normal*0.0025;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',fragmentShader:'void main(){gl_FragColor=vec4(0.12,0.15,0.18,1.);}'});
  const skin='#e9ad7d',black='#18222d',ivory='#fff3d1';
  function add(g,c,p,x=0,y=0,z=0){const o=new T.Mesh(g,material(c));o.position.set(x,y,z);p.add(o);return o;}
  function ell(p,x,y,z,rx,ry,rz,c){const o=add(new T.SphereGeometry(1,16,12),c,p,x,y,z);o.scale.set(rx,ry,rz);return o;}
  function box(p,x,y,z,w,h,d,c){return add(new T.BoxGeometry(w,h,d),c,p,x,y,z);}
  function cylinder(p,x,y,z,rt,rb,h,c){return add(new T.CylinderGeometry(rt,rb,h,14),c,p,x,y,z);}
  function link(p,a,b,r,c){const va=new T.Vector3(...a),vb=new T.Vector3(...b),d=vb.clone().sub(va);const o=cylinder(p,0,0,0,r*.9,r,d.length(),c);o.position.copy(va).add(vb).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
  function ring(p,x,y,z,r,t,c){return add(new T.TorusGeometry(r,t,6,22),c,p,x,y,z);}
  function face(p,y,c=skin,skull=false){
    ell(p,0,y,0,.119,.155,.108,c);ell(p,-.119,y-.005,0,.023,.036,.019,c);ell(p,.119,y-.005,0,.023,.036,.019,c);
    for(const side of [-1,1]){ell(p,side*.044,y+.017,.094,.025,.019,.009,skull?black:ivory);if(!skull){ell(p,side*.044,y+.017,.107,.008,.013,.005,black);box(p,side*.044,y+.051,.098,.06,.01,.012,black).rotation.z=-side*.12;}}
    ell(p,0,y-.015,.113,.018,.024,.028,c);
    const mouth=add(new T.TorusGeometry(.031,.003,6,16,Math.PI),black,p,0,y-.06,.106);mouth.rotation.z=Math.PI;mouth.scale.y=.4;
  }
  function spikes(p,y,color,count=13){
    ell(p,0,y+.105,-.012,.123,.08,.113,color);
    for(let i=0;i<count;i++){const a=i/count*Math.PI*2;const o=add(new T.ConeGeometry(.039,.105,4),color,p,Math.sin(a)*.105,y+.09,Math.cos(a)*.092);o.rotation.z=-Math.sin(a)*.8;o.rotation.x=Math.cos(a)*.7;}
  }
  function human(name,opts={}){
    const root=new T.Group();root.name=name;const p=new T.Group();root.add(p);const leg=opts.legs||'#213442',top=opts.top||'#b3382e',skinColor=opts.skin||skin;
    for(const side of [-1,1]){link(p,[side*.065,.12,0],[side*.065,.53,0],.043,leg);ell(p,side*.065,.07,.055,.054,.045,.108,opts.shoes||black);}
    const torso=cylinder(p,0,.72,0,.125,.09,.38,top);torso.scale.z=.64;
    cylinder(p,0,.95,0,.032,.042,.09,skinColor);
    for(const side of [-1,1]){const elbow=[side*.2,.67,.015],hand=[side*.2,.49,.075];link(p,[side*.115,.87,0],elbow,.035,opts.sleeves||top);link(p,elbow,hand,.029,opts.sleeves||skinColor);ell(p,...hand,.035,.043,.028,skinColor);}
    face(p,1.09,skinColor);root.userData.body=p;root.userData.name=name;return root;
  }
  const crew=[];
  function place(root,x,z,scale=1,y=1.76,turn=0){root.position.set(x,y,z);root.scale.setScalar(scale);root.rotation.y=turn;ship.add(root);crew.push(root);return root.userData.body;}
  // Luffy: open red vest, shorts, sandals and the straw hat.
  const luffy=human('Monkey D. Luffy',{top:'#c72c29',legs:'#2e70ae',shoes:'#9b683d'});let p=place(luffy,-.55,2.03,1.1,1.78,.15);
  box(p,0,.73,.081,.105,.34,.017,skin);box(p,0,.535,0,.24,.065,.19,'#ecb739');for(const side of [-1,1]){box(p,side*.065,.32,.01,.095,.16,.09,skin);box(p,side*.065,.41,.015,.108,.04,.12,ivory);box(p,side*.065,.10,.06,.047,.035,.13,skin);}
  spikes(p,1.09,black);cylinder(p,0,1.24,0,.225,.225,.026,'#d9b35c');ell(p,0,1.27,0,.15,.073,.14,'#e6c57b');cylinder(p,0,1.257,0,.152,.152,.029,'#bd3828');box(p,.067,1.048,.107,.04,.006,.006,'#805337');
  // Zoro: green coat, red sash and three sheathed swords.
  const zoro=human('Roronoa Zoro',{top:'#285f47',legs:'#244737',sleeves:skin});p=place(zoro,.72,1.60,1.13,1.78,-.35);spikes(p,1.09,'#437844',19);box(p,0,.7,.083,.09,.30,.018,skin);box(p,0,.55,0,.26,.075,.2,'#983740');for(let i=0;i<3;i++){const sword=new T.Group();sword.position.set(-.16,.6,-.04+i*.055);sword.rotation.z=-.55; p.add(sword);cylinder(sword,0,-.2,0,.016,.019,.7,['#eae6d2','#382750','#742e36'][i]);cylinder(sword,0,.22,0,.023,.023,.15,'#2c302c');ring(sword,0,.14,0,.043,.008,'#d2b260').rotation.x=Math.PI/2;}box(p,-.045,1.11,.114,.009,.10,.005,'#795645');
  // Nami: long orange hair, striped top and jeans.
  const nami=human('Nami',{top:'#4c9a79',legs:'#336a9e',sleeves:skin,shoes:'#b27441'});p=place(nami,-1.04,.88,1.01,1.78,-.45);ell(p,0,1.18,-.04,.129,.095,.105,'#e07825');for(const side of [-1,1])ell(p,side*.106,.99,-.053,.038,.235,.05,'#e8892b');box(p,0,.63,.082,.17,.11,.015,skin);box(p,0,.79,.09,.23,.027,.01,ivory);box(p,0,.86,.09,.21,.022,.01,ivory);link(p,[.24,.5,.08],[.24,1.05,.08],.018,'#76b2c5');
  // Usopp: long nose, white cap, goggles and suspenders.
  const usopp=human('Usopp',{top:skin,legs:'#b59653',skin:'#c68d60',sleeves:'#c68d60'});p=place(usopp,.95,.48,1.05,1.78,.25);ell(p,0,1.079,.18,.025,.025,.095,'#c68d60');spikes(p,1.08,black);ell(p,0,1.22,0,.155,.07,.135,ivory);for(const side of [-1,1]){ring(p,side*.065,1.22,.117,.046,.012,'#866a35');box(p,side*.07,.76,.086,.027,.35,.024,'#716b42');}ell(p,0,.64,-.105,.12,.16,.055,'#6f5736');
  // Sanji: dark double-breasted suit and asymmetrical blond fringe.
  const sanji=human('Sanji',{top:'#202835',legs:'#202835',sleeves:'#202835'});p=place(sanji,-1.04,-.20,1.12,1.78,-.75);ell(p,0,1.19,-.005,.128,.067,.109,'#e7c563');const fringe=ell(p,-.064,1.115,.097,.059,.115,.03,'#e9cb71');fringe.rotation.z=-.25;box(p,0,.87,.087,.085,.075,.014,'#679aba');box(p,0,.815,.102,.018,.13,.015,'#151e28');for(const side of [-1,1])for(let i=0;i<3;i++)ell(p,side*.052,.68+i*.054,.09,.009,.009,.005,'#c9aa61');box(p,.028,1.047,.11,.032,.012,.01,'#887248');
  // Chopper: reindeer muzzle, blue cap, pink brim, cross and antlers.
  const chopper=new T.Group();chopper.name='Tony Tony Chopper';chopper.userData.name=chopper.name;p=new T.Group();chopper.add(p);chopper.userData.body=p;
  ell(p,0,.3,0,.135,.17,.1,'#af7043');for(const side of [-1,1]){ell(p,side*.078,.07,.015,.05,.07,.065,'#674939');link(p,[side*.105,.37,0],[side*.18,.24,.06],.035,'#b77f52');}face(p,.57,'#c78f60');ell(p,0,.53,.14,.077,.047,.06,'#e9c698');ell(p,0,.565,.196,.018,.018,.015,'#4396b8');ell(p,0,.74,0,.20,.10,.18,'#64bace');cylinder(p,0,.68,0,.215,.215,.055,'#c94f78');box(p,0,.775,.167,.029,.102,.016,ivory);box(p,0,.775,.167,.092,.028,.018,ivory);for(const side of [-1,1]){link(p,[side*.16,.73,0],[side*.29,.94,-.01],.021,'#885d39');link(p,[side*.24,.85,0],[side*.37,.9,0],.017,'#885d39');link(p,[side*.29,.94,0],[side*.26,1.01,0],.015,'#885d39');}place(chopper,-.97,1.72,.92,1.78,-.9);
  // Robin: long dark hair, sunglasses and purple skirt.
  const robin=human('Nico Robin',{top:'#304d89',legs:skin,sleeves:skin,shoes:'#5c365b'});p=place(robin,1.04,-.45,1.13,1.78,.65);ell(p,0,1.18,-.025,.127,.08,.107,black);ell(p,0,1.00,-.08,.12,.24,.07,black);for(const side of [-1,1]){ell(p,side*.108,1.03,-.012,.033,.2,.045,black);ring(p,side*.046,1.205,.09,.031,.007,'#7b7594');}const skirt=cylinder(p,0,.49,0,.09,.16,.3,'#855b91');skirt.scale.z=.68;box(p,0,.84,.089,.027,.23,.016,'#d4b284');
  // Franky: broad cyborg torso, blue hair, red shoulders and oversized forearms.
  const franky=human('Franky',{top:skin,legs:skin,sleeves:skin,shoes:'#273748'});p=place(franky,-.77,-1.18,1.15,1.78,-.3);ell(p,0,.77,0,.23,.22,.14,skin);for(const side of [-1,1]){ell(p,side*.25,.87,0,.14,.14,.14,'#c63832');ell(p,side*.29,.59,.07,.105,.16,.11,'#87b4ba');box(p,side*.29,.62,.18,.07,.07,.02,'#265d94').rotation.z=Math.PI/4;}box(p,0,.51,0,.3,.11,.23,'#2f6797');spikes(p,1.12,'#3a92a7',8);ell(p,0,1.29,-.02,.058,.11,.08,'#4798b1');box(p,0,1.125,.1,.19,.038,.02,'#252d35');
  // Brook: tall skeleton, afro, top hat, orange boa and cane.
  const brook=human('Brook',{top:'#263545',legs:'#263545',sleeves:'#263545',skin:ivory});p=place(brook,.68,-1.18,1.28,1.78,.5);ell(p,0,1.12,-.04,.20,.22,.14,black);face(p,1.10,ivory,true);for(let i=-2;i<=2;i++)box(p,i*.023,1.035,.108,.012,.036,.008,black);cylinder(p,0,1.35,-.025,.20,.20,.028,'#17252c');cylinder(p,0,1.46,-.025,.125,.14,.21,'#17252c');cylinder(p,0,1.39,-.025,.14,.14,.05,'#b77944');for(let i=0;i<7;i++){const a=i/7*Math.PI*2;ell(p,Math.cos(a)*.16,.89,Math.sin(a)*.10,.06,.075,.055,'#dca545');}link(p,[.24,.04,.12],[.24,.64,.12],.017,'#886535');
  // Jinbe: blue skin, swept hair, tusks, a broad patterned kimono and sash.
  const jinbe=human('Jinbe',{top:'#c78135',legs:'#b56b28',skin:'#80b9c3',sleeves:'#c78135',shoes:'#544534'});p=place(jinbe,1.08,-1.35,1.17,3.15,.9);ell(p,0,.68,0,.255,.31,.19,'#ce9143');ell(p,0,1.07,0,.17,.17,.13,'#84c2cc');for(const side of [-1,1]){ell(p,side*.062,1.10,.122,.019,.014,.009,black);add(new T.ConeGeometry(.024,.10,8),ivory,p,side*.09,.99,.13);ell(p,side*.17,1.01,-.02,.04,.12,.08,'#23363b');}spikes(p,1.16,'#24383d');box(p,0,.58,.178,.46,.10,.045,'#6d527c');for(let i=-1;i<=1;i++){const patch=box(p,i*.13,.76,.19,.065,.065,.012,'#233b42');patch.rotation.z=Math.PI/4;} 
  // Merge each person by material; retain a selectable root and ink silhouette.
  for(const root of crew){root.rotation.y=root.position.x<0?-.9:.9;root.updateWorldMatrix(true,true);const inv=root.matrixWorld.clone().invert(),groups=new Map();root.traverse(o=>{if(o.isMesh){const key=o.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o)}});for(const items of groups.values()){const parts=items.map(o=>(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld)));const geo=mergeGeometries(parts);if(geo){const combined=new T.Mesh(geo,items[0].material);combined.castShadow=true;combined.receiveShadow=true;root.add(combined);const outline=new T.Mesh(geo,ink);root.add(outline);items.forEach(o=>{o.removeFromParent();o.geometry.dispose()});}parts.forEach(g=>g.dispose());}root.userData.baseY=root.position.y;}
  return crew;
}
