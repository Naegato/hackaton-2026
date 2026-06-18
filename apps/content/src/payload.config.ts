import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Plans } from './collections/Plans'
import { Subscriptions } from './collections/Subscriptions'
import { TransferRequests } from './collections/TransferRequests'
import { pageGlobals } from './globals/Pages'
import { defaultLocale, locales } from './locales'
import { googleOAuthCallback, googleOAuthRedirect } from './endpoints/oauth-google'
import { verifyPhoto } from './endpoints/verify-photo'
import { assistantEndpoint } from './endpoints/assistant'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Plans, Subscriptions, TransferRequests],
  globals: pageGlobals,
  // Localization : le contenu marqué `localized` est stocké par langue.
  // L'API renvoie la bonne version via ?locale=<code> ; fallback sur le français si traduction absente.
  localization: {
    locales: [...locales],
    defaultLocale,
    fallback: true,
  },
  // Endpoint public pour que le front liste les langues disponibles et propose le choix.
  endpoints: [
    {
      path: '/locales',
      method: 'get',
      handler: () => Response.json({ locales, defaultLocale }),
    },
    googleOAuthRedirect,
    googleOAuthCallback,
    verifyPhoto,
    assistantEndpoint,
  ],
  editor: lexicalEditor(),
  // CORS : origines autorisées à appeler l'API.
  // Le mobile natif n'est pas soumis au CORS (pas d'origine) ; cette liste sert au web (Expo web :8081) et à l'admin (:3000).
  // Surchargeable en prod via CORS_ORIGINS (liste séparée par des virgules).
  cors: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:8081', 'http://localhost:3000'],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  sharp,
  plugins: [],
  email: nodemailerAdapter({
    defaultFromName: 'IDF Mobilité',
    defaultFromAddress: 'no-reply@idf-mobilite.test',
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
    },
  }),
})
