/**
 * Internationalisation des chaînes de l'interface (UI).
 * À ne pas confondre avec le contenu localisé (pages FAQ/CGU…) qui vient de l'API Payload via ?locale=.
 *
 * Les codes de langue sont alignés sur le back (cf. apps/content/src/locales.ts).
 */
export const LOCALES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' },
] as const;

export type LocaleCode = (typeof LOCALES)[number]['code'];

export const DEFAULT_LOCALE: LocaleCode = 'fr';

export const LOCALE_CODES = LOCALES.map((l) => l.code);

export function isLocaleCode(value: string | null | undefined): value is LocaleCode {
  return !!value && (LOCALE_CODES as readonly string[]).includes(value);
}

type Dictionary = Record<string, string>;

const fr: Dictionary = {
  'common.email': 'Email',
  'common.password': 'Mot de passe',
  'common.firstName': 'Prénom',
  'common.lastName': 'Nom',
  'common.language': 'Langue',
  'common.backToLogin': 'Retour à la connexion',

  'login.title': 'Connexion',
  'login.subtitle': 'Accède à tes abonnements de transport.',
  'login.forgot': 'Mot de passe oublié ?',
  'login.submit': 'Se connecter',
  'login.noAccount': 'Pas encore de compte ?',
  'login.createAccount': 'Créer un compte',
  'login.errFields': 'Renseigne ton email et ton mot de passe.',
  'login.errGeneric': 'Connexion impossible.',
  'login.orDivider': 'ou',
  'login.googleSignIn': 'Continuer avec Google',
  'login.errGoogle': 'Connexion Google impossible.',

  'register.title': 'Créer un compte',
  'register.subtitle': 'Gère tes abonnements et ceux de tes proches.',
  'register.confirm': 'Confirmer le mot de passe',
  'register.submit': 'Créer mon compte',
  'register.haveAccount': 'Déjà un compte ?',
  'register.signIn': 'Se connecter',
  'register.errRequired': 'Email et mot de passe sont obligatoires.',
  'register.errLen': 'Le mot de passe doit faire au moins 8 caractères.',
  'register.errMatch': 'Les mots de passe ne correspondent pas.',
  'register.errGeneric': 'Inscription impossible.',
  'register.orDivider': 'ou',
  'register.googleSignIn': "S'inscrire avec Google",
  'register.errGoogle': 'Inscription Google impossible.',

  'forgot.title': 'Mot de passe oublié',
  'forgot.subtitle': "Saisis ton email : on t'envoie un lien pour choisir un nouveau mot de passe.",
  'forgot.sent': "Si un compte existe pour cette adresse, un email avec un lien de réinitialisation vient d'être envoyé. Pense à vérifier tes spams.",
  'forgot.send': 'Envoyer le lien',
  'forgot.haveCode': "J'ai reçu un code",
  'forgot.resend': "Renvoyer l'email",
  'forgot.errEmail': 'Renseigne ton email.',
  'forgot.errGeneric': 'Demande impossible.',

  'reset.title': 'Nouveau mot de passe',
  'reset.subtitle': 'Choisis un nouveau mot de passe pour ton compte.',
  'reset.codeLabel': 'Code de réinitialisation',
  'reset.codePlaceholder': 'Colle le code reçu par email',
  'reset.submit': 'Réinitialiser',
  'reset.errMissing': 'Le code de réinitialisation est manquant.',
  'reset.errLen': 'Le mot de passe doit faire au moins 8 caractères.',
  'reset.errMatch': 'Les mots de passe ne correspondent pas.',
  'reset.errGeneric': 'Réinitialisation impossible. Le lien a peut-être expiré.',

  'profile.title': 'Mon profil',
  'profile.role': 'Rôle',
  'profile.signOut': 'Se déconnecter',

  'nav.home': 'Accueil',
  'nav.explore': 'Explorer',
  'nav.profile': 'Profil',

  'language.title': 'Choisir la langue',
};

