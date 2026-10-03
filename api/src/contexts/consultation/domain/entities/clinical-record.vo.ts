import { InvalidValueError, ValueObject } from '../../../../shared/domain/index.js';
import {
  ICD10_PATTERN,
  MAX_DIAGNOSES,
  MAX_PRESCRIPTION_ITEMS,
  MAX_QUANTITY,
  MAX_TREATMENT_DAYS,
  NOTE_FIELD_MAX,
  ROUTES,
  SHORT_TEXT_MAX,
  VITAL_SIGNS,
} from '../constants/consultation.constants.js';
import {
  DiagnosisProps,
  NoteProps,
  PrescriptionItemProps,
  Route,
  VitalSignName,
  VitalSignProps,
} from '../types/consultation.types.js';

function text(value: string, field: string, max: number, required = false): string {
  const trimmed = (value ?? '').trim();
  if (trimmed.length > max) throw new InvalidValueError(`${field} must have at most ${max} characters`);
  if (required && !trimmed) throw new InvalidValueError(`${field} is required`);
  return trimmed;
}

/** The narrative of the consultation; every field may be empty while drafting. */
export class ClinicalNote extends ValueObject<NoteProps> {
  static readonly EMPTY = new ClinicalNote({ reason: '', currentIllness: '', physicalExam: '', plan: '' });

  static of(input: NoteProps): ClinicalNote {
    return new ClinicalNote({
      reason: text(input.reason, 'reason', SHORT_TEXT_MAX * 5),
      currentIllness: text(input.currentIllness, 'currentIllness', NOTE_FIELD_MAX),
      physicalExam: text(input.physicalExam, 'physicalExam', NOTE_FIELD_MAX),
      plan: text(input.plan, 'plan', NOTE_FIELD_MAX),
    });
  }
}

/** Measured vital signs: only what was measured, each at most once, in range. */
export class VitalSigns extends ValueObject<VitalSignProps[]> {
  static readonly NONE = new VitalSigns([]);

  static of(input: VitalSignProps[]): VitalSigns {
    const seen = new Set<VitalSignName>();
    const values = input.map(({ name, value }) => {
      const rule = VITAL_SIGNS[name];
      if (!rule) throw new InvalidValueError(`Unknown vital sign "${name}"`);
      if (seen.has(name)) throw new InvalidValueError(`${name} is repeated`);
      seen.add(name);
      if (typeof value !== 'number' || !Number.isFinite(value) || value < rule.min || value > rule.max) {
        throw new InvalidValueError(`${name} must be between ${rule.min} and ${rule.max} ${rule.unit}`);
      }
      const factor = 10 ** rule.decimals;
      return { name, value: Math.round(value * factor) / factor };
    });
    return new VitalSigns(values);
  }

  /** Body mass index when weight and height were measured. */
  get bmi(): number[] {
    const weight = this.value.find((v) => v.name === 'peso')?.value;
    const height = this.value.find((v) => v.name === 'talla')?.value;
    return weight && height ? [Math.round((weight / (height / 100) ** 2) * 10) / 10] : [];
  }
}

/** CIE-10 diagnoses: unique codes, at most one principal. */
export class Diagnoses extends ValueObject<DiagnosisProps[]> {
  static readonly NONE = new Diagnoses([]);

  static of(input: DiagnosisProps[]): Diagnoses {
    if (input.length > MAX_DIAGNOSES) throw new InvalidValueError(`At most ${MAX_DIAGNOSES} diagnoses`);
    const codes = new Set<string>();
    const values = input.map((diagnosis) => {
      const code = (diagnosis.code ?? '').trim().toUpperCase();
      if (!ICD10_PATTERN.test(code)) {
        throw new InvalidValueError(`"${diagnosis.code}" is not a CIE-10 code (e.g. J06.9)`);
      }
      if (codes.has(code)) throw new InvalidValueError(`Diagnosis ${code} is repeated`);
      codes.add(code);
      return {
        code,
        description: text(diagnosis.description, 'diagnosis description', SHORT_TEXT_MAX, true),
        principal: diagnosis.principal === true,
      };
    });
    if (values.filter((d) => d.principal).length > 1) {
      throw new InvalidValueError('Only one diagnosis can be the principal one');
    }
    return new Diagnoses(values);
  }

  get hasPrincipal(): boolean {
    return this.value.some((d) => d.principal);
  }
}

/** The medical prescription (fórmula médica) that pharmacy will dispense. */
export class Prescription extends ValueObject<PrescriptionItemProps[]> {
  static readonly NONE = new Prescription([]);

  static of(input: PrescriptionItemProps[]): Prescription {
    if (input.length > MAX_PRESCRIPTION_ITEMS) {
      throw new InvalidValueError(`At most ${MAX_PRESCRIPTION_ITEMS} medications per prescription`);
    }
    return new Prescription(
      input.map((item) => {
        if (!(ROUTES as readonly string[]).includes(item.route)) {
          throw new InvalidValueError(`route must be one of: ${ROUTES.join(', ')}`);
        }
        if (!Number.isInteger(item.durationDays) || item.durationDays < 1 || item.durationDays > MAX_TREATMENT_DAYS) {
          throw new InvalidValueError(`durationDays must be a whole number from 1 to ${MAX_TREATMENT_DAYS}`);
        }
        if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) {
          throw new InvalidValueError(`quantity must be a whole number from 1 to ${MAX_QUANTITY}`);
        }
        return {
          medication: text(item.medication, 'medication', SHORT_TEXT_MAX, true),
          presentation: text(item.presentation, 'presentation', SHORT_TEXT_MAX, true),
          dose: text(item.dose, 'dose', SHORT_TEXT_MAX, true),
          route: item.route as Route,
          frequency: text(item.frequency, 'frequency', SHORT_TEXT_MAX, true),
          durationDays: item.durationDays,
          quantity: item.quantity,
          instructions: text(item.instructions, 'instructions', SHORT_TEXT_MAX * 2),
        };
      }),
    );
  }
}
