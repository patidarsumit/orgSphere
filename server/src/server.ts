import 'reflect-metadata'
import dotenv from 'dotenv'

dotenv.config()

import app from './app'
import { AppDataSource } from './data-source'

const PORT = process.env.PORT || 4000

AppDataSource.initialize()
  .then(() => {
    console.log('PostgreSQL connected')
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`)
    })
  })
  .catch((error: unknown) => {
    console.error('Database connection failed:', error)
    process.exit(1)
  })

