import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | null = null;

function getS3Client() {
  if (!client) {
    const endpoint = process.env.S3_ENDPOINT;
    client = new S3Client({
      region: process.env.S3_REGION ?? "auto",
      endpoint,
      forcePathStyle: !!endpoint,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

function getBucket() {
  return process.env.S3_BUCKET_NAME!;
}

export function isS3Configured() {
  return (
    process.env.STORAGE_DRIVER === "s3" &&
    !!process.env.S3_BUCKET_NAME &&
    !!process.env.S3_ACCESS_KEY_ID &&
    !!process.env.S3_SECRET_ACCESS_KEY
  );
}

export async function uploadS3(
  key: string,
  body: Buffer,
  contentType: string,
  access: "public" | "private",
): Promise<void> {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: access === "public" ? "public-read" : "private",
    }),
  );
}

export async function deleteS3(key: string): Promise<void> {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
  );
}

export async function getS3SignedUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn });
}

export function getS3PublicUrl(key: string): string | null {
  const base = process.env.S3_PUBLIC_URL;
  if (!base) {
    return null;
  }
  return `${base.replace(/\/$/, "")}/${key}`;
}
