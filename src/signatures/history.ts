import type { SignatureFrame } from "./physics";
import { rkMean } from "./physics";
import { projectIrComponents } from "./projection";
import { finite } from "./domain";
import { exactFields } from "./config";

export interface ScalarCurve { a: number; b: number; c: number }
export interface CurvePiece { from: number; to: number; curve: ScalarCurve }
export type EvaluatedCurve = ScalarCurve | { pieces: CurvePiece[] };
// Плотная квадратичная кривая сохраняет endpoints и RK moment.
// Газовый и сенсорный пороги делят её по корням ДО интегрирования и crop.
export function scalarCurve(start: number, end: number, mean: number): ScalarCurve {
  const bend = 6 * (mean - (start + end) / 2);
  return { a: finite(start,"curve start"), b: finite(end-start+bend,"curve b"), c: finite(bend===0?0:-bend,"curve c") };
}
const pieces = (curve: EvaluatedCurve): CurvePiece[] => "pieces" in curve ? curve.pieces : [{from:0,to:1,curve}];
const scalarValue = (c:ScalarCurve,x:number) => c.a+x*(c.b+c.c*x);
const scalarMean = (c:ScalarCurve,from:number,to:number) => c.a+c.b*(from+to)/2+c.c*(from*from+from*to+to*to)/3;
function scalarCrossings(curve: ScalarCurve, value: number): number[] {
  const a=curve.c,b=curve.b,c=curve.a-value;
  if(a===0)return b===0?[]:[-c/b].filter(x=>x>=0&&x<=1);
  const d=b*b-4*a*c;if(d<0)return [];
  const q=-.5*(b+(b>=0?1:-1)*Math.sqrt(d));
  return [...new Set(q===0?[-b/(2*a)]:[q/a,c/q])].filter(x=>x>=0&&x<=1).sort((a,b)=>a-b);
}
export function curveValue(curve:EvaluatedCurve,fraction:number):number {
  const ps=pieces(curve),p=ps.find(p=>fraction<=p.to)??ps[ps.length-1];
  return scalarValue(p.curve,fraction);
}
export function curveMean(curve:EvaluatedCurve,from:number,to:number):number {
  if(from===to)return curveValue(curve,from);
  return pieces(curve).reduce((sum,p)=>{const a=Math.max(from,p.from),b=Math.min(to,p.to);return sum+(b>a?scalarMean(p.curve,a,b)*(b-a):0);},0)/(to-from);
}
export function curveBounds(curve:EvaluatedCurve,from:number,to:number) {
  const values=[curveValue(curve,from),curveValue(curve,to)];
  for(const p of pieces(curve)) {const a=Math.max(from,p.from),b=Math.min(to,p.to);if(b<a)continue;
    values.push(scalarValue(p.curve,a),scalarValue(p.curve,b));
    const at=-p.curve.b/(2*p.curve.c);if(p.curve.c!==0&&at>a&&at<b)values.push(scalarValue(p.curve,at));
  }
  return {min:Math.min(...values),max:Math.max(...values)};
}
export function curveCrossings(curve:EvaluatedCurve,value:number):number[] {
  return [...new Set(pieces(curve).flatMap(p=>scalarCrossings(p.curve,value).filter(x=>x>=p.from&&x<=p.to)))].sort((a,b)=>a-b);
}
export function curveBreakpoints(curve:EvaluatedCurve):number[] {return [...new Set(pieces(curve).flatMap(p=>[p.from,p.to]))].sort((a,b)=>a-b);}
export function scaleCurve(curve:EvaluatedCurve,scale:number):EvaluatedCurve {
  const map=(c:ScalarCurve)=>({a:c.a*scale,b:c.b*scale,c:c.c*scale});
  return "pieces" in curve?{pieces:curve.pieces.map(p=>({...p,curve:map(p.curve)}))}:map(curve);
}
export function transformCurve(curve:EvaluatedCurve,mode:"positive"|"absolute"):EvaluatedCurve {
  const result:CurvePiece[]=[];
  for(const p of pieces(curve)) {
    const cuts=[p.from,...scalarCrossings(p.curve,0).filter(x=>x>p.from&&x<p.to),p.to];
    for(let i=1;i<cuts.length;i++) {
      const from=cuts[i-1],to=cuts[i],negative=scalarValue(p.curve,(from+to)/2)<0;
      const scale=negative?(mode==="positive"?0:-1):1;
      result.push({from,to,curve:scale===0?{a:0,b:0,c:0}:scale===1?{...p.curve}:{a:-p.curve.a,b:-p.curve.b,c:-p.curve.c}});
    }
  }
  return result.length===1?result[0].curve:{pieces:result};
}
export function sumCurves(curves:readonly EvaluatedCurve[]):EvaluatedCurve {
  const cuts=[...new Set([0,1,...curves.flatMap(curveBreakpoints)])].sort((a,b)=>a-b),result:CurvePiece[]=[];
  for(let i=1;i<cuts.length;i++) {
    const from=cuts[i-1],to=cuts[i],mid=(from+to)/2,curve={a:0,b:0,c:0};
    for(const input of curves){const c=pieces(input).find(p=>mid>=p.from&&mid<=p.to)!.curve;curve.a+=c.a;curve.b+=c.b;curve.c+=c.c;}
    result.push({from,to,curve});
  }
  return result.length===1?result[0].curve:{pieces:result};
}
export function validateCurve(value:unknown):EvaluatedCurve {
  if(value&&typeof value==="object"&&"pieces" in value) {
    const obj=exactFields(value,["pieces"],"piecewise source") as unknown as {pieces:CurvePiece[]};
    if(!Array.isArray(obj.pieces)||!obj.pieces.length)throw new TypeError("Source pieces required");
    let end=0,prior:CurvePiece|undefined;
    for(const p of obj.pieces){
      exactFields(p,["from","to","curve"],"source piece");finite(p.from,"piece from");finite(p.to,"piece to");if(p.from!==end||!(p.to>p.from)||p.to>1)throw new RangeError("Source pieces must cover [0,1]");validateScalar(p.curve,p.from,p.to);
      if(prior){const left=scalarValue(prior.curve,p.from),right=scalarValue(p.curve,p.from);
        // Округление корня оцениваем по ваттам этой же кривой; предел не меняет
        // detect/hold и не допускает физический скачок внутри плотного подшага.
        const q=Math.max(Math.abs(prior.curve.a),Math.abs(prior.curve.b),Math.abs(prior.curve.c),Math.abs(p.curve.a),Math.abs(p.curve.b),Math.abs(p.curve.c));
        if(Math.abs(finite(left-right,"source continuity difference"))>1e-12*q)throw new RangeError("Discontinuous interior source curve");
      }
      end=p.to;prior=p;
    }
    if(end!==1)throw new RangeError("Missing source piece suffix");return obj;
  }
  return validateScalar(value);
}
function validateScalar(value:unknown,from=0,to=1):ScalarCurve {
  const c=exactFields(value,["a","b","c"],"source curve") as unknown as ScalarCurve;Object.values(c).forEach(x=>finite(x,"curve coefficient"));
  finite(scalarValue(c,from),"curve start value");finite(scalarValue(c,to),"curve end value");finite(scalarMean(c,from,to),"curve mean");
  const at=-.5*(c.b/c.c);if(c.c!==0&&at>from&&at<to)finite(scalarValue(c,at),"curve interior value");
  return c;
}
export function frameIrAt(frame:SignatureFrame,temperatureK:number,aspectDeg:number) {
  const components=frame.components.map(component=> {
    if(component.id==="body"||component.id==="radiators") {
      const k=component.id==="body"?frame.bodyK:frame.radiatorK,absoluteIrW=k*5.670374419e-8*temperatureK**4;
      return {...component,absoluteIrW,contrastW:absoluteIrW-k*5.670374419e-8*frame.backgroundK**4};
    }
    return component;
  });
  return projectIrComponents(components,aspectDeg);
}
export function frameIrCurves(frame:SignatureFrame,aspectDeg:number) {
  const start=frameIrAt(frame,frame.startTemperatureK,aspectDeg),end=frameIrAt(frame,frame.endTemperatureK,aspectDeg),mean=projectIrComponents(frame.components,aspectDeg);
  // Тёплый газ выходит при evaluated температуре корабля. Его raw C линеен
  // на этой кривой; нижний предел применяется до суммы со signed T⁴ поверхностью.
  const temperature=scalarCurve(frame.startTemperatureK,frame.endTemperatureK,rkMean(frame.rkTemperatureK));
  const gas=frame.coolers.map(c=>transformCurve({a:142*c.flowKgS*(temperature.a-frame.backgroundK),b:142*c.flowKgS*temperature.b,c:142*c.flowKgS*temperature.c},"positive"));
  return {mean,absolute:scalarCurve(start.projectedAbsoluteW,end.projectedAbsoluteW,mean.projectedAbsoluteW),
    contrast:sumCurves([scalarCurve(start.projectedContrastW,end.projectedContrastW,mean.projectedContrastW),...gas]),
    intrinsic:scalarCurve(start.intrinsicAbsoluteW,end.intrinsicAbsoluteW,mean.intrinsicAbsoluteW),
    intrinsicContrast:sumCurves([scalarCurve(start.intrinsicContrastW,end.intrinsicContrastW,mean.intrinsicContrastW),...gas])};
}
export interface PendingSourceInterval {
  startS:number;endS:number;phase:string;ir:EvaluatedCurve;emW:number;
  crossings:{fraction:number;fluxWm2:number}[];
}
