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
  url: string; // Edge Store URL
}

export async function initDatabase() {
  const sql = getSQL();
  
  // Check if the images table exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableExists: any = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'images'
    ) as exists
  `;

  if (!tableExists[0]?.exists) {
    // Create the images table with new schema (url column)
    await sql`
      CREATE TABLE images (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        size INTEGER NOT NULL,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        url TEXT NOT NULL
      )
    `;
  } else {
    // Check if the table has the old schema (data column) and migrate to new schema (url column)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasDataColumn: any = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'images' AND column_name = 'data'
      ) as exists
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasUrlColumn: any = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'images' AND column_name = 'url'
      ) as exists
    `;

    // If table has old 'data' column but no 'url' column, we need to migrate
    if (hasDataColumn[0]?.exists && !hasUrlColumn[0]?.exists) {
      // Add the url column (allowing NULL initially for migration)
      await sql`ALTER TABLE images ADD COLUMN url TEXT`;
      
      // Drop the old data column (base64 data will be lost)
      await sql`ALTER TABLE images DROP COLUMN data`;
      
      // Make url NOT NULL after migration (will fail if there are rows without url)
      // For existing rows without url, they will need to be re-uploaded
      await sql`DELETE FROM images WHERE url IS NULL`;
      await sql`ALTER TABLE images ALTER COLUMN url SET NOT NULL`;
    } else if (!hasUrlColumn[0]?.exists) {
      // Table exists but doesn't have url column (unexpected state)
      await sql`ALTER TABLE images ADD COLUMN url TEXT NOT NULL DEFAULT ''`;
    }
  }
}

export async function saveImage(filename: string, originalName: string, size: number, url: string) {
  const sql = getSQL();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await sql`
    INSERT INTO images (filename, original_name, size, url)
    VALUES (${filename}, ${originalName}, ${size}, ${url})
    RETURNING id, filename, original_name, size, upload_date
  `;
  return result[0] as { id: number; filename: string; original_name: string; size: number; upload_date: Date };
}

export async function getAllImages(): Promise<UploadedImage[]> {
  const sql = getSQL();
  const result = await sql`
    SELECT id, filename, original_name, size, upload_date, url
    FROM images
    ORDER BY upload_date DESC
  `;
  return result as UploadedImage[];
}
