# UpSiteDown

A site to upload temporary images to download from somewhere else.

## Features

- Upload up to 100 images at once
- Drag and drop or file selection interface
- Images stored in Neon serverless database
- View all uploaded images in a gallery
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

4. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your Neon database URL to `DATABASE_URL`

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

- **Home Page (/)**: Upload images by dragging and dropping or selecting files
- **Uploaded Images (/uploaded)**: View all uploaded images in a gallery

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- Neon Serverless Postgres
- React Dropzone

## Deployment

### Important: GitHub Pages Limitation

This application **cannot be deployed to GitHub Pages** because it uses Next.js API routes (`/api/upload` and `/api/images`) that require a Node.js server runtime. GitHub Pages only supports static HTML/CSS/JavaScript files.

### Recommended Deployment Platforms

#### 1. Vercel (Recommended)

The easiest way to deploy this Next.js app:

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/new)
3. Import your GitHub repository
4. Add environment variable: `DATABASE_URL` (your Neon connection string)
5. Deploy

Vercel automatically detects Next.js and configures everything correctly.

#### 2. Netlify

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Run: `netlify init`
3. Add environment variable `DATABASE_URL` in Netlify dashboard
4. Deploy with: `netlify deploy --prod`

#### 3. Railway

1. Go to [Railway](https://railway.app/)
2. Create new project from GitHub repo
3. Add `DATABASE_URL` environment variable
4. Railway will auto-deploy

#### 4. Render

1. Go to [Render](https://render.com/)
2. Create new Web Service from your GitHub repo
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add `DATABASE_URL` environment variable

### CI/CD Pipeline

This repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys to Vercel:

**On Pull Requests:**
- Installs dependencies and runs linter
- Builds the application
- Deploys a preview to Vercel
- Comments the preview URL on the PR

**On Push to Main:**
- Installs dependencies and runs linter
- Builds the application
- Deploys to production on Vercel

#### Required GitHub Secrets

To enable Vercel deployment, add these secrets to your repository:

1. **`VERCEL_TOKEN`**: Your Vercel personal access token
   - Get it from [Vercel Account Settings](https://vercel.com/account/tokens)

2. **`VERCEL_ORG_ID`**: Your Vercel organization/team ID
   - Run `vercel link` locally, then check `.vercel/project.json`

3. **`VERCEL_PROJECT_ID`**: Your Vercel project ID
   - Run `vercel link` locally, then check `.vercel/project.json`

4. **`DATABASE_URL`** (optional): Your Neon database connection string
   - Required for the app to function, but builds will work without it

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

