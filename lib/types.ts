export type ApiError = {
  message: string;
  status: number;
  timestamp: string;
  fieldErrors?: Record<string, string>;
};

export type AuthResponse = {
  token: string | null;
  username: string;
  roles: Array<"DIRECTIVA" | "DIRECCION_ESCUELA" | "SOCIO" | "PROFESOR" | "ALUMNO">;
  memberId?: number | null;
  displayName: string;
};

export type Summary = {
  totalVestimentas: number;
  totalInstrumentos: number;
  vestimentasPrestadas: number;
  instrumentosPrestados: number;
  instrumentosEnReparacion: number;
  vestimentasEnLavado: number;
};

export type GarmentStatus = "DISPONIBLE" | "PRESTADA" | "EN_LAVADO" | "FUERA_DE_USO";
export type GarmentType = "CHAQUETA" | "PANTALON" | "CAMISA" | "BOLSO_ARREOS" | "PAR_DE_HOMBRERAS" | "CUELLOS" | "PAR_DE_MANGAS";
export type InstrumentStatus = "DISPONIBLE" | "PRESTADO" | "EN_REPARACION" | "FUERA_DE_USO";
export type MemberInstrument =
  | "CLARINETE"
  | "REQUINTO"
  | "FLAUTA"
  | "FLAUTIN"
  | "SAXOFON_ALTO"
  | "SAXOFON_TENOR"
  | "SAXOFON_BARITONO"
  | "FLISCORNO"
  | "TROMPA"
  | "BOMBARDINO"
  | "CORNETA"
  | "TROMPETA"
  | "TROMBON"
  | "TUBA"
  | "PERCUSION"
  | "TAMBOR";

export const MEMBER_INSTRUMENT_OPTIONS: Array<{ value: MemberInstrument; label: string }> = [
  { value: "CLARINETE", label: "Clarinete" },
  { value: "REQUINTO", label: "Requinto" },
  { value: "FLAUTA", label: "Flauta" },
  { value: "FLAUTIN", label: "Flautín" },
  { value: "SAXOFON_ALTO", label: "Saxofón alto" },
  { value: "SAXOFON_TENOR", label: "Saxofón tenor" },
  { value: "SAXOFON_BARITONO", label: "Saxofón barítono" },
  { value: "FLISCORNO", label: "Fliscorno" },
  { value: "TROMPA", label: "Trompa" },
  { value: "BOMBARDINO", label: "Bombardino" },
  { value: "CORNETA", label: "Corneta" },
  { value: "TROMPETA", label: "Trompeta" },
  { value: "TROMBON", label: "Trombón" },
  { value: "TUBA", label: "Tuba" },
  { value: "PERCUSION", label: "Percusión" },
  { value: "TAMBOR", label: "Tambor" },
];

export type Garment = {
  id: number;
  type: GarmentType;
  identifier: string;
  size: string;
  status: GarmentStatus;
  purchaseDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GarmentLoan = {
  id: number;
  garmentId: number;
  garmentIdentifier: string;
  personName: string;
  responsiblePersonName?: string | null;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GarmentWash = {
  id: number;
  garmentId: number;
  garmentIdentifier: string;
  startDate: string;
  endDate?: string | null;
  description: string;
  responsiblePersonName?: string | null;
  inProgress: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Instrument = {
  id: number;
  name: string;
  family: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  status: InstrumentStatus;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  currentPrice?: number | null;
  photoUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InstrumentLoan = {
  id: number;
  instrumentId: number;
  instrumentName: string;
  personName: string;
  responsiblePersonName?: string | null;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InstrumentRepair = {
  id: number;
  instrumentId: number;
  instrumentName: string;
  startDate: string;
  endDate?: string | null;
  description: string;
  cost?: number | null;
  provider?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Member = {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string | null;
  nif: string;
  address: string;
  city: string;
  instrument: MemberInstrument;
  socio: boolean;
  boardMember: boolean;
  schoolDirector: boolean;
  teacher: boolean;
  student: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MemberCredentialResponse = {
  member: Member;
  username: string;
  password: string;
};

export type MemberImportResponse = {
  createdCount: number;
  createdMembers: MemberCredentialResponse[];
};

export type MyLoansResponse = {
  garmentLoans: GarmentLoan[];
  instrumentLoans: InstrumentLoan[];
};

export type Room = {
  id: number;
  name: string;
  description?: string | null;
  capacity?: number | null;
  active: boolean;
};

export type AcademicYear = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
};

export type AcademicTerm = {
  id: number;
  academicYearId: number;
  academicYearName: string;
  termNumber: number;
  name: string;
  startDate: string;
  endDate: string;
};

export type AcademicClosure = {
  id: number;
  academicYearId?: number | null;
  academicYearName?: string | null;
  closureDate: string;
  name: string;
  notes?: string | null;
};

export type SchoolSubject = {
  id: number;
  name: string;
  description?: string | null;
  subjectType: "INDIVIDUAL" | "COLECTIVA";
  active: boolean;
};

export type SchoolClassSchedule = {
  id: number;
  academicYearId: number;
  academicYearName: string;
  teacherMemberId: number;
  teacherName: string;
  studentMemberIds: number[];
  studentNames: string;
  subjectId: number;
  subjectName: string;
  roomId: number;
  roomName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  notes?: string | null;
};

export type SchoolClassException = {
  id: number;
  scheduleId?: number | null;
  scheduleLabel: string;
  type: "CANCELADA" | "REPROGRAMADA" | "RECUPERACION";
  originalDate: string;
  replacementDate?: string | null;
  replacementStartTime?: string | null;
  replacementEndTime?: string | null;
  replacementRoomId?: number | null;
  replacementRoomName?: string | null;
  notes?: string | null;
};

export type SchoolOverview = {
  rooms: Room[];
  academicYears: AcademicYear[];
  terms: AcademicTerm[];
  closures: AcademicClosure[];
  subjects: SchoolSubject[];
  schedules: SchoolClassSchedule[];
  exceptions: SchoolClassException[];
  bandRecurringReservations: BandRecurringReservation[];
  teachers: Member[];
  students: Member[];
};

export type RoomCalendarEvent = {
  source: string;
  title: string;
  startTime?: string | null;
  endTime?: string | null;
  detail?: string | null;
};

export type RoomDayAvailability = {
  roomId: number;
  roomName: string;
  active: boolean;
  events: RoomCalendarEvent[];
};

export type RoomAvailability = {
  date: string;
  rooms: RoomDayAvailability[];
};

export type RoomReservation = {
  id: number;
  roomId: number;
  roomName: string;
  memberId: number;
  memberName: string;
  type: "ESTUDIO" | "BANDA" | "RECUPERACION";
  reservationDate: string;
  startTime: string;
  endTime: string;
  cancelled: boolean;
  notes?: string | null;
};

export type SchoolOccurrence = {
  date: string;
  type: string;
  subjectName: string;
  roomName: string;
  teacherName: string;
  studentNames: string;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
};

export type MySchoolAgenda = {
  classes: SchoolOccurrence[];
  reservations: RoomReservation[];
};

export type BandRecurringReservation = {
  id: number;
  roomId: number;
  roomName: string;
  memberId: number;
  memberName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  notes?: string | null;
  active: boolean;
};

export type BandRecurringReservationException = {
  id: number;
  reservationId: number;
  exceptionDate: string;
  notes?: string | null;
};
