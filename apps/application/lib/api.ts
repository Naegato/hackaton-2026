import { Platform } from 'react-native';

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
export type DetailedProfile =
  | 'collegien'
  | 'lyceen'
  | 'etudiant'
  | 'alternant'
  | 'salarie'
  | 'fonctionnaire'
  | 'independant'
  | 'chomeur'
  | 'rsa'
  | 'retraite'
  | 'handicap'
  | 'militaire'
  | 'enceinte'
  | 'service-civique';

export type EmployerReimbursement = '50' | 'plus' | 'non';

export type Situation =
  | 'boursier-crous'
  | 'boursier-en'
  | 'non-boursier'
  | 'cecite'
  | 'invalidite'
  | 'priorite'
  | 'cmi'
  | 'modeste'
  | 'aucune'
  | 'etudiante'
  | 'non';

export { BASE_URL };

export type User = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roles?: string[] | null;
  authProvider?: 'email' | 'google' | 'apple' | null;
  onboardingCompleted?: boolean | null;
  preferences?: Preferences | null;
};

export type RecommendationResult = {
  recommendedSlug: string | null;
  plans: {
    id: string;
    slug: string;
    name: string;
    price: number;
    period: 'per-trip' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
    eligible: boolean;
    monthlyEquivalent: number;
    image?: string | null;
    zones?: string | null;
    eligibility?: {
      minAge?: number | null;
      maxAge?: number | null;
      studentOnly?: boolean | null;
      meansTested?: boolean | null;
      requiresCMI?: boolean | null;
    } | null;
    recommendedFor?: {
      minAge?: number | null;
      maxAge?: number | null;
      usageDaysPerWeekMin?: number | null;
      usageDaysPerWeekMax?: number | null;
      profileLabel?: string | null;
    } | null;
  }[];
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

/** Souscrit à une offre : crée un abonnement (statut « en attente de validation »). managedBy = compte courant (hook serveur). */
export function createSubscription(input: {
  plan: string;
  holderFirstName?: string;
  holderLastName?: string;
}): Promise<{ doc: { id: string; status: string } }> {
  return request<{ doc: { id: string; status: string } }>(
    '/api/subscriptions',
    { method: 'POST', body: JSON.stringify({ ...input, status: 'pending' }) },
    true,
  );
}

export type DocStatus = 'pending' | 'validated' | 'refused';
export type DocType = 'id' | 'photo' | 'school' | 'income' | 'cmi';
export type SubscriptionDoc = {
  id: string;
  type: DocType;
  status: DocStatus;
  refusalReason?: string | null;
  subscription?: string | null;
};

export type PlanEligibility = RecommendationResult['plans'][number]['eligibility'];

export type MySubscription = {
  id: string;
  status: string;
  plan: { id: string; slug: string; name: string; eligibility?: PlanEligibility } | null;
  holderFirstName?: string | null;
  holderLastName?: string | null;
};

/** Liste les abonnements du compte courant (offre peuplée, avec éligibilité pour déduire les documents requis). */
export async function listMySubscriptions(): Promise<MySubscription[]> {
  const res = await request<{
    docs: { id: string; status: string; plan: unknown; holderFirstName?: string; holderLastName?: string }[];
  }>('/api/subscriptions?depth=1&limit=50&sort=-createdAt', { method: 'GET' }, true);
  return res.docs.map((d) => {
    const plan = d.plan as { id?: string; slug?: string; name?: string; eligibility?: PlanEligibility } | null;
    return {
      id: d.id,
      status: d.status,
      plan:
        plan && typeof plan === 'object'
          ? { id: plan.id ?? '', slug: plan.slug ?? '', name: plan.name ?? '', eligibility: plan.eligibility ?? null }
          : null,
      holderFirstName: d.holderFirstName ?? null,
      holderLastName: d.holderLastName ?? null,
    };
  });
}

/** Indique si le compte courant possède au moins un abonnement « en cours » (actif ou en validation, hors expiré/résilié). */
export async function hasCurrentSubscription(): Promise<boolean> {
  const res = await request<{ totalDocs?: number }>(
    '/api/subscriptions?where[status][in][0]=active&where[status][in][1]=pending&limit=1&depth=0',
    { method: 'GET' },
    true,
  );
  return (res.totalDocs ?? 0) > 0;
}

/** Liste tous les documents du compte courant (tous abonnements confondus). */
export async function listAllMyDocuments(): Promise<SubscriptionDoc[]> {
  const res = await request<{ docs: SubscriptionDoc[] }>(
    '/api/subscription-documents?depth=0&limit=200',
    { method: 'GET' },
    true,
  );
  return res.docs;
}

/** Trouve l'abonnement du compte courant pour une offre donnée (ou null). */
export async function findMySubscription(planId: string): Promise<{ id: string } | null> {
  const res = await request<{ docs: { id: string }[] }>(
    `/api/subscriptions?where[plan][equals]=${planId}&limit=1&depth=0`,
    { method: 'GET' },
    true,
  );
  return res.docs[0] ?? null;
}

/** Liste les documents fournis pour un abonnement (avec leur statut). */
export async function listSubscriptionDocuments(subscriptionId: string): Promise<SubscriptionDoc[]> {
  const res = await request<{ docs: SubscriptionDoc[] }>(
    `/api/subscription-documents?where[subscription][equals]=${subscriptionId}&limit=50&depth=0`,
    { method: 'GET' },
    true,
  );
  return res.docs;
}

/** Téléverse un document (multipart) rattaché à un abonnement. Statut initial : en attente. */
export async function uploadSubscriptionDocument(
  asset: { uri: string; name: string; mimeType: string },
  meta: { type: DocType; subscription: string },
): Promise<{ id: string }> {
  const form = new FormData();
  // Payload (upload) attend les champs du document dans `_payload` (JSON), le fichier sous `file`
  form.append('_payload', JSON.stringify({ type: meta.type, subscription: meta.subscription }));
  if (Platform.OS === 'web') {
    const blob = await (await fetch(asset.uri)).blob();
    form.append('file', blob, asset.name);
  } else {
    // FormData fichier en natif (RN accepte cet objet)
    form.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType } as unknown as Blob);
  }

  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/subscription-documents`, {
    method: 'POST',
    headers: token ? { Authorization: `JWT ${token}` } : undefined,
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.errors?.[0]?.message ?? data?.message ?? `Erreur ${res.status}`, res.status);
  }
  return { id: data.doc.id };
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

export type AssistantResponse = {
  answer: string;
  suggestions: string[];
  cta: { label: string; url: string } | null;
};

/** Envoie un message à l'assistant LÉIA. */
export function askAssistant(message: string, screen?: string): Promise<AssistantResponse> {
  return request<AssistantResponse>('/api/assistant', {
    method: 'POST',
    body: JSON.stringify({ message, screen }),
  });
}
