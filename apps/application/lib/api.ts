import { getToken } from './token-storage';

/**
 * Client API minimal pour l'auth Payload.
 * Base URL configurée via EXPO_PUBLIC_API_URL (cf. .env). Ex : http://localhost:3000/
 */
const RAW_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/';
const BASE_URL = RAW_BASE.replace(/\/$/, ''); // retire un éventuel slash final

export type Preferences = {
  birthdate?: string | null;
  status?: 'student' | 'active' | 'retired' | 'jobseeker' | 'other' | null;
  usageDaysPerWeek?: number | null;
  socialBeneficiary?: boolean | null;
};
export { BASE_URL };

export type User = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roles?: string[] | null;
  onboardingCompleted?: boolean | null;
  preferences?: Preferences | null;
};

export type RecommendationResult = {
  recommendedSlug: string | null;
  plans: {
    slug: string;
    name: string;
    price: number;
    period: 'per-trip' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
    eligible: boolean;
    monthlyEquivalent: number;
  }[];
  authProvider?: 'email' | 'google' | 'apple' | null;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type LoginResponse = { token: string; exp: number; user: User };
type MeResponse = { user: User | null };

async function request<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `JWT ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      data?.errors?.[0]?.message ?? data?.message ?? `Erreur ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

/** Connexion : retourne le token JWT + l'utilisateur. */
export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/** Inscription : crée le compte. Payload n'ouvre pas de session ici → on enchaîne avec login(). */
export function register(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<{ doc: User }> {
  return request<{ doc: User }>('/api/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Demande un email de réinitialisation de mot de passe. Réponse 200 même si l'email n'existe pas (anti-énumération). */
export function forgotPassword(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('/api/users/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/** Réinitialise le mot de passe via le token reçu par email. Retourne un token JWT + l'utilisateur (connexion immédiate). */
export function resetPassword(token: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/users/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

/** Récupère l'utilisateur courant à partir du token stocké. */
export function me(): Promise<MeResponse> {
  return request<MeResponse>('/api/users/me', { method: 'GET' }, true);
}

/** Met à jour le compte courant (préférences, onboardingCompleted…). */
export function updateUser(
  id: string,
  data: { preferences?: Preferences; onboardingCompleted?: boolean },
): Promise<{ doc: User }> {
  return request<{ doc: User }>(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, true);
}

/** Recommandation d'abonnement selon un profil (ou, si non fourni, les préférences du compte). */
export function getRecommendation(params: {
  age?: number;
  status?: string;
  usageDaysPerWeek?: number;
  socialBeneficiary?: boolean;
}): Promise<RecommendationResult> {
  const qs = new URLSearchParams();
  if (params.age != null) qs.set('age', String(params.age));
  if (params.status) qs.set('status', params.status);
  if (params.usageDaysPerWeek != null) qs.set('usageDaysPerWeek', String(params.usageDaysPerWeek));
  if (params.socialBeneficiary != null) qs.set('socialBeneficiary', String(params.socialBeneficiary));
  return request<RecommendationResult>(`/api/plans/recommend?${qs.toString()}`, { method: 'GET' }, true);
}

/** Invalide la session côté serveur (le token reste valide jusqu'à expiration, mais on l'efface côté client). */
export function logout(): Promise<unknown> {
  return request('/api/users/logout', { method: 'POST' }, true);
}

export type VerifyPhotoResponse = { isHuman: boolean; message: string };

/** Vérifie via Claude Vision que la photo soumise pour l'abonnement contient un visage humain. */
export function verifyPhoto(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
): Promise<VerifyPhotoResponse> {
  return request<VerifyPhotoResponse>(
    '/api/verify-photo',
    { method: 'POST', body: JSON.stringify({ imageBase64, mediaType }) },
    true,
  );
}
