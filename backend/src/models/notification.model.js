// backend/src/models/notification.model.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipientRole: { 
        type: String, 
        required: true,
        enum: ['admin', 'reseller'] 
    },
    recipientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }, // Optional: if targeting a specific user
    type: { 
        type: String, 
        required: true, // e.g., 'NEW_ORDER', 'PAYMENT_PROOF'
    },
    title: { 
        type: String, 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    relatedId: { 
        type: mongoose.Schema.Types.ObjectId 
    }, // ID of the order or product related to this notification
    isRead: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;