import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { SupportTicket } from "../models/SupportTicket";

export const ticketRoutes = Router();

// Create a new support ticket (Company Admin/Owner)
ticketRoutes.post("/", authenticate, async (req: any, res: any) => {
    try {
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ success: false, message: "Title and description are required" });
        }

        const ticket = await SupportTicket.create({
            title,
            description,
            companyId: req.auth.company_id,
            createdBy: req.auth.user_id,
            status: 'Open',
            replies: []
        });

        res.status(201).json({ success: true, data: ticket });
    } catch (error: any) {
        console.error("Error creating support ticket:", error);
        res.status(500).json({ success: false, message: "Server error creating ticket" });
    }
});

// Get all tickets for the user's company
ticketRoutes.get("/", authenticate, async (req: any, res: any) => {
    try {
        const tickets = await SupportTicket.find({ companyId: req.auth.company_id })
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name email role');

        res.json({ success: true, data: tickets });
    } catch (error: any) {
        console.error("Error fetching support tickets:", error);
        res.status(500).json({ success: false, message: "Server error fetching tickets" });
    }
});

// Reply to a ticket
ticketRoutes.post("/:id/reply", authenticate, async (req: any, res: any) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }

        const ticket = await SupportTicket.findOne({ _id: req.params.id, companyId: req.auth.company_id });
        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        ticket.replies.push({
            senderModel: 'User',
            senderId: req.auth.user_id,
            message,
            createdAt: new Date()
        });

        await ticket.save();

        res.json({ success: true, data: ticket });
    } catch (error: any) {
        console.error("Error replying to ticket:", error);
        res.status(500).json({ success: false, message: "Server error replying to ticket" });
    }
});
