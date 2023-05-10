export type Hospital = {
  latitude: number;
  longitude: number;
  name: string;
  capacity: number;
  tier: 1 | 2 | 3;
  doctors: string[];
  nurses: string[];
};

export enum Role {
  Admin = "Admin",
  Doctor = "Doctor",
  Nurse = "Nurse",
}

export type User = {
  name: string;
  email: string;
  role: Role;
  uid: string;
  fcmToken?: string;
  tabs?: string[];
};

export type Staff = {
  hospital: string;
  onDuty: boolean;
};

export type Measurement = {
  value: string;
  recordedBy: string;
  recordedAt: number;
};

export type UrineMeasurement = {
  volume: number;
  albumin: number;
  glucose: number;
  acetone: number;
  vomitus: string;
  recordedBy: string;
  recordedAt: number;
};

export type Measurements = {
  foetalHeartRate: Measurement[];
  liquor: Measurement[];
  moulding: Measurement[];
  cervix: Measurement[];
  descent: Measurement[];
  contraction: Measurement[];
  pulse: Measurement[];
  systolic: Measurement[];
  diastolic: Measurement[];
  urine: UrineMeasurement[];
  drugs: Measurement[];
  temperature: Measurement[];
  oxytocin: Measurement[];
};

export type Patient = {
  name: string;
  age: number;
  parity: number;
  alive: number;
  edd: number;
  sb: number;
  nnd: number;
  riskFactors?: string[];
  contractionStartTime?: number;
  membraneRuptureTime?: number;
  height: number;
  doctor: string;
  nurse: string;
  hospital: string;
  active?: boolean;
  criticality?: number;
  measurements?: Measurements;
  comments?: string;
};
