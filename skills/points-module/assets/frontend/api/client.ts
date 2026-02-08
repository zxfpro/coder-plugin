import { ApiResponse } from './types';

const API_BASE_URL = '/api';

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export async function getPointsBalance(): Promise<{ balance: number }> {
  return apiFetch('/points/balance');
}

export async function consumePoints(data: {
  action: string;
  size: string;
  feature: string;
}): Promise<{ ok: boolean; remaining: number }> {
  return apiFetch('/points/consume', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getPointsTransactions(
  limit: number = 50
): Promise<{ transactions: any[] }> {
  return apiFetch(`/points/transactions?limit=${limit}`);
}

export async function getRechargePlans(): Promise<{ plans: any[] }> {
  return apiFetch('/points/recharge-plans');
}

export async function rechargePoints(data: {
  plan_id: number;
  payment_method: string;
}): Promise<{ ok: boolean; order_id: number; remaining: number }> {
  return apiFetch('/points/recharge', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}