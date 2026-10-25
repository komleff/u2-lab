import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadCandidateCatalog,getPresetFit} from '../../../src/fitting/catalog.ts';
import {validateShipModelFit} from '../../../src/model/v3/schema.ts';
const catalog:any=loadCandidateCatalog('ship-fitting-0.3.3');
const refs:any={sputnik:'sputnik-d','severin-mir':'severin-mir-d','stealth-reference':'stealth-reference',pony:'pony-d','industrial-S':'ermak-d','civilian-M':'volna-m-h','industrial-M':'titan-d'};
const sha=(x:any)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const sizes=['XS','S','M','L','XL'];
const geometry=(m:any,s:any)=>m.category===s.category&&m.formFactor===s.formFactor&&sizes.indexOf(m.size)<=sizes.indexOf(s.size);
function put(f:any,slot:string,itemId:string){const id=f.assignments[slot]??'audit:'+slot;f.assignments[slot]=id;f.instances[id]={id,itemId,enabled:true};}
function sources(f:any,c:any){const h=c.hulls.find((h:any)=>h.id===f.hullId);for(const species of ['diesel','hydrogen']){const roster=[...h.builtins.map((b:any)=>b.item),...Object.values(f.instances).map((i:any)=>f.localVariants[i.itemId]??c.items[i.itemId])];if(roster.some((m:any)=>m.family==='tank'&&m.species===species))continue;const slots=h.slots.filter((s:any)=>s.category==='power');const slot=slots.find((s:any)=>!f.assignments[s.id])??slots.find((s:any)=>{const i=f.instances[f.assignments[s.id]],m=i&&(f.localVariants[i.itemId]??c.items[i.itemId]);return m?.family==='generator'||m?.family==='solar'||m?.family==='battery'&&roster.filter((x:any)=>x.family==='battery').length>1;});if(!slot)throw Error('No source slot '+h.id);put(f,slot.id,'tank-'+species+'-'+(h.size==='M'?'M':'S'));}}
const validation:any[]=[],matrix:any[]=[];
function measure(name:string,f:any,c=catalog){const v=validateShipModelFit(f,c,true);const row={name,hull:f.hullId,inputHash:sha({fit:f,catalog:c}),ok:v.ok,errors:v.ok?[]:v.errors};validation.push(row);return row;}
for(const hull of catalog.hulls){
 const base:any=getPresetFit(refs[hull.id],catalog.version);measure('stock',base);
 for(const item of Object.values(catalog.items)as any[]){const geometric=hull.slots.filter((s:any)=>geometry(item,s));const allowed=geometric.filter((s:any)=>s.families.includes(item.family));matrix.push({hull:hull.id,item:item.id,family:item.family,geometricSlots:geometric.map((s:any)=>s.id),familyAllowedSlots:allowed.map((s:any)=>s.id)});}
 for(const itemId of ['electric-heater-S','furnace-diesel-S','furnace-hydrogen-S','pump-radiator-S','shielding-S','sensor-S','gyrodyne-S','ram-S','shell-S']){
  const item=catalog.items[itemId],slot=hull.slots.find((s:any)=>geometry(item,s)&&(!itemId.startsWith('gyrodyne')||s.role==='turn'));
  if(!slot)throw Error('Missing geometric slot '+hull.id+' '+itemId);
  const f=structuredClone(base);put(f,slot.id,itemId);sources(f,catalog);measure('mount:'+itemId,f);
  if(!slot.families.includes(item.family)){const c=structuredClone(catalog);c.hulls.find((h:any)=>h.id===hull.id).slots.find((s:any)=>s.id===slot.id).families.push(item.family);measure('family-only-control:'+itemId,f,c);}
 }
 const mixed=structuredClone(base);for(const [role,type]of [['march','hydrogen'],['retro','diesel'],['strafe','electric'],['turn','electric']])put(mixed,role,'engine-'+type+'-S-'+(['strafe','turn'].includes(role)?'pair':'single'));sources(mixed,catalog);measure('mixed-with-sources',mixed);
 if(['D','H'].includes(hull.architecture)){const f=structuredClone(base),type=hull.architecture==='D'?'hydrogen':'diesel';for(const role of ['march','retro','strafe','turn'])put(f,role,'engine-'+type+'-S-'+(['strafe','turn'].includes(role)?'pair':'single'));sources(f,catalog);measure('homogeneous-opposite-with-sources',f);}
 const missing=structuredClone(base);for(const [slot,id]of Object.entries(missing.assignments)as [string,string][]){const m=missing.localVariants[missing.instances[id].itemId]??catalog.items[missing.instances[id].itemId];if(m.family==='tank'){delete missing.assignments[slot];delete missing.instances[id];}}if(!hull.builtins.some((b:any)=>b.item.family==='tank'))measure('missing-fuel-source',missing);
}
const coldCases:any=JSON.parse(await import('node:fs/promises').then(fs=>fs.readFile(new URL('./receipts.json',import.meta.url),'utf8'))).cases.filter((x:any)=>x.sourceSet==='grid');
const passive=coldCases.filter((x:any)=>x.host===.4).map((x:any)=>{const solve=(start:number,G=0)=>{let T=start;const step=.001;for(let t=0;t<10/step;t++){const q=5.670374419e-8*x.Krad*(T**4-300**4)+G*(T-300);T-=q/x.C*step;}return {startK:start,endK:T,deltaK:T-start};};return {id:x.id,C:x.C,Krad:x.Krad,passiveRadiationOnly:[320,500].map(t=>solve(t)),withExistingContact10000:[320,500].map(t=>solve(t,10000))};});
const result={schemaVersion:'fitting-restrictions-audit/1',catalog:catalog.version,catalogHash:sha(catalog),scope:'Lab /4 catalog and validation; read-only, family controls in cloned memory only',matrix,validation,passiveStation:passive};
writeFileSync(process.argv[2]??'/tmp/u2-fitting-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({hulls:catalog.hulls.length,items:Object.keys(catalog.items).length,matrix:matrix.length,validation:validation.length,stockPassed:validation.filter(x=>x.name==='stock'&&x.ok).length,blockedMounts:validation.filter(x=>x.name.startsWith('mount:')&&!x.ok).length,familyControlsPassed:validation.filter(x=>x.name.startsWith('family-only-control:')&&x.ok).length,mixed:validation.filter(x=>x.name==='mixed-with-sources').map(x=>({hull:x.hull,ok:x.ok,errors:x.errors.map((e:any)=>e.message)})),passive}));
