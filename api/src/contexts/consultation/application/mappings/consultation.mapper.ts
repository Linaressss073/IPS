import { Actor, newTraceEvent, TraceEvent } from '../../../../shared/application/index.js';
import { VITAL_SIGNS } from '../../domain/constants/consultation.constants.js';
import { Consultation } from '../../domain/entities/consultation.entity.js';
import { ConsultationView } from '../types/consultation.types.js';

/** Domain → view, before the names of other contexts are filled. */
export function toConsultationView(consultation: Consultation): ConsultationView {
  const { appointment, signature } = consultation;
  return {
    id: consultation.id.value,
    status: consultation.status,
    signature: signature.signed ? { signed: true, at: signature.at.toISOString() } : { signed: false },
    patient: { id: appointment.patientId, fullName: '', document: { type: '', number: '' } },
    physician: { userId: appointment.professionalId, displayName: '' },
    appointment: { id: appointment.id, date: appointment.date, time: appointment.time },
    service: appointment.service,
    location: appointment.location,
    note: consultation.note.value,
    vitals: consultation.vitals.value.map((v) => ({ ...v, unit: VITAL_SIGNS[v.name].unit })),
    bmi: consultation.vitals.bmi,
    diagnoses: consultation.diagnoses.value,
    prescription: consultation.prescription.value,
    addenda: consultation.addenda.map((a) => ({
      text: a.text,
      writtenBy: a.writtenBy,
      writtenByName: '',
      writtenAt: a.writtenAt.toISOString(),
    })),
    startedAt: consultation.startedAt.toISOString(),
    updatedAt: consultation.updatedAt.toISOString(),
    version: consultation.version,
  };
}

export function consultationEvent(consultation: Consultation, type: string, actor: Actor, at: Date): TraceEvent {
  return newTraceEvent({
    teamId: consultation.teamId,
    patientId: consultation.patientId,
    type,
    actor,
    occurredAt: at,
    data: {
      consultationId: consultation.id.value,
      appointmentId: consultation.appointment.id,
      service: consultation.appointment.service,
      location: consultation.appointment.location,
    },
  });
}
