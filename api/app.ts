/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import articleRoutes from './routes/articles.js'
import categoryRoutes from './routes/categories.js'
import tagRoutes from './routes/tags.js'
import commentRoutes from './routes/comments.js'
import searchRoutes from './routes/search.js'
import userRoutes from './routes/users.js'
import sitemapRoutes from './routes/sitemap.js'
import { connectDB } from './config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.join(__dirname, '..', '.env')
dotenv.config({ path: envPath })

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.')
  console.error('Please set JWT_SECRET in your .env file or environment variables.')
  process.exit(1)
}

const app: express.Application = express()

// trust proxy for rate limiter behind Vercel
app.set('trust proxy', 1)

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests' },
})
app.use('/api/', limiter)

// DB 连接中间件：确保每个请求前数据库已连接
let dbStatus: 'pending' | 'connected' | 'failed' = 'pending'
let dbPromise: Promise<boolean> | null = null

app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (dbStatus === 'connected') return next()
  if (dbStatus === 'failed') {
    res.status(503).json({ success: false, message: 'Database not available' })
    return
  }
  // 首次连接
  if (!dbPromise) {
    dbPromise = connectDB().then((ok) => {
      dbStatus = ok ? 'connected' : 'failed'
      return ok
    })
  }
  const ok = await dbPromise
  if (!ok) {
    res.status(503).json({ success: false, message: 'Database not available' })
    return
  }
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/tags', tagRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/users', userRoutes)
app.use('/api/sitemap', sitemapRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
