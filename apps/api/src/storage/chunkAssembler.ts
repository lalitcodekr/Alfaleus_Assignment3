import { r2Client, R2_BUCKET, uploadToR2 } from './r2Client';
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { db } from '../db/client';
import { answers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { enqueue } from '../queue/boss';

export async function assembleChunks(token: string, questionIndex: number, totalChunks: number, answerId: string, interviewId: string) {
    try {
        console.log(`Assembling ${totalChunks} chunks for interview ${token} Q${questionIndex}`);
        
        if (!process.env.R2_ACCOUNT_ID) {
            console.warn('R2 not configured. Mocking assembly.');
        } else {
            const buffers: Buffer[] = [];
            
            for (let i = 0; i < totalChunks; i++) {
                const chunkKey = `interviews/${token}/q${questionIndex}/chunk_${i}`;
                const getCmd = new GetObjectCommand({
                    Bucket: R2_BUCKET,
                    Key: chunkKey,
                });
                const response = await r2Client.send(getCmd);
                const byteArray = await response.Body?.transformToByteArray();
                if (byteArray) {
                    buffers.push(Buffer.from(byteArray));
                } else {
                    throw new Error(`Missing chunk ${i}`);
                }
            }
            
            const finalVideoBuffer = Buffer.concat(buffers);
            const finalKey = `interviews/${token}/q${questionIndex}/video.webm`;
            
            await uploadToR2(finalKey, finalVideoBuffer, 'video/webm');
            
            // Clean up chunks
            for (let i = 0; i < totalChunks; i++) {
                const chunkKey = `interviews/${token}/q${questionIndex}/chunk_${i}`;
                await r2Client.send(new DeleteObjectCommand({
                    Bucket: R2_BUCKET,
                    Key: chunkKey,
                }));
            }
        }
        
        const finalKey = `interviews/${token}/q${questionIndex}/video.webm`;
        
        // Update DB
        await db.update(answers)
            .set({ videoAssembled: true })
            .where(eq(answers.id, answerId));
            
        // Enqueue transcribe job for Transcription worker
        await enqueue('transcribe-answer', {
            answer_id: answerId,
            r2_key: finalKey,
            question_index: questionIndex,
            interview_id: interviewId
        });
        
        console.log(`Successfully assembled video for Q${questionIndex} and queued for transcription`);
        return true;
    } catch (err) {
        console.error('Failed to assemble chunks', err);
        return false;
    }
}
