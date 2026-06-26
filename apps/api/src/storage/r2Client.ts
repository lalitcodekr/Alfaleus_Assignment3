import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// R2 requires endpoint in this format: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
export const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME || 'alfaleus-interviews';

export async function uploadToR2(key: string, body: Buffer | Uint8Array, contentType: string) {
    if (!process.env.R2_ACCOUNT_ID) {
        console.warn('R2 not configured. Mocking upload for key:', key);
        return;
    }
    const cmd = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
    });
    return r2Client.send(cmd);
}
