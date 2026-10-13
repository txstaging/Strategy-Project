// «خطة التواصل والمجازفات» — one row of the sheet under the reports stage.

// Mirrors CommunicationMethod on the server. Pinned integers.
export enum CommunicationMethod {
  Phone = 0,
  Email = 1,
  Interview = 2,
  Meeting = 3,
}

export const COMMUNICATION_METHODS: { value: CommunicationMethod; label: string }[] = [
  { value: CommunicationMethod.Phone, label: 'تليفون' },
  { value: CommunicationMethod.Email, label: 'بريد إلكتروني' },
  { value: CommunicationMethod.Interview, label: 'مقابلة' },
  { value: CommunicationMethod.Meeting, label: 'اجتماع' },
];

export function communicationMethodLabel(m: CommunicationMethod | number): string {
  return COMMUNICATION_METHODS.find((x) => x.value === Number(m))?.label ?? '';
}

export interface ICommunicationEntry {
  id: number;
  planId: number;
  date: string;
  channel: string;
  method: CommunicationMethod;
  responsibleOfficer: string;
  actionTaken: string;
  createdByName?: string;
  unitName?: string;
  createdAt?: string;
}

export interface ISaveCommunicationEntry {
  planId: number;
  date: string;
  channel: string;
  method: CommunicationMethod;
  responsibleOfficer: string;
  actionTaken: string;
}
