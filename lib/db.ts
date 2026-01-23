import { neon } from '@neondatabase/serverless';

let sqlClient: ReturnType<typeof neon> | null = null;

function getSQL() {
  if (!sqlClient) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    sqlClient = neon(process.env.DATABASE_URL);
  }
  return sqlClient;
}

export interface UploadedImage {
  id: number;
  filename: string;
  original_name: string;
  size: number;
  upload_date: Date;
  data: string; // base64 encoded image data
}

export async function initDatabase() {
  const sql = getSQL();
  // Create the images table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS images (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      size INTEGER NOT NULL,
      upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      data TEXT NOT NULL
    )
  `;
}

export async function saveImage(filename: string, originalName: string, size: number, data: string) {
  const sql = getSQL();
  const result = await sql`
    INSERT INTO images (filename, original_name, size, data)
    VALUES (${filename}, ${originalName}, ${size}, ${data})
    RETURNING id, filename, original_name, size, upload_date
  ` as any;
  return result[0];
}

export async function getAllImages(): Promise<UploadedImage[]> {
  const sql = getSQL();
  const result = await sql`
    SELECT id, filename, original_name, size, upload_date, data
    FROM images
    ORDER BY upload_date DESC
  `;
  return result as UploadedImage[];
}
