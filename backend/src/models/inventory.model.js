import mongoose from 'mongoose';

const InventoryLogSchema = new mongoose.Schema({
    actionType: { type: String, enum: ['DEDUCTION', 'RESTORATION', 'MANUAL_IN', 'MANUAL_OUT'], required: true },
    quantityChange: { type: Number, required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String }
}, { _id: false, timestamps: true });

const InventorySchema = new mongoose.Schema({
    itemName: { type: String, required: true, unique: true, enum: ['saya', 'barong', 'fabrics'] },
    stockLevel: { type: Number, required: true, default: 0, min: 0 },
    log: { type: [InventoryLogSchema], default: [] }
}, { timestamps: true });

export default mongoose.model('Inventory', InventorySchema);