import mongoose, { Schema, Document } from 'mongoose';

export interface IReply {
    senderModel: 'User' | 'SuperAdmin';
    senderId: mongoose.Types.ObjectId;
    message: string;
    createdAt: Date;
}

export interface ISupportTicket extends Document {
    title: string;
    description: string;
    companyId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    status: 'Open' | 'In Progress' | 'Resolved';
    replies: IReply[];
    createdAt: Date;
    updatedAt: Date;
}

const ReplySchema = new Schema<IReply>(
    {
        senderModel: { type: String, required: true, enum: ['User', 'SuperAdmin'] },
        senderId: { type: Schema.Types.ObjectId, required: true, refPath: 'replies.senderModel' },
        message: { type: String, required: true },
    },
    { _id: true, timestamps: true }
);

const SupportTicketSchema = new Schema<ISupportTicket>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: ['Open', 'In Progress', 'Resolved'],
            default: 'Open',
        },
        replies: [ReplySchema],
    },
    {
        timestamps: true,
    }
);

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
