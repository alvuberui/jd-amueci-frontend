export type ApiError = {
  message: string;
  status: number;
  timestamp: string;
  fieldErrors?: Record<string, string>;
};

export type AuthResponse = {
  token: string | null;
  username: string;
  role: string;
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
export type GarmentType = "CHAQUETA" | "PANTALON" | "CAMISA" | "PAR_DE_HOMBRERAS" | "CUELLOS" | "PAR_DE_MANGAS";
export type InstrumentStatus = "DISPONIBLE" | "PRESTADO" | "EN_REPARACION" | "FUERA_DE_USO";

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
