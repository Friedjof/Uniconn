import * as nodemailer from 'nodemailer';

export interface EmailVerificationData {
  to: string;
  verificationCode: string;
  firstName: string;
}

export interface EmailService {
  sendVerificationEmail(data: EmailVerificationData): Promise<boolean>;
}

// Mock email service for development
export class MockEmailService implements EmailService {
  async sendVerificationEmail(data: EmailVerificationData): Promise<boolean> {
    console.log(`Mock email sent to ${data.to}`);
    console.log(`Verification code: ${data.verificationCode}`);
    console.log(`Name: ${data.firstName}`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  }
}

// Real SMTP email service
export class SMTPEmailService implements EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const port = parseInt(process.env.SMTP_PORT || '587');
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(data: EmailVerificationData): Promise<boolean> {
    try {
      console.log('Attempting to send email to:', data.to);
      console.log('SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || 'UniConn <noreply@uniconn.com>',
        to: data.to,
        subject: '🔐 Verify your UniConn account',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your UniConn account</title>
          </head>
          <body style="margin: 0; padding: 20px; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 48px 40px; text-align: center; position: relative;">
                <div style="background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 20px; margin: 0 auto 24px auto; display: flex; align-items: center; justify-content: center;">
                  <div style="width: 40px; height: 40px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 24px;">🏠</span>
                  </div>
                </div>
                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Welcome to UniConn!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 18px; font-weight: 400;">Your dormitory communication platform</p>
              </div>
              
              <!-- Main Content -->
              <div style="padding: 48px 40px;">
                <div style="text-align: center; margin-bottom: 40px;">
                  <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Hi ${data.firstName}! 👋</h2>
                  <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
                    Thank you for joining UniConn! To complete your registration and start connecting with your dormitory community, please verify your email address.
                  </p>
                </div>
                
                <!-- Verification Code Card -->
                <div style="background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%); border: 2px solid #e0e7ff; border-radius: 16px; padding: 32px; margin: 40px 0; text-align: center;">
                  <div style="background: #667eea; width: 48px; height: 48px; border-radius: 12px; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 20px;">🔑</span>
                  </div>
                  <p style="color: #4338ca; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Your verification code is:</p>
                  <div style="background: white; border: 2px solid #c7d2fe; border-radius: 12px; padding: 20px; margin: 16px 0;">
                    <div style="font-size: 28px; font-weight: 900; color: #4338ca; letter-spacing: 4px; font-family: 'Courier New', monospace; word-break: break-all;">
                      ${data.verificationCode}
                    </div>
                  </div>
                  <p style="color: #6366f1; margin: 16px 0 0 0; font-size: 14px; font-weight: 500;">
                    ⏰ This code expires in 24 hours
                  </p>
                </div>
                
                <!-- Instructions -->
                <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0;">
                  <h3 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Next steps:</h3>
                  <ol style="color: #64748b; margin: 0; padding-left: 20px; line-height: 1.6;">
                    <li style="margin-bottom: 8px;">Enter the code above in the verification form</li>
                    <li style="margin-bottom: 8px;">Choose your dormitory room</li>
                    <li style="margin-bottom: 0;">Start connecting with your community!</li>
                  </ol>
                </div>
                
                <!-- Security Note -->
                <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 32px 0;">
                  <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                    <strong>🔒 Security notice:</strong> If you didn't create an account with UniConn, please ignore this email. Your account security is important to us.
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                <div style="margin-bottom: 16px;">
                  <div style="display: inline-block; background: #667eea; width: 32px; height: 32px; border-radius: 8px; margin: 0 8px;">
                    <span style="color: white; font-size: 16px; line-height: 32px;">🏠</span>
                  </div>
                  <span style="color: #374151; font-size: 16px; font-weight: 600;">UniConn</span>
                </div>
                <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.4;">
                  Connecting dormitory communities worldwide<br>
                  This is an automated message, please do not reply to this email.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
🏠 Welcome to UniConn!

Hi ${data.firstName}!

Thank you for joining UniConn! To complete your registration and start connecting with your dormitory community, please verify your email address.

Your verification code is: ${data.verificationCode}

This code will expire in 24 hours.

Next steps:
1. Enter the code above in the verification form
2. Choose your dormitory room  
3. Start connecting with your community!

If you didn't create an account with UniConn, please ignore this email.

UniConn - Connecting dormitory communities
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('SMTP email error:', error);
      return false;
    }
  }
}

// Initialize email service based on SMTP configuration
export const emailService = process.env.SMTP_USER && process.env.SMTP_PASS
  ? new SMTPEmailService()
  : new MockEmailService();