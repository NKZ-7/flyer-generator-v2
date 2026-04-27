import type { Template } from './templates/schema';
import type { TemplateCopy } from './types';

export type CopyValidationResult = {
  valid: boolean;
  overflows: { slotId: string; actual: number; max: number }[];
};

export function validateCopy(
  copy: TemplateCopy,
  template: Template,
): CopyValidationResult {
  const overflows: CopyValidationResult['overflows'] = [];
  for (const slot of template.slots) {
    const text = copy[slot.id as keyof TemplateCopy] ?? '';
    if (text.length > slot.max_chars) {
      overflows.push({ slotId: slot.id, actual: text.length, max: slot.max_chars });
    }
  }
  return { valid: overflows.length === 0, overflows };
}
