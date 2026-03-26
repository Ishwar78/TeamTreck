import { Router } from "express";
import { Chat } from "../models/Chat";
import { User } from "../models/User";
import { Group } from "../models/Group";
import { authenticate } from "../middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/chat';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/* ================= UPLOAD FILE ================= */
router.post("/upload", authenticate, upload.single("file"), (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const fileUrl = `/api/uploads/chat/${req.file.filename}`;
    res.json({ success: true, fileUrl, fileType: req.file.mimetype });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ================= GET PEERS (Group Members) ================= */
router.get("/peers", authenticate, async (req: any, res) => {
  try {
    const myId = req.auth.user_id;
    const myCompany = req.auth.company_id;

    if (req.auth.role === "company_admin" || req.auth.role === "sub_admin") {
      const users = await User.find({ company_id: myCompany, role: { $in: ["employee", "intern"] } }, "_id name email role").lean();
      return res.json({ success: true, users });
    }

    // Find all groups where I am a member
    const myGroups = await Group.find({ users: myId, company_id: myCompany });
    const memberIds = new Set<string>();
    myGroups.forEach((g: any) => g.users.forEach((uid: any) => memberIds.add(String(uid))));
    memberIds.delete(String(myId)); // Remove self

    const users = await User.find({ _id: { $in: Array.from(memberIds) } }, "_id name email role").lean();
    
    // Also include Admin
    let admin = await User.findOne({ company_id: myCompany, role: "company_admin" }, "_id name email role").lean();
    if (admin) users.push(admin as any);

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ================= GET ADMIN FOR EMPLOYEE CHAT ================= */
router.get("/admin", authenticate, async (req: any, res) => {
  try {
    let admin = await User.findOne({ company_id: req.auth.company_id, role: "company_admin" }, "_id name email role").lean();
    if (!admin) {
      admin = await User.findOne({ company_id: req.auth.company_id, role: "sub_admin" }, "_id name email role").lean();
    }
    if (!admin) {
      admin = await User.findOne({ role: "super_admin" }, "_id name email role").lean();
    }
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
    
    res.json({ success: true, admin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ================= SEND MESSAGE ================= */
router.post("/send", authenticate, async (req: any, res) => {
  try {
    const { receiver, groupId, message, fileUrl, fileType } = req.body;

    const senderId = req.auth.user_id;
    const companyId = req.auth.company_id;

    // ✅ GROUP CHECK
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group || String(group.company_id) !== String(companyId)) {
        return res.status(403).json({ success: false, message: "Invalid group" });
      }

      const chat = await Chat.create({
        sender: senderId,
        group_id: groupId,
        message,
        fileUrl,
        fileType,
        company_id: companyId,
      });

      return res.json({ success: true, chat });
    }

    const receiverUser = await User.findById(receiver);

    if (!receiverUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ company check
    if (String(companyId) !== String(receiverUser.company_id)) {
      return res.status(403).json({ success: false });
    }

    // ✅ SAVE MESSAGE
    const chat = await Chat.create({
      sender: senderId,
      receiver,
      message,
      fileUrl,
      fileType,
      company_id: companyId,
    });

    res.json({ success: true, chat });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ================= GET MESSAGES ================= */
router.get("/:userId", authenticate, async (req: any, res) => {
  try {
    const myId = req.auth.user_id;
    const myCompany = req.auth.company_id;
    const userId = req.params.userId;

    const otherUser = await User.findById(userId);

    if (!otherUser) {
      return res.status(404).json({ success: false });
    }

    if (String(myCompany) !== String(otherUser.company_id)) {
      return res.status(403).json({ success: false });
    }

    const messages = await Chat.find({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId }
      ]
    }).sort({ createdAt: 1 });

    res.json({ success: true, messages });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ================= GET GROUP MESSAGES ================= */
router.get("/group/:groupId", authenticate, async (req: any, res) => {
  try {
    const groupId = req.params.groupId;
    const companyId = req.auth.company_id;

    const group = await Group.findById(groupId);

    if (!group || String(companyId) !== String(group.company_id)) {
      return res.status(403).json({ success: false });
    }

    if (req.auth.role === "employee" || req.auth.role === "user" || req.auth.role === "intern") {
      if (!group.users.includes(req.auth.user_id)) {
        return res.status(403).json({ success: false });
      }
    }

    const messages = await Chat.find({ group_id: groupId })
      .populate("sender", "name")
      .sort({ createdAt: 1 });

    res.json({ success: true, messages });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

export const chatRoutes = router;