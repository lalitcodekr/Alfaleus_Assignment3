import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download TalentIQ — AI Interview App',
  description: 'Interview from anywhere with the TalentIQ Android app.',
};

export default function InstallPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-base)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 16 }}>
        🎯 TalentIQ Interviews
      </h1>
      <p style={{ fontSize: 16, color: 'var(--color-text-secondary)', maxWidth: 480, marginBottom: 32, lineHeight: 1.7 }}>
        You received an interview invitation! To complete your interview, download the TalentIQ app on your Android device.
      </p>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', maxWidth: 400, marginBottom: 32, lineHeight: 1.7 }}>
        The app allows you to record your answers and submit your interview securely. Your answers are stored safely and reviewed by our AI system.
      </p>
      <a
        id="apk-download-link"
        href="https://github.com/lalitcodekr/Alfaleus_Assignment3/releases/latest/download/talentiq.apk"
        className="btn btn-primary"
        style={{ fontSize: 16, padding: '14px 32px', textDecoration: 'none' }}
      >
        ⬇ Download TalentIQ App (APK)
      </a>
      <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 16 }}>
        Requires Android 8.0 or higher
      </p>
    </div>
  );
}
