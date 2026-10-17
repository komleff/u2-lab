import type { ModuleItem } from "../../fitting/types";
import type { ValidationResult } from "../../catalog/schema";
import { itemIssues } from "../../fitting/validate";
export function numericalVariant(base: ModuleItem, field: string, value: number, id: string): ValidationResult<ModuleItem> {
  if (!(field in base.numerics) || !base.origins["numerics." + field]?.unit)
    return { ok: false, errors: [{ path: "numerics." + field, code: "FIELD", message: "Выберите существующее численное поле с единицей SI" }] };
  const item = structuredClone(base);
  item.id = id; item.label = base.label + " · собственный вариант";
  item.numerics[field] = value;
  item.origins["numerics." + field] = {
    kind: "experimental", sourceRef: "lab:user-variant", unit: base.origins["numerics." + field].unit,
    note: "Явная численная гипотеза пользователя; база " + base.id + "; поле " + field,
  };
  const errors = itemIssues(item, "localVariant");
  return errors.length ? { ok: false, errors } : { ok: true, value: item };
}
