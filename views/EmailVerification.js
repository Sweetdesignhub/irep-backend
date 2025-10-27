import { Html, Head, Body, Container, Section, Link } from '@react-email/components';
import * as React from 'react';

const EmailVerification = ({ verificationUrl }) => {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f4', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', backgroundColor: '#ffffff' }}>
          <Section style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#333' }}>Welcome to Our Platform!</h2>
            <p style={{ fontSize: '16px', color: '#333' }}>
              Please verify your email by clicking the button below.
            </p>
            <Link href={verificationUrl} style={{
              padding: '12px 25px',
              backgroundColor: '#007bff',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'inline-block',
              marginTop: '20px'
            }}>
              Verify Email
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default EmailVerification;
