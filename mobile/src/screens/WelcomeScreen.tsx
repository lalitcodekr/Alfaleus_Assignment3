import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useStore } from '../store';
import { fetchInterviewByToken } from '../api';

export function WelcomeScreen() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setInterviewData } = useStore();

  const handleStart = async () => {
    const trimmed = token.trim();
    if (!trimmed) {
      setError('Please enter your interview access token.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // GET /api/interviews/:token → { questions, candidate_name, role_title, time_limits }
      const data = await fetchInterviewByToken(trimmed);

      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions found for this interview. Please contact your recruiter.');
      }

      setInterviewData(
        trimmed,
        data.candidate_name || 'Candidate',
        data.role_title || 'Role',
        data.questions
      );
    } catch (err: any) {
      const msg = err.message || '';
      if (msg === 'invalid_token') {
        setError('Invalid token. Please check your interview invitation email.');
      } else if (msg === 'token_expired') {
        setError('This interview link has expired. Please contact your recruiter.');
      } else if (msg === 'already_submitted') {
        setError('You have already submitted this interview.');
      } else {
        setError(msg || 'Failed to load interview. Please check your token and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>TalentIQ</Text>
      <Text style={styles.subtitle}>AI-Powered Interview Platform</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Enter your Interview Token</Text>
        <Text style={styles.hint}>
          You received this token in your invitation email.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Paste your token here…"
          placeholderTextColor="#52525B"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
          multiline={false}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleStart}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Start Interview →</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Powered by Alfaleus · Confidential</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  brand: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#71717A',
    marginBottom: 48,
    letterSpacing: 0.5,
  },
  card: {
    width: '100%',
    backgroundColor: '#111111',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  label: {
    color: '#E4E4E7',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  hint: {
    color: '#52525B',
    fontSize: 12,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: '#3F3F46',
    borderRadius: 10,
    color: '#fff',
    padding: 16,
    fontSize: 15,
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#FF7A00',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: '#F87171',
    marginBottom: 16,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    marginTop: 32,
    color: '#3F3F46',
    fontSize: 11,
  },
});
