import {readFile} from 'node:fs/promises';
export async function resolve(specifier,context,next){
 try{return await next(specifier,context);}catch(e){if((specifier.startsWith('.')||specifier.startsWith('/'))&&!/\.[cm]?[jt]sx?$|\.json$/.test(specifier)){return next(specifier+'.ts',context);}throw e;}
}
export async function load(url,context,next){
 if(url.endsWith('.json'))return {format:'module',shortCircuit:true,source:'export default '+await readFile(new URL(url),'utf8')};
 return next(url,context);
}