const en: Dictionary = {
  'common.email': 'Email',
  'common.password': 'Password',
  'common.firstName': 'First name',
  'common.lastName': 'Last name',
  'common.language': 'Language',
  'common.backToLogin': 'Back to login',

  'login.title': 'Login',
  'login.subtitle': 'Access your transport subscriptions.',
  'login.forgot': 'Forgot password?',
  'login.submit': 'Sign in',
  'login.noAccount': "Don't have an account?",
  'login.createAccount': 'Create an account',
  'login.errFields': 'Enter your email and password.',
  'login.errGeneric': 'Unable to sign in.',
  'login.orDivider': 'or',
  'login.googleSignIn': 'Continue with Google',
  'login.errGoogle': 'Google sign-in failed.',

  'register.title': 'Create an account',
  'register.subtitle': 'Manage your subscriptions and those of your relatives.',
  'register.confirm': 'Confirm password',
  'register.submit': 'Create my account',
  'register.haveAccount': 'Already have an account?',
  'register.signIn': 'Sign in',
  'register.errRequired': 'Email and password are required.',
  'register.errLen': 'Password must be at least 8 characters.',
  'register.errMatch': 'Passwords do not match.',
  'register.errGeneric': 'Unable to register.',
  'register.orDivider': 'or',
  'register.googleSignIn': 'Sign up with Google',
  'register.errGoogle': 'Google sign-up failed.',

  'forgot.title': 'Forgot password',
  'forgot.subtitle': "Enter your email: we'll send you a link to choose a new password.",
  'forgot.sent': 'If an account exists for this address, an email with a reset link has just been sent. Check your spam folder.',
  'forgot.send': 'Send link',
  'forgot.haveCode': 'I received a code',
  'forgot.resend': 'Resend email',
  'forgot.errEmail': 'Enter your email.',
  'forgot.errGeneric': 'Request failed.',

  'reset.title': 'New password',
  'reset.subtitle': 'Choose a new password for your account.',
  'reset.codeLabel': 'Reset code',
  'reset.codePlaceholder': 'Paste the code received by email',
  'reset.submit': 'Reset',
  'reset.errMissing': 'The reset code is missing.',
  'reset.errLen': 'Password must be at least 8 characters.',
  'reset.errMatch': 'Passwords do not match.',
  'reset.errGeneric': 'Reset failed. The link may have expired.',

  'profile.title': 'My profile',
  'profile.role': 'Role',
  'profile.signOut': 'Sign out',

  'nav.home': 'Home',
  'nav.explore': 'Explore',
  'nav.profile': 'Profile',

  'language.title': 'Choose language',
};

const es: Dictionary = {
  'common.email': 'Correo electrónico',
  'common.password': 'Contraseña',
  'common.firstName': 'Nombre',
  'common.lastName': 'Apellido',
  'common.language': 'Idioma',
  'common.backToLogin': 'Volver al inicio de sesión',

  'login.title': 'Iniciar sesión',
  'login.subtitle': 'Accede a tus abonos de transporte.',
  'login.forgot': '¿Olvidaste tu contraseña?',
  'login.submit': 'Iniciar sesión',
  'login.noAccount': '¿Aún no tienes cuenta?',
  'login.createAccount': 'Crear una cuenta',
  'login.errFields': 'Introduce tu correo y contraseña.',
  'login.errGeneric': 'No se pudo iniciar sesión.',
  'login.orDivider': 'o',
  'login.googleSignIn': 'Continuar con Google',
  'login.errGoogle': 'Error al iniciar sesión con Google.',

  'register.title': 'Crear una cuenta',
  'register.subtitle': 'Gestiona tus abonos y los de tus allegados.',
  'register.confirm': 'Confirmar contraseña',
  'register.submit': 'Crear mi cuenta',
  'register.haveAccount': '¿Ya tienes una cuenta?',
  'register.signIn': 'Iniciar sesión',
  'register.errRequired': 'El correo y la contraseña son obligatorios.',
  'register.errLen': 'La contraseña debe tener al menos 8 caracteres.',
  'register.errMatch': 'Las contraseñas no coinciden.',
  'register.errGeneric': 'No se pudo registrar.',
  'register.orDivider': 'o',
  'register.googleSignIn': 'Registrarse con Google',
  'register.errGoogle': 'Error al registrarse con Google.',

  'forgot.title': 'Contraseña olvidada',
  'forgot.subtitle': 'Introduce tu correo: te enviaremos un enlace para elegir una nueva contraseña.',
  'forgot.sent': 'Si existe una cuenta para esta dirección, se acaba de enviar un correo con un enlace de restablecimiento. Revisa tu carpeta de spam.',
  'forgot.send': 'Enviar enlace',
  'forgot.haveCode': 'He recibido un código',
  'forgot.resend': 'Reenviar correo',
  'forgot.errEmail': 'Introduce tu correo.',
  'forgot.errGeneric': 'La solicitud falló.',

  'reset.title': 'Nueva contraseña',
  'reset.subtitle': 'Elige una nueva contraseña para tu cuenta.',
  'reset.codeLabel': 'Código de restablecimiento',
  'reset.codePlaceholder': 'Pega el código recibido por correo',
  'reset.submit': 'Restablecer',
  'reset.errMissing': 'Falta el código de restablecimiento.',
  'reset.errLen': 'La contraseña debe tener al menos 8 caracteres.',
  'reset.errMatch': 'Las contraseñas no coinciden.',
  'reset.errGeneric': 'El restablecimiento falló. Es posible que el enlace haya caducado.',

  'profile.title': 'Mi perfil',
  'profile.role': 'Rol',
  'profile.signOut': 'Cerrar sesión',

  'nav.home': 'Inicio',
  'nav.explore': 'Explorar',
  'nav.profile': 'Perfil',

  'language.title': 'Elegir idioma',
};

