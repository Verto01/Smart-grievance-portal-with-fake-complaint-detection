import dotenv from 'dotenv';
import path from 'node:path';
import mongoose from 'mongoose';

// Load .env from workspace or repository root
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

import { createApp } from './app';
import { loadConfig } from './config';

async function main() {
  const config = loadConfig();

  await mongoose.connect(config.MONGO_URI);
  console.log('Connected to MongoDB');

  try {
    const { seed } = await import('@nagrik-setu/domain');
    const seedResult = await seed();
    console.log('Master data initialized:', seedResult);
  } catch (err) {
    console.warn('Master data auto-seed notice:', err);
  }

  const app = createApp({ clientOrigin: config.CLIENT_ORIGIN });
  const port = config.PORT ?? 4000;

  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
