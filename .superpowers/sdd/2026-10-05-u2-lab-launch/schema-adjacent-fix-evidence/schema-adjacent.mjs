import {createServer} from 'vite';
import {writeFileSync} from 'node:fs';
const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false}});
const {presets}=await server.ssrLoadModule('/src/catalog/presets.ts');
const {validateRunSpec}=await server.ssrLoadModule('/src/catalog/schema.ts');
const {createRun}=await server.ssrLoadModule('/src/runner/run.ts');await server.close();
const rows=[];for(const [name,edit] of [['tank gate numeric string',p=>p.ship.tanks[0].gate.low='150'],['tank gate missing critical high',p=>delete p.ship.tanks[0].gate.high]]){const p=structuredClone(presets[0]);edit(p);const checked=validateRunSpec(p);let created=false;try{createRun('invalid-adjacent',p);created=true}catch{}rows.push({name,result:!checked.ok&&!created?'PASS':'FAIL',validationAccepted:checked.ok,createRunAccepted:created});}
writeFileSync(new URL('./schema-adjacent.json',import.meta.url),JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(rows));
