
export enum VolunteerStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  DECLINED = 'DECLINED',
}

export interface Volunteer {
  id: string;
  name: string;
  status: VolunteerStatus;
}

export enum ConfirmationStatus {
  PENDING = 'PENDING',
  YES = 'YES',
  NO = 'NO',
}

export interface PlanningItem {
  id: string;
  task: string;
  confirmed: ConfirmationStatus;
}

export interface Dc85Item {
  id: string;
  key: string;
  value: string;
}

export interface DocumentFile {
  id: string;
  name: string;
}

export interface MaintenanceState {
  date: string;
  time: string;
  services: string;
  planningItems: PlanningItem[];
  dc85Items: Dc85Item[];
  dc85Confirmed: boolean;
  volunteers: Volunteer[];
  documents: DocumentFile[];
  episRequired: string[];
}
