import nodemailer from "nodemailer";
import { env } from "../config/env";

// const transporter = nodemailer.createTransport({
//   host: env.SMTP_HOST,
//   port: Number(env.SMTP_PORT),
//   secure: false,
//   auth: {
//     user: env.SMTP_USER,
//     pass: env.SMTP_PASS,
//   },
//   tls: {
//     rejectUnauthorized: false
//   }
// });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

export const sendInvitationEmail = async (
  email: string,
  inviteToken: string,
  companyName: string,
  workingHours?: string
) => {


  console.log("MAIL FUNCTION RUNNING");
  try {

    const inviteUrl = `${env.FRONTEND_URL}/signup?token=${inviteToken}`;

    console.log("Sending invitation email to:", email);

    const info = await transporter.sendMail({
      from: `"${companyName}" <${env.SMTP_USER}>`,
      to: email,
      subject: `Official Invitation to Join ${companyName}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Invitation</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
          <tr>
            <td align="center">
              
              <table width="600" cellpadding="0" cellspacing="0" 
                style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                
                <!-- Header -->
                <tr>
                  <td style="background:#4f46e5;padding:30px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:24px;">
                      ${companyName}
                    </h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    
                    <h2 style="margin-top:0;color:#111827;">
                      You're Invited to Join Our Team
                    </h2>

                    <p style="color:#4b5563;font-size:15px;line-height:1.6;">
                      We are pleased to inform you that you have been officially invited 
                      to join <strong>${companyName}</strong>. 
                      This invitation grants you access to our platform where you can 
                      collaborate, manage tasks, and be part of our growing organization.
                    </p>

                    <p style="color:#4b5563;font-size:15px;line-height:1.6;">
                      <strong>Your assigned working hours are: ${workingHours || "9:00 AM to 6:00 PM"}.</strong>
                    </p>

                    <p style="color:#4b5563;font-size:15px;line-height:1.6;">
                      To accept this invitation and activate your account, please click 
                      the button below:
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                      <a href="${inviteUrl}"
                        style="display:inline-block;padding:14px 28px;
                               background:#4f46e5;color:#ffffff;
                               text-decoration:none;font-weight:bold;
                               border-radius:6px;font-size:14px;">
                        Accept Invitation
                      </a>
                    </div>

                    <p style="color:#6b7280;font-size:13px;line-height:1.6;">
                      If the button above does not work, copy and paste the following link 
                      into your browser:
                    </p>

                    <p style="word-break:break-all;color:#4f46e5;font-size:13px;">
                      ${inviteUrl}
                    </p>

                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0;" />

                    <p style="color:#9ca3af;font-size:12px;line-height:1.6;">
                      This invitation link may expire for security reasons. 
                      If you did not expect this invitation, please ignore this email.
                    </p>

                    <p style="color:#9ca3af;font-size:12px;">
                      For assistance, please contact the administrator of ${companyName}.
                    </p>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;padding:20px;text-align:center;">
                    <p style="margin:0;color:#9ca3af;font-size:12px;">
                      © ${new Date().getFullYear()} ${companyName}. 
                      All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>

      </body>
      </html>
      `,
    });

    console.log("Invitation email sent:", info.messageId);

  } catch (error) {
    console.error("Email send error:", error);
    throw error;
  }

};


