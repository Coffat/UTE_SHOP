import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(moduleDir, '../.env');

dotenv.config({ path: envPath });
