import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useStore } from '../store';
import { uploadChunk, submitInterview } from '../api';

const CHUNK_DURATION_MS = 5000; // Treat each recording as a single chunk for simplicity

export function InterviewScreen() {
  const { token, candidateName, roleTitle, questions, setScreen } = useStore();
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const cameraRef = useRef<CameraView>(null);

  // --- Permission Gate ---
  if (!camPermission || !micPermission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF7A00" size="large" />
      </View>
    );
  }

  if (!camPermission.granted || !micPermission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera & microphone access is required.</Text>
        <TouchableOpacity
          style={styles.permButton}
          onPress={async () => {
            await requestCamPermission();
            await requestMicPermission();
          }}
        >
          <Text style={styles.permButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleToggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      cameraRef.current?.stopRecording();
    } else {
      setIsRecording(true);
      try {
        const video = await cameraRef.current?.recordAsync({ maxDuration: 180 });
        if (video?.uri) {
          await handleUpload(video.uri);
        }
      } catch (e: any) {
        console.error('Recording error:', e);
        setIsRecording(false);
        Alert.alert('Recording failed', e?.message || 'Please try again.');
      }
    }
  };

  const handleUpload = async (uri: string) => {
    setIsUploading(true);
    try {
      // Upload as a single chunk (chunk_index=0, total_chunks=1)
      setUploadProgress(`Uploading Q${currentQuestionIndex + 1} answer…`);
      await uploadChunk(token!, currentQuestionIndex, 0, 1, uri);

      if (!isLastQuestion) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setUploadProgress('');
      } else {
        // All questions answered — submit
        setUploadProgress('Submitting interview…');
        await submitInterview(token!);
        setScreen('done');
      }
    } catch (e: any) {
      console.error('Upload failed:', e);
      Alert.alert('Upload failed', e?.message || 'Please check your connection and try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  // --- Uploading overlay ---
  if (isUploading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF7A00" />
        <Text style={styles.uploadText}>{uploadProgress}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="front" ref={cameraRef} mode="video">
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.roleTag}>{roleTitle}</Text>
            <Text style={styles.progress}>
              {currentQuestionIndex + 1} / {questions.length}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` },
              ]}
            />
          </View>

          {/* Question Box */}
          <View style={styles.questionBox}>
            <Text style={styles.questionLabel}>
              QUESTION {currentQuestionIndex + 1}
            </Text>
            <Text style={styles.questionText}>
              {currentQuestion?.question_text ||
                currentQuestion?.question ||
                'Tell us about yourself and your experience.'}
            </Text>
          </View>

          {/* Record Controls */}
          <View style={styles.controls}>
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recDot} />
                <Text style={styles.recLabel}>REC</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordButtonActive]}
              onPress={handleToggleRecording}
              activeOpacity={0.8}
            >
              <View style={isRecording ? styles.stopIcon : styles.recordIcon} />
            </TouchableOpacity>
            <Text style={styles.controlHint}>
              {isRecording ? 'Tap to stop & upload' : 'Tap to start recording'}
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', padding: 24 },
  camera: { flex: 1, width: '100%' },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 48,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleTag: {
    color: '#FF7A00',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progress: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  progressBarTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    marginTop: 12,
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#FF7A00',
    borderRadius: 2,
  },
  questionBox: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 16,
  },
  questionLabel: {
    color: '#FF7A00',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  questionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  controls: { alignItems: 'center', gap: 12 },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  recLabel: { color: '#EF4444', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  recordButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: { borderColor: '#EF4444' },
  recordIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EF4444',
  },
  stopIcon: {
    width: 26,
    height: 26,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  controlHint: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' },
  permText: { color: '#fff', fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  permButton: { backgroundColor: '#FF7A00', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
  permButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  uploadText: { color: '#A1A1AA', marginTop: 20, fontSize: 14, textAlign: 'center' },
});
