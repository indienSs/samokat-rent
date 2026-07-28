export enum ScooterStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  OFFLINE = 'offline',
}

export enum RentalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export enum UserRole {
  ADMIN = 'admin',
}

export const SCOOTER_STATUSES = Object.values(ScooterStatus);
export const RENTAL_STATUSES = Object.values(RentalStatus);
