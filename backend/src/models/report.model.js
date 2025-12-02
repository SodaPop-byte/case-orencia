import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
    reportType: { type: String, enum: ['SALES_SUMMARY', 'INVENTORY_FLOW', 'USER_ACTIVITY'], required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    dataSnapshot: { type: Object, required: true },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Report', ReportSchema);