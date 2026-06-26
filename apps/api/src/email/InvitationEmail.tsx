import React from 'react';
import { Html, Head, Preview, Body, Container, Section, Text, Button } from '@react-email/components';

export interface InvitationEmailProps {
  candidateName: string;
  roleTitle: string;
  companyName: string;
  interviewLink: string;
  timePerQuestion: number;
  expiryDate: string;
}

export const InvitationEmail: React.FC<InvitationEmailProps> = ({
  candidateName,
  roleTitle,
  companyName,
  interviewLink,
  timePerQuestion,
  expiryDate,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Invitation to interview for {roleTitle} at {companyName}</Preview>
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px', margin: '40px auto' }}>
          <Text style={{ fontSize: '20px', fontWeight: 'bold' }}>
            Hi {candidateName},
          </Text>
          <Text>
            Congratulations! We'd like to invite you to the next stage of the interview process for the <strong>{roleTitle}</strong> role at <strong>{companyName}</strong>.
          </Text>
          <Text>
            We are using Alfaleus to conduct an AI-guided technical assessment. You'll be asked a few questions tailored to your background.
            You will have approximately <strong>{timePerQuestion} minutes</strong> per question.
          </Text>
          <Section style={{ textAlign: 'center', margin: '30px 0' }}>
            <Button
              href={interviewLink}
              style={{
                backgroundColor: '#0070f3',
                color: '#fff',
                padding: '12px 20px',
                borderRadius: '5px',
                textDecoration: 'none',
                fontWeight: 'bold',
              }}
            >
              Start Interview
            </Button>
          </Section>
          <Text style={{ color: '#666', fontSize: '14px' }}>
            Please complete this assessment before <strong>{expiryDate}</strong>. If you have any issues, reply to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
