import {expect,it} from "vitest";
import {ROLE_REFERENCES,ROLE_REFERENCE_SOURCE} from "../../src/signatures/role-references";
it("SS09–11 five routed diagnostic references preserve source generation/status and neutral power/range math",()=>{
  expect(ROLE_REFERENCE_SOURCE.revision).toBe("0fe06927ab496918b3547f43412134c100a6e0b4");
  expect(ROLE_REFERENCES.map(v=>[v.role,v.generation,v.status])).toEqual([["Civilian",1,"reference_diagnostic"],["Industrial",2,"class_diagnostic"],["Sport",3,"class_diagnostic"],["Military",4,"class_diagnostic"],["Stealth",5,"class_diagnostic"]]);
  for(const v of ROLE_REFERENCES){
    expect(Math.abs(v.emReferenceW-v.emStageBasisW*.0000215)).toBeLessThanOrEqual(1e-6*v.emReferenceW+1e-12*v.emReferenceW);
    // CSV ranges rounded to nearest metre; anchors are S/G1 dedicated receiver thresholds.
    expect(Math.abs(Math.sqrt(v.irReferenceW/(4*Math.PI*.000274542277))-v.irRangeReferenceM)).toBeLessThanOrEqual(.5);
    expect(Math.abs(Math.sqrt(v.emReferenceW/(4*Math.PI*3.592038646e-8))-v.emRangeReferenceM)).toBeLessThanOrEqual(.5);
  }
});
