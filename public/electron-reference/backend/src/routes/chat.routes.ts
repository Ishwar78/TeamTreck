import { Router } from "express";
import { Chat } from "../models/Chat";
import { User } from "../models/User";
import { authenticate } from "../middleware/auth";

const router = Router();

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
    const { receiver, message } = req.body;

    const senderId = req.auth.user_id;
    const companyId = req.auth.company_id;

    const receiverUser = await User.findById(receiver);

    if (!receiverUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ company check
    if (String(companyId) !== String(receiverUser.company_id)) {
      return res.status(403).json({ success: false });
    }

    // ✅ SAVE MESSAGE (FIXED)
    const chat = await Chat.create({
      sender: senderId,
      receiver,
      message,
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

export const chatRoutes = router;