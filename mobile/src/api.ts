import * as FileSystem from 'expo-file-system';

// Use EXPO_PUBLIC_API_URL for production (Railway), falls back to Android emulator localhost
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3001';

/**
 * Fetch interview details by token.
 * Returns: { questions, candidate_name, role_title, time_limits }
 */
export async function fetchInterviewByToken(token: string) {
  const res = await fetch(`${API_URL}/api/interviews/${token}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Upload a single video chunk for a given question.
 * Uses multipart/form-data to send the binary chunk alongside metadata.
 */
export async function uploadChunk(
  token: string,
  questionIndex: number,
  chunkIndex: number,
  totalChunks: number,
  chunkUri: string
) {
  const uploadResult = await FileSystem.uploadAsync(
    `${API_URL}/api/interviews/${token}/chunk`,
    chunkUri,
    {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'chunk',
      parameters: {
        question_index: questionIndex.toString(),
        chunk_index: chunkIndex.toString(),
        total_chunks: totalChunks.toString(),
      },
    }
  );

  if (uploadResult.status !== 200) {
    throw new Error(`Chunk upload failed with status ${uploadResult.status}`);
  }
  return JSON.parse(uploadResult.body);
}

/**
 * Submit the completed interview (marks status = completed in DB).
 */
export async function submitInterview(token: string) {
  const res = await fetch(`${API_URL}/api/interviews/${token}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Submit failed with status ${res.status}`);
  return res.json();
}
