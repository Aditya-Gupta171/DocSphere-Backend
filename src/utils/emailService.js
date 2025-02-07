import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const validateEmailConfig = () => {
  const { EMAIL_USER, EMAIL_PASSWORD } = process.env;
  
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    const missing = [];
    if (!EMAIL_USER) missing.push('EMAIL_USER');
    if (!EMAIL_PASSWORD) missing.push('EMAIL_PASSWORD');
    throw new Error(`Missing email configuration: ${missing.join(', ')}`);
  }
  
  return true;
};

const createTransporter = () => {
  validateEmailConfig();
  
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

export const sendInviteEmail = async (email, inviteLink, senderName) => {
  try {
    const transporter = createTransporter();
    
    const info = await transporter.sendMail({
      from: `"DocSphere" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'DocSphere Collaboration Invite',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>DocSphere Collaboration Invite</h2>
          <p>${senderName} has invited you to collaborate on a document.</p>
          <a href="${inviteLink}" style="display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Join Document
          </a>
        </div>
      `
    });

    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email error:', {
      message: error.message,
      code: error.code,
      command: error.command
    });
    throw error;
  }
};