export type ScooterStatus = 'available' | 'in_use' | 'maintenance' | 'offline';
export type RentalStatus = 'active' | 'completed';
export type UserRole = 'admin';

export interface Scooter {
  id: string;
  number: string;
  model: string;
  status: ScooterStatus;
  batteryLevel: number;
  lat: number;
  lng: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export interface Rental {
  id: string;
  scooterId: string;
  customerId: string;
  scooter?: Scooter;
  customer?: Customer;
  startedAt: string;
  endedAt: string | null;
  status: RentalStatus;
  durationMinutes: number | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AnalyticsOverview {
  byStatus: Record<ScooterStatus, number>;
  totalScooters: number;
  activeRentals: number;
  completedRentals: number;
  averageBattery: number;
  totalCustomers: number;
}

export interface AuthResult {
  accessToken: string;
  user: { id: string; email: string; name: string; role: UserRole };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface ListScootersParams {
  status?: ScooterStatus;
  q?: string;
  minBattery?: number;
  maxBattery?: number;
}

export interface CreateScooterBody {
  number: string;
  model: string;
  status?: ScooterStatus;
  batteryLevel?: number;
  lat: number;
  lng: number;
}

export type UpdateScooterBody = Partial<CreateScooterBody>;

export interface CreateCustomerBody {
  name: string;
  phone: string;
}

export type UpdateCustomerBody = Partial<CreateCustomerBody>;

export interface CreateRentalBody {
  scooterId: string;
  customerId: string;
  startedAt?: string;
}

export interface ListRentalsParams {
  status?: RentalStatus;
  page?: number;
  pageSize?: number;
}

export const SCOOTER_STATUS_META: Record<
  ScooterStatus,
  { label: string; color: string }
> = {
  available: { label: 'Доступен', color: 'green' },
  in_use: { label: 'В аренде', color: 'blue' },
  maintenance: { label: 'Обслуживание', color: 'orange' },
  offline: { label: 'Офлайн', color: 'default' },
};

export const RENTAL_STATUS_META: Record<
  RentalStatus,
  { label: string; color: string }
> = {
  active: { label: 'Активна', color: 'processing' },
  completed: { label: 'Завершена', color: 'default' },
};

export const SCOOTER_STATUSES = Object.keys(
  SCOOTER_STATUS_META,
) as ScooterStatus[];
