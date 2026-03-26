import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { rateLimiter } from "../middleware/rateLimiter";

import { User } from "../models/User";
import { Company } from "../models/Company";
import { Invitation } from "../models/Invitation";
import { env } from "../config/env";
import { AppError } from "../utils/errors";
import { Session } from "../models/Session";
import { sendEmail } from "../utils/mailer";

export const authRoutes = Router();

/* ================= SCHEMAS ================= */

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  device_id: z.string().min(7),
  device_name: z.string().max(100).optional(),
  os: z.string().max(50).optional(),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});



function generateTokens(payload: any) {

  const accessToken = jwt.sign(
    { ...payload, type: "access" },
    env.JWT_PRIVATE_KEY as string,
    {
      algorithm: "HS256",
      expiresIn: (env.JWT_ACCESS_EXPIRY || "7d") as any
    }
  );

  const refreshToken = jwt.sign(
    { ...payload, type: "refresh" },
    env.JWT_PRIVATE_KEY as string,
    {
      algorithm: "HS256",
      expiresIn: (env.JWT_REFRESH_EXPIRY || "30d") as any
    }
  );

  return { accessToken, refreshToken };
}


/* ================= LOGIN ================= */

authRoutes.post(
  "/login",
  rateLimiter,
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, device_id, device_name, os } = req.body;

      const user = await User.findOne({
        email: email.toLowerCase(),
        status: "active",
      })
      .select("+password_hash")
      .populate("custom_role_id");

      if (!user) throw new AppError("Invalid credentials", 401);

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) throw new AppError("Invalid credentials", 401);

      /* DEVICE LOGIC */
      if (user.role !== "super_admin") {
        const existingDevice = user.devices.find(
          (d: any) => d.device_id === device_id
        );

        if (!existingDevice) {
          if (
            env.NODE_ENV === "production" &&
            user.devices.length >= 7
          ) {
            throw new AppError(
              "Login failed: Maximum allowed devices (7) reached for this user account. Please login from an existing device and remove an old device from your settings first.",
              403
            );
          }

          user.devices.push({
            device_id,
            device_name: device_name || "Unknown",
            os: os || "Unknown",
            bound_at: new Date(),
            last_seen: new Date(),
          });
        } else {
          existingDevice.last_seen = new Date();
        }
      }

      user.last_login = new Date();
      await user.save();

      // AUTO-START SESSION (IN TIME)
      if (user.company_id) {
        // Check if there's already an active or paused session
        const existingSession = await Session.findOne({
          user_id: user._id,
          company_id: user.company_id,
          status: { $in: ['active', 'paused'] }
        });

        if (!existingSession) {
          // Create new session to mark "In Time"
          await Session.create({
            user_id: user._id,
            company_id: user.company_id,
            device_id: device_id,
            start_time: new Date(),
            status: 'active',
            events: [
              { type: 'start', timestamp: new Date() }
            ],
            summary: {
              total_duration: 0,
              active_duration: 0,
              idle_duration: 0,
              pause_duration: 0,
              screenshots_count: 0,
              activity_score: 0
            }
          });
        }
      }

      const company = user.company_id
        ? await Company.findById(user.company_id).lean()
        : null;

      const payload = {
        user_id: user._id.toString(),
        company_id: user.company_id
          ? user.company_id.toString()
          : null,
        role: user.role,
        device_id,
      };

      const tokens = generateTokens(payload);

      res.json({
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company_id: user.company_id || null,
          companyName: company?.name || null,
          customPermissions: user.custom_role_id ? (user.custom_role_id as any).permissions : undefined,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);





authRoutes.post(
  "/refresh",
  validate(refreshSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refresh_token } = req.body;

      const decoded: any = jwt.verify(
        refresh_token,
        env.JWT_PRIVATE_KEY,
        { algorithms: ["HS256"] }
      );

      if (decoded.type !== "refresh") {
        throw new AppError("Invalid refresh token", 401);
      }

      // OPTIONAL: verify user still exists
      const user = await User.findById(decoded.user_id);
      if (!user || user.status !== "active") {
        throw new AppError("User no longer valid", 401);
      }

      const tokens = generateTokens({
        user_id: user._id.toString(),
        company_id: user.company_id
          ? user.company_id.toString()
          : null,
        role: user.role,
        device_id: decoded.device_id,
      });

      res.json({
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });

    } catch (err) {
      next(new AppError("Invalid or expired refresh token", 401));
    }
  }
);








/* ================= LOGOUT ================= */

authRoutes.post(
  "/logout",
  authenticate,
  async (_req: Request, res: Response) => {
    res.json({ success: true });
  }
);







authRoutes.get("/invite/:token", async (req, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token })
      .populate("company_id", "name");

    if (!invitation) {
      throw new AppError("Invalid invitation", 404);
    }

    // Expiry check
    if (
      invitation.status === "pending" &&
      invitation.expiresAt < new Date()
    ) {
      invitation.status = "expired";
      await invitation.save();
    }

    res.json({
      success: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        companyName: (invitation.company_id as any).name,
      },
    });

  } catch (err) {
    next(err);
  }
});




authRoutes.post(
  "/accept-invite",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, name, password, phone } = req.body;

      if (!name || name.trim().length < 2)
        throw new AppError("Name required", 400);

      if (!password || password.length < 6)
        throw new AppError("Password must be minimum 6 characters", 400);

      const invitation = await Invitation.findOne({
        token,
        status: "pending",
      });

      if (!invitation)
        throw new AppError("Invalid invitation", 404);

      if (invitation.expiresAt < new Date()) {
        invitation.status = "expired";
        await invitation.save();
        throw new AppError("Invitation expired", 410);
      }

      const existing = await User.findOne({
        email: invitation.email,
      });

      if (existing)
        throw new AppError("User already exists", 400);

      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        name: name.trim(),
        email: invitation.email,
        password_hash: hashedPassword,
        company_id: invitation.company_id,
        role: invitation.role,
        workingHours: invitation.workingHours || "9:00 AM to 6:00 PM",
        status: "active",
        phone: phone || "",
      });

      invitation.status = "accepted";
      await invitation.save();

      res.status(201).json({
        success: true,
        message: "Account activated successfully",
      });

    } catch (err) {
      next(err);
    }
  }
);

authRoutes.post("/forgot-password", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) throw new AppError("Email is required", 400);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: "If registered, check your email." });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    const resetUrl = `${env.FRONTEND_URL || 'http://multiclout.in'}/reset-password?token=${resetToken}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #135F80; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
        <p style="color: #666; font-size: 12px; margin-top: 40px;">This link will expire in 10 minutes.</p>
      </div>
    `;

    const emailSent = await sendEmail(
      email,
      "TeamTreck - Reset Your Password",
      emailHtml
    );

    if (!emailSent) {
      console.error(`Failed to send reset email to ${email}`);
    }

    console.log(`[DEV ONLY] Reset Password Link for ${email}: ${resetUrl}`);

    res.json({ success: true, message: "If registered, check your email." });
  } catch (err) {
    next(err);
  }
});

authRoutes.post("/reset-password", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) throw new AppError("Token and new password required", 400);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) throw new AppError("Invalid or expired token", 400);

    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
});
