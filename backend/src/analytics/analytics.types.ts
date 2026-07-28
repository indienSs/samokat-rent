import { ScooterStatus } from '../common/enums';

export interface AnalyticsOverview {
  byStatus: Record<ScooterStatus, number>;
  totalScooters: number;
  activeRentals: number;
  completedRentals: number;
  averageBattery: number;
  totalCustomers: number;
}
