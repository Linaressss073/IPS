import { TeamId } from '../../../../shared/domain/index.js';
import { GetOrganization } from '../../../organizations/application/queries/get-organization.query.js';
import { GetPatient } from '../../../patients/application/queries/get-patient.query.js';
import { PrescriptionNotFoundError } from '../errors/consultation.errors.js';
import { FormulaView } from '../types/consultation.types.js';
import { ConsultationQueries } from './consultation.queries.js';

/** The data of a signed prescription as printed: IPS, patient, physician, diagnoses and medicines. */
export class GetFormula {
  constructor(
    private readonly consultations: ConsultationQueries,
    private readonly patients: GetPatient,
    private readonly organizations: GetOrganization,
  ) {}

  async execute(teamId: TeamId, consultationId: string): Promise<FormulaView> {
    const consultation = await this.consultations.get(teamId, consultationId);
    if (!consultation.signature.signed || consultation.prescription.length === 0) {
      throw new PrescriptionNotFoundError(consultationId);
    }
    const [patient, ips] = await Promise.all([
      this.patients.execute({ teamId, patientId: consultation.patient.id }),
      this.organizations.execute({ teamId }),
    ]);
    return {
      consultationId: consultation.id,
      signedAt: consultation.signature.at,
      ips: {
        name: ips.name,
        nit: ips.nit,
        habilitationCode: ips.habilitationCode,
        address: ips.address,
        city: ips.city,
        department: ips.department,
        phone: ips.phone,
      },
      patient: {
        fullName: patient.fullName,
        document: patient.document,
        sex: patient.sex,
        birthDate: patient.birthDate,
        eps: patient.affiliation.eps,
        regime: patient.affiliation.regime,
      },
      physician: { displayName: consultation.physician.displayName },
      service: consultation.service.name,
      diagnoses: consultation.diagnoses,
      prescription: consultation.prescription,
    };
  }
}
