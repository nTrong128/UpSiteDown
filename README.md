# UpSiteDown

A site to upload temporary images to download from somewhere else.

## Features

- Upload up to 100 images at once
- Drag and drop or file selection interface
- Images stored in Cloudinary cloud storage
- Image metadata stored in Neon serverless database
- View all uploaded images in a gallery
- Automatic image resizing for files over 4MB
- Built with Next.js 16 and TypeScript

## Setup

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Neon database:
   - Go to [Neon Console](https://console.neon.tech/)
   - Create a new project
   - Copy the database connection string

4. Create a Cloudinary account:
   - Go to [Cloudinary Console](https://console.cloudinary.com/)
   - Create a new account or sign in
   - Copy your `CLOUDINARY_URL` from the dashboard (format: `cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>`)

5. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your Neon database URL to `DATABASE_URL`
   - Add your Cloudinary URL to `CLOUDINARY_URL`

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

- **Home Page (/)**: Upload images by dragging and dropping or selecting files
- **Uploaded Images (/uploaded)**: View all uploaded images in a gallery

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- Cloudinary (image storage)
- Neon Serverless Postgres (metadata storage)
- React Dropzone

## Deployment

### Recommended Deployment Platforms

#### 1. Vercel (Recommended)

The easiest way to deploy this Next.js app:

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/new)
3. Import your GitHub repository
4. Add environment variables:
   - `DATABASE_URL` (your Neon connection string)
   - `CLOUDINARY_URL` (your Cloudinary URL)
5. Deploy

Vercel automatically detects Next.js and configures everything correctly.

#### 2. Netlify

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Run: `netlify init`
3. Add environment variables `DATABASE_URL` and `CLOUDINARY_URL` in Netlify dashboard
4. Deploy with: `netlify deploy --prod`

#### 3. Railway

1. Go to [Railway](https://railway.app/)
2. Create new project from GitHub repo
3. Add `DATABASE_URL` and `CLOUDINARY_URL` environment variables
4. Railway will auto-deploy

#### 4. Render

1. Go to [Render](https://render.com/)
2. Create new Web Service from your GitHub repo
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add `DATABASE_URL` and `CLOUDINARY_URL` environment variables

### CI/CD Pipeline

This repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:
- Runs on every push to main and pull requests
- Installs dependencies
- Runs linter
- Builds the application
- Uploads build artifacts

The pipeline validates that your code builds successfully before merging.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