const zh: Dictionary = {
  'common.email': '电子邮箱',
  'common.password': '密码',
  'common.firstName': '名字',
  'common.lastName': '姓氏',
  'common.language': '语言',
  'common.backToLogin': '返回登录',

  'login.title': '登录',
  'login.subtitle': '访问您的交通订阅。',
  'login.forgot': '忘记密码？',
  'login.submit': '登录',
  'login.noAccount': '还没有账户？',
  'login.createAccount': '创建账户',
  'login.errFields': '请输入您的邮箱和密码。',
  'login.errGeneric': '无法登录。',
  'login.orDivider': '或',
  'login.googleSignIn': '使用 Google 登录',
  'login.errGoogle': 'Google 登录失败。',

  'register.title': '创建账户',
  'register.subtitle': '管理您及亲友的订阅。',
  'register.confirm': '确认密码',
  'register.submit': '创建我的账户',
  'register.haveAccount': '已有账户？',
  'register.signIn': '登录',
  'register.errRequired': '邮箱和密码为必填项。',
  'register.errLen': '密码至少需要 8 个字符。',
  'register.errMatch': '两次输入的密码不一致。',
  'register.errGeneric': '注册失败。',
  'register.orDivider': '或',
  'register.googleSignIn': '使用 Google 注册',
  'register.errGoogle': 'Google 注册失败。',

  'forgot.title': '忘记密码',
  'forgot.subtitle': '请输入您的邮箱：我们会发送一个链接以设置新密码。',
  'forgot.sent': '如果该邮箱存在对应账户，重置链接邮件已发送。请检查垃圾邮件文件夹。',
  'forgot.send': '发送链接',
  'forgot.haveCode': '我已收到验证码',
  'forgot.resend': '重新发送邮件',
  'forgot.errEmail': '请输入您的邮箱。',
  'forgot.errGeneric': '请求失败。',

  'reset.title': '新密码',
  'reset.subtitle': '为您的账户设置新密码。',
  'reset.codeLabel': '重置代码',
  'reset.codePlaceholder': '粘贴邮件中收到的代码',
  'reset.submit': '重置',
  'reset.errMissing': '缺少重置代码。',
  'reset.errLen': '密码至少需要 8 个字符。',
  'reset.errMatch': '两次输入的密码不一致。',
  'reset.errGeneric': '重置失败，链接可能已过期。',

  'profile.title': '我的资料',
  'profile.role': '角色',
  'profile.signOut': '退出登录',

  'nav.home': '首页',
  'nav.explore': '探索',
  'nav.profile': '个人资料',

  'language.title': '选择语言',
};

export const translations: Record<LocaleCode, Dictionary> = { fr, en, es, zh };

export type TranslationKey = keyof typeof fr;

/** Traduit une clé pour une locale donnée, avec repli sur le français puis sur la clé brute. */
export function translate(locale: LocaleCode, key: TranslationKey): string {
  return translations[locale]?.[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
}
