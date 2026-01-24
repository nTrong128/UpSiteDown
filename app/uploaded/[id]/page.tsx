import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { initDatabase, getImageById, UploadedImage } from '@/lib/db';
import ImageDetailClient from './ImageDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getImage(id: string): Promise<UploadedImage | null> {
  const imageId = parseInt(id, 10);
  
  if (isNaN(imageId)) {
    return null;
  }

  try {
    await initDatabase();
    return await getImageById(imageId);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const image = await getImage(id);

  if (!image) {
    return {
      title: 'Image Not Found - UpSiteDown',
    };
  }

  return {
    title: `${image.original_name} - UpSiteDown`,
    description: `View and download ${image.original_name} on UpSiteDown`,
    openGraph: {
      title: `${image.original_name} - UpSiteDown`,
      description: `View and download ${image.original_name} on UpSiteDown`,
      type: 'website',
      siteName: 'UpSiteDown',
      images: [
        {
          url: image.url,
          alt: image.original_name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${image.original_name} - UpSiteDown`,
      description: `View and download ${image.original_name} on UpSiteDown`,
      images: [image.url],
    },
  };
}

export default async function ImageDetailPage({ params }: PageProps) {
  const { id } = await params;
  const image = await getImage(id);

  if (!image) {
    notFound();
  }

  return <ImageDetailClient image={image} />;
}
