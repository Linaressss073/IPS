import { CareLocation } from '../../domain/entities/care-location.entity.js';
import { MedicalService } from '../../domain/entities/medical-service.entity.js';
import { LocationView, ServiceView } from '../types/scheduling.types.js';

export function toServiceView(service: MedicalService): ServiceView {
  return {
    id: service.id.value,
    code: service.code.value,
    name: service.name,
    active: service.active,
  };
}

export function toLocationView(location: CareLocation): LocationView {
  return {
    id: location.id.value,
    kind: location.kind,
    number: location.number,
    label: location.label,
    active: location.active,
  };
}
