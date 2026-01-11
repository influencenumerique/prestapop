export type DocumentType =
  | "KBIS_3MONTHS"
  | "IDENTITY"
  | "DRIVER_LICENSE"
  | "VEHICLE_INSURANCE"
  | "MANAGER_IDENTITY";

export interface DocumentConfig {
  type: DocumentType;
  label: string;
  accept: string;
}

export const REQUIRED_DOCUMENTS: Record<"DRIVER" | "COMPANY", DocumentConfig[]> = {
  DRIVER: [
    { type: "KBIS_3MONTHS", label: "KBIS (moins de 3 mois)", accept: ".pdf,.jpg,.jpeg,.png" },
    { type: "IDENTITY", label: "Pièce d'identité", accept: ".pdf,.jpg,.jpeg,.png" },
    { type: "DRIVER_LICENSE", label: "Permis de conduire", accept: ".pdf,.jpg,.jpeg,.png" },
    { type: "VEHICLE_INSURANCE", label: "Assurance véhicule", accept: ".pdf,.jpg,.jpeg,.png" },
  ],
  COMPANY: [
    { type: "KBIS_3MONTHS", label: "KBIS (moins de 3 mois)", accept: ".pdf,.jpg,.jpeg,.png" },
    { type: "MANAGER_IDENTITY", label: "Identité du gérant", accept: ".pdf,.jpg,.jpeg,.png" },
  ],
};
