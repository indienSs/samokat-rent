import { api } from './client';
import type {
  AnalyticsOverview,
  AuthResult,
  CreateCustomerBody,
  CreateRentalBody,
  CreateScooterBody,
  Customer,
  ListRentalsParams,
  ListScootersParams,
  Paginated,
  Rental,
  Scooter,
  UpdateCustomerBody,
  UpdateScooterBody,
} from './types';

export const authApi = {
  login: (email: string, password: string) =>
    api
      .post<AuthResult>('/auth/login', { email, password })
      .then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const scootersApi = {
  list: (params?: ListScootersParams) =>
    api.get<Scooter[]>('/scooters', { params }).then((r) => r.data),
  one: (id: string) =>
    api.get<Scooter>(`/scooters/${id}`).then((r) => r.data),
  create: (body: CreateScooterBody) =>
    api.post<Scooter>('/scooters', body).then((r) => r.data),
  update: (id: string, body: UpdateScooterBody) =>
    api.patch<Scooter>(`/scooters/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/scooters/${id}`),
};

export const customersApi = {
  list: (q?: string) =>
    api.get<Customer[]>('/customers', { params: { q } }).then((r) => r.data),
  create: (body: CreateCustomerBody) =>
    api.post<Customer>('/customers', body).then((r) => r.data),
  update: (id: string, body: UpdateCustomerBody) =>
    api.patch<Customer>(`/customers/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/customers/${id}`),
};

export const rentalsApi = {
  list: (params?: ListRentalsParams) =>
    api
      .get<Paginated<Rental>>('/rentals', { params })
      .then((r) => r.data),
  create: (body: CreateRentalBody) =>
    api.post<Rental>('/rentals', body).then((r) => r.data),
  complete: (id: string) =>
    api.post<Rental>(`/rentals/${id}/complete`).then((r) => r.data),
};

export const analyticsApi = {
  overview: () =>
    api.get<AnalyticsOverview>('/analytics/overview').then((r) => r.data),
};
