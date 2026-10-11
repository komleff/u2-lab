import type {RetainedTrace} from './telemetry';
import {channelRows,eventMatches,eventLabel} from './telemetry';
import type {Bucket} from '../../runner/retention';
import type {RunSpecV3} from '../../model/v3/types';

export const shipModelGroups=[['energy','Энергия'],['heat','Тепло'],['stocks','Запасы'],['work','Работа'],['signals','IR / EM'],['state','Состояние']] as const;
const labels:Record<string,string>={requestedW:'Запрошено',deliveredW:'Доставлено',converterLossW:'Потери преобразования',generatorW:'Генератор',independentAcceptedW:'Принято от независимых источников',rejectedIndependentW:'Отклонено от независимых источников',usefulWorkW:'Полезная работа',hostHeatW:'Тепло корпуса',rawEmW:'EM до shielding',escapedEmW:'EM наружу',capturedEmW:'EM перехвачено',intentionalRfW:'Преднамеренный RF',netHeatW:'Тепловой баланс',bufferCaptureW:'Буфер · приём',bufferReleaseW:'Буфер · возврат',tiCoolingW:'TI · охлаждение',h2CoolingW:'H₂ · охлаждение',radiationW:'Радиационный обмен',fieldW:'Контакт с полем',totalResidualJ:'Остаток баланса',engineIrExportW:'IR двигателя',temperatureK:'Температура корпуса',chargeJ:'Заряд',intrinsicIrW:'IR intrinsic',contrastIrW:'IR signed contrast',receiverIrW:'IR выбранного приёмника',observedEmW:'EM наблюдаемый',irFluxWm2:'IR flux',emFluxWm2:'EM flux',ownAntennaTransmission:'Пропускание антенны',ownSensorWorkingW:'Оплаченная мощность сенсора',timeSeconds:'Время сигнала',fuelKg:'Топливо',bufferJ:'Долг буфера',actualW:'Измеренная мощность',actualMeasured:'Измерение мощности доступно',durabilityR:'Прочность',cooldownSeconds:'Cooldown',thermalStopped:'Тепловая остановка',durabilityStopped:'Остановка по прочности',surfaceOpen:'Поверхность открыта',tiActive:'TI работает',tiHotK:'TI hot-side',tiBusW:'TI bus',tiNetBenefitW:'TI net benefit'};
export function shipModelChannelInfo(id:string,spec?:RunSpecV3){
  const signal=id.startsWith('signal:'),plain=signal?id.slice(7):id,colon=plain.indexOf(':'),name=colon<0?plain:plain.slice(0,colon),owner=colon<0?'':plain.slice(colon+1);
  const marker=/^(actualMeasured|thermalStopped|durabilityStopped|surfaceOpen|tiActive|tiHotMeasured)$/.test(name);
  const unit=marker?'флаг':name==='durabilityR'?'R':name==='ownAntennaTransmission'?'доля':/Seconds$/.test(name)?'с':name==='fuelKg'?'кг':/Wm2$/.test(name)?'W/m²':/K$/.test(name)?'K':/J$/.test(name)?'J':'W';
  const group=signal?'signals':marker||name==='durabilityR'||name==='cooldownSeconds'?'state':name==='actualW'||name==='usefulWorkW'?'work':/chargeJ|fuelKg|bufferJ/.test(name)?'stocks':/Heat|heat|Cooling|cooling|radiation|fieldW|temperature|tiHot|tiNet|bufferCapture|bufferRelease|Loss|Residual/.test(name)?'heat':'energy';
  const instance=spec?.resolvedShip.instances.find(i=>i.id===owner);
  const label=(name==='tiHotMeasured'?'TI hot-side · полное измерение':labels[name]??name)+(owner?' · '+(instance?.item.label??owner)+' ['+owner+']':'');
  return {id,label,unit,group};
}
export function shipModelAvailability(trace:Pick<RetainedTrace,'channels'>,bucket:Bucket|undefined,id:string){
  if(id.startsWith('tiHotK:')){
    const owner=id.slice(7),measured=trace.channels.indexOf('tiHotMeasured:'+owner),active=trace.channels.indexOf('tiActive:'+owner);
    if(!bucket)return 'unavailable' as const;
    if(measured>=0&&bucket.min[measured]>=1)return 'measured' as const;
    if((measured>=0&&bucket.max[measured]>0)||(active>=0&&bucket.max[active]>0))return 'mixed' as const;
    return active>=0?'inactive' as const:'unavailable' as const;
  }
  const marker=id.startsWith('actualW:')?'actualMeasured:'+id.slice(8):/^ti(BusW|NetBenefitW):/.test(id)?'tiActive:'+id.slice(id.indexOf(':')+1):undefined;
  if(!marker)return 'measured' as const;
  const i=trace.channels.indexOf(marker);if(!bucket||i<0)return 'unavailable' as const;
  return bucket.min[i]>=1?'measured' as const:bucket.max[i]>0?'mixed' as const:marker.startsWith('tiActive:')?'inactive' as const:'unavailable' as const;
}
export const availabilityLabel={measured:'измерено',inactive:'неактивен',unavailable:'нет измерения',mixed:'смешанная доступность · нет полного измерения'};
export const shipModelEventMatches=(kind:string,filter:string)=>eventMatches(kind,filter)||(filter==='phase'&&kind==='mode');
export const shipModelEventLabel=(kind:string)=>kind==='phase'?'Фаза':kind==='mode'?'Режим':eventLabel(kind);
export function shipModelChannelRows(trace:Pick<RetainedTrace,'channels'>,bucket:Bucket|undefined,spec?:RunSpecV3){
  return channelRows(trace,bucket).map(row=>{
    const availability=shipModelAvailability(trace,bucket,row.id),info=shipModelChannelInfo(row.id,spec);
    return {...row,...info,availability,...(availability==='measured'?{}:{mean:null,min:null,max:null})};
  });
}
