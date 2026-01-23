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

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

