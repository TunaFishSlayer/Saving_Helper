import nodemailer from 'nodemailer';
import inlineBase64 from 'nodemailer-plugin-inline-base64';
import logger from '../utils/logger.js';

class EmailService {
  async sendPasswordResetEmail(email, resetCode) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      transporter.use("compile", inlineBase64({ cidPrefix: "somePrefix_" }));

      const mailOptions = {
        from: 'Savings Helper <' + process.env.EMAIL_USER + '>',
        to: email,
        subject: 'Password Reset Request - Savings Helper',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #4f46e5; margin: 0;">Savings Helper</h2>
              <p style="color: #2d3748; font-size: 18px; margin: 8px 0 0;">Password Reset Code</p>
            </div>
            <div style="background: #f7fafc; padding: 24px; border-radius: 8px; margin-bottom: 16px;">
              <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 12px;">Hello,</p>
              <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
                You requested a password reset for your account. Use the verification code below in the app to reset your password:
              </p>
              <div style="text-align: center; margin: 20px 0;">
                <div style="display: inline-block; background: white; border: 1px solid #e2e8f0; padding: 12px 20px; border-radius: 6px; font-size: 22px; letter-spacing: 4px; font-weight: 700; color: #1a202c;">
                  ${resetCode}
                </div>
              </div>
              <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0;">
                This code will expire in 10 minutes for security reasons.
              </p>
            </div>
            <p style="text-align: center; color: #718096; font-size: 13px; margin: 0;">
              If you didn't request this password reset, you can safely ignore this email.
            </p>
            <p style="text-align: center; color: #a0aec0; font-size: 12px; margin: 16px 0 0;">© 2024 Savings Helper. All rights reserved.</p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info(`Password reset email sent to ${email}: ${info.messageId}${previewUrl ? ` (preview: ${previewUrl})` : ''}`);
      return true;
    } catch (error) {
      console.error("Nodemailer Error Details:", error);
      logger.error(`Failed to send password reset email: ${error.message}`);
      throw new Error('Failed to send password reset email');
    }
  }
}

export default new EmailService();