export const sendCompanyCreatedEmail = async (
  email: string,
  companyName: string,
  adminPassword?: string
) => {

  try {

    const loginUrl = `${env.FRONTEND_URL}/login`;

    console.log("Sending company creation email to:", email);

    const info = await transporter.sendMail({
      from: `"MULTICLOUT Support" <${env.SMTP_USER}>`,
      to: email,
      subject: `Welcome to MULTICLOUT - Your Company Account has been created`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Account Created</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                <tr>
                  <td style="background:#06b6d4;padding:30px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:24px;">Welcome, ${companyName}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin-top:0;color:#111827;">Your Admin Account is Ready</h2>

                    <p style="color:#4b5563;font-size:15px;line-height:1.6;">
                      Your company <strong>${companyName}</strong> has been successfully registered on our platform.
                    </p>

                    <p style="color:#4b5563;font-size:15px;line-height:1.6;">
                      You have been granted Administrator access. Here are your login details:
                    </p>

                    <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
                      <p style="margin:0 0 10px 0;color:#111827;"><strong>Email:</strong> ${email}</p>
                      <p style="margin:0;color:#111827;"><strong>Password:</strong> ${adminPassword}</p>
                    </div>

                    <div style="text-align:center;margin:30px 0;">
                      <a href="${loginUrl}" style="display:inline-block;padding:14px 28px;background:#06b6d4;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:6px;font-size:14px;">
                        Log in Now
                      </a>
                    </div>

                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `
    });

    console.log("Company email sent:", info.messageId);

  } catch (error) {
    console.error("Company email error:", error);
    throw error;
  }
};

export const sendAttendanceReportEmail = async (
  email: string,
  name: string,
  companyName: string,
  period: string,
  stats: { timeSpent: string; workingTime: string; idleTime: string }
) => {
  try {
    console.log("Sending attendance report email to:", email);

    const info = await transporter.sendMail({
      from: `"${companyName}" <${env.SMTP_USER}>`,
      to: email,
      subject: `Attendance Report - ${period}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Attendance Report</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                <tr>
                  <td style="background:#4f46e5;padding:30px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:24px;">Attendance Summary</h1>
                    <p style="color:#e0e7ff;margin:5px 0 0 0;font-size:14px;">${companyName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin-top:0;color:#111827;font-size:20px;">Hello ${name},</h2>
                    <p style="color:#4b5563;font-size:15px;line-height:1.6;">
                      Here is your attendance summary for the period: <strong>${period}</strong>.
                    </p>

                    <div style="margin:30px 0;background:#f9fafb;border-radius:8px;padding:20px;border:1px solid #e5e7eb;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;">Total Time Spent</td>
                          <td style="padding:10px 0;color:#111827;font-size:16px;font-weight:bold;text-align:right;border-bottom:1px solid #f3f4f6;">${stats.timeSpent}</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;">Working Time</td>
                          <td style="padding:10px 0;color:#059669;font-size:16px;font-weight:bold;text-align:right;border-bottom:1px solid #f3f4f6;">${stats.workingTime}</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0;color:#6b7280;font-size:14px;">Idle Time</td>
                          <td style="padding:10px 0;color:#d97706;font-size:16px;font-weight:bold;text-align:right;">${stats.idleTime}</td>
                        </tr>
                      </table>
                    </div>

                    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin-top:20px;">
                      This is an automated report generated by the team tracking system. 
                      If you have any questions, please contact your company administrator.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
                    <p style="margin:0;color:#9ca3af;font-size:12px;">
                      © ${new Date().getFullYear()} ${companyName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `
    });

    console.log("Attendance report email sent:", info.messageId);
  } catch (error) {
    console.error("Attendance report email error:", error);
    throw error;
  }
};
export const sendDeletionOTPEmail = async (
  email: string,
  otp: string,
  companyName: string,
  adminName: string
) => {
  try {
    console.log("Sending deletion OTP email to:", email);

    const info = await transporter.sendMail({
      from: `"${companyName}" <${env.SMTP_USER}>`,
      to: email,
      subject: `CRITICAL: Verification OTP for Member Deletion`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Deletion Verification</title>
      </head>
      <body style="margin:0;padding:0;background-color:#fef2f2;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(185,28,28,0.1);border:1px solid #fee2e2;">
                <tr>
                  <td style="background:#dc2626;padding:30px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:24px;">Security Verification</h1>
                    <p style="color:#fee2e2;margin:5px 0 0 0;font-size:14px;">User Deletion Request</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin-top:0;color:#111827;font-size:20px;">Hello ${adminName},</h2>
                    <p style="color:#4b5563;font-size:15px;line-height:1.6;">
                      A request has been made to delete members from your company <strong>${companyName}</strong>. 
                      For security reasons, this action requires a verification code.
                    </p>

                    <div style="margin:30px 0;background:#fef2f2;border-radius:12px;padding:30px;text-align:center;border:2px dashed #f87171;">
                      <p style="margin:0 0 10px 0;color:#dc2626;font-size:14px;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Your Deletion OTP</p>
                      <h1 style="margin:0;color:#111827;font-size:42px;letter-spacing:8px;font-family:monospace;">${otp}</h1>
                    </div>

                    <p style="color:#4b5563;font-size:14px;line-height:1.6;">
                      <strong>Warning:</strong> This code is valid for 10 minutes. If you did not initiate this deletion request, please secure your account immediately.
                    </p>

                    <div style="margin-top:30px;padding-top:20px;border-top:1px solid #f3f4f6;color:#6b7280;font-size:12px;line-height:1.6;">
                      <p>This is a critical security notification. Deleting users will permanently remove their access and data associated with the company tracking system.</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #f3f4f6;">
                    <p style="margin:0;color:#9ca3af;font-size:12px;">
                      © ${new Date().getFullYear()} ${companyName}.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `
    });

    console.log("Deletion OTP email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Deletion OTP email error:", error);
    throw error;
  }
};
