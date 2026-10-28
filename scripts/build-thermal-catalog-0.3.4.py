"""Новая редакция из frozen 0.3.3; прежние файлы никогда не перезаписываются."""
import copy,json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
folder=root/'src/fitting/data'
params=json.loads((root/'docs/research/2026-10-26-diesel-balance/balance-parameters.json').read_text())
ref='docs/research/2026-10-26-diesel-balance/balance-parameters.json@q1-accepted.5'
def origin(unit,field,formula=None):
 return {'kind':'derived' if formula else 'canonical','unit':unit,'sourceRef':ref+'#'+field,**({'derivation':formula} if formula else {})}
def stamp(item,path,value,unit,field,formula=None):
 obj=item
 keys=path.split('.')
 for key in keys[:-1]:obj=obj[int(key)] if isinstance(obj,list) else obj[key]
 if isinstance(obj,list):obj[int(keys[-1])]=value
 else:obj[keys[-1]]=value
 item['origins'][path]=origin(unit,field,formula)
def update_item(item,pony=False):
 if item['thermalRole']=='ordinary':
  gate=params['dieselTankTemperaturesK'] if item['family']=='tank' and item.get('species')=='diesel' else params['ordinaryTemperaturesK']
  for key,param in {'low':'criticalLowK','workLow':'workLowK','restartLow':'restartColdK','workHigh':'workHighK','restartHigh':'restartHotK','high':'criticalHighK'}.items():stamp(item,'gate.'+key,gate[param],'K',('dieselTankTemperaturesK' if item['family']=='tank' and item.get('species')=='diesel' else 'ordinaryTemperaturesK')+'.'+param)
 if item['family']=='engine' and item.get('propulsionType')=='diesel':stamp(item,'numerics.hostFraction',.4,'1','dieselEngine.hostFraction')
 if pony:
  item.update({'class':'Industrial','manufacturer':'UNKNOWN','national':'UNKNOWN'})
  item['origins']['identity']=origin('identity','pony','Собственная Industrial/G0 серия; UNKNOWN manufacturer/national, без factory TTX substitution')
 if item['family']=='generator' and item.get('species')=='diesel':
  raw=item['numerics']['powerW'];stamp(item,'numerics.ratedOutputBeforePathW',raw,'W','sources.labInput','Номинал до тракта, сохранён из 0.3.3')
  stamp(item,'numerics.powerW',raw*item['numerics']['pathEfficiency'],'W','sources.labInput','P_bus = ratedOutputBeforePathW × pathEfficiency; F08 accepted.5')
  stamp(item,'durability.wearPerWorkSecond',params['generatorDurability']['industrialWearPerEquivalentS']*(1.33 if item['class']=='Civilian' else 1),'1/s','generatorDurability','Новая калибровка только генератора; engine rates сохранены')
 if item['id'] in ['radiator-passive-S','radiator-passive-M']:
  size=item['size'];rad=params['passiveRadiators'][size]
  stamp(item,'surfaces.0.areaM2',rad['areaM2'],'m²','passiveRadiators.'+size+'.areaM2')
  item['surfaces'][0]['origins']['areaM2']=item['origins']['surfaces.0.areaM2']
  scale=1 if size=='S' else 4
  item['materials']=[{'id':name,'massKg':mass*scale,'cpJKgK':cp,'contents':'dry','origin':origin('kg; J/(kg·K)','passiveRadiators.'+size,'Закрытый BOM: Fe710 kg·450 + Cu40 kg·385, M=S×4')} for name,mass,cp in [('Iron',710,450),('Copper',40,385)]]
  for j,m in enumerate(item['materials']):
   for key in ['massKg','cpJKgK']:item['origins'][f'materials.{j}.{key}']=origin('kg' if key=='massKg' else 'J/(kg·K)','passiveRadiators.'+size,'Закрытый BOM U2, C и масса из принятого пакета')
hulls=json.loads((folder/'hulls-0.3.3.json').read_text());items=json.loads((folder/'items-0.3.3.json').read_text());presets=json.loads((folder/'presets-0.3.3.json').read_text())
for item in items.values():update_item(item)
for h in hulls:
 for j,b in enumerate(h['builtins']):
  update_item(b['item'],h['id']=='pony')
  for key,value in b['item']['origins'].items():h['origins'][f'builtins.{j}.item.'+key]=value
 if h['id'] in ['pony','industrial-S','civilian-M','industrial-M']:
  for s in h['slots']:
   if s['category']=='sensors-thermal':s['families']+=list(x for x in params['fitting']['thermalFamiliesToAdd'] if x not in s['families'])
   if s.get('role')=='turn' and 'gyrodyne' not in s['families']:s['families'].append('gyrodyne')
 if h['id']=='pony':
  h.update({'class':'Industrial','manufacturer':'UNKNOWN','national':'UNKNOWN'})
  h['origins']['identity']=origin('identity','pony','Принята собственная Industrial/G0 серия Пони; две UNKNOWN оси независимы от класса')
  stamp(h,'materials.0.massKg',31500,'kg','pony.shellDryMassKg');h['materials'][0]['origin']=origin('kg; J/(kg·K)','pony.shellDryMassKg','Принятая оболочка 31500 kg, прежнее приближение cp470 сохранено')
 if h['id'] in ['sputnik','severin-mir','pony']:
  scale=4 if h['id']=='severin-mir' else 1
  stamp(h,'bodyExchangeAreaM2',537*scale,'m²','sources.labInput','Принятый F2 physical body A537/2148, separate epsilon0.85; K сохранён')
  stamp(h,'bodyEmissivity',.85,'1','sources.labInput','Принятый F2 physical body epsilon; K=A×epsilon')
  profile={'sputnik':'strizh','severin-mir':'severin_mir','pony':'diesel_pony'}[h['id']]
  for key in ['bodyExchangeAreaM2','bodyEmissivity']:h['origins'][key]={'kind':'canonical','unit':'m²' if key=='bodyExchangeAreaM2' else '1','sourceRef':'docs/research/2026-10-26-diesel-balance/f2_ship_profile_'+profile+'_v0.1.json#governorProfile.surfaces[surface-hull].'+('areaM2' if key=='bodyExchangeAreaM2' else 'emissivity')}
  a=params['automation'];dispatch=a['generatorDispatch'][h['class']]
  h['automation']={'version':'ship-automation/1','normalTargetK':a['normalTargetK'],'coldOnK':a['coldOnK'],'coldOffK':a['coldOffK'],**dispatch}
  for k in h['automation']:
   if k!='version':h['origins']['automation.'+k]=origin('K' if k.endswith('K') else '1','automation.'+('generatorDispatch.'+h['class']+'.' if k in dispatch else '')+k)
for name,fit in presets.items():
 fit['catalogVersion']='ship-fitting-0.3.4'
 for item in fit['localVariants'].values():update_item(item,fit['hullId']=='pony')
for name,data in [('hulls',hulls),('items',items),('presets',presets)]:
 (folder/(name+'-0.3.4.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
(folder/'preset-manifest-0.3.4.json').write_bytes((folder/'preset-manifest-0.3.3.json').read_bytes())
