// product.model.js (ESM) - FIXED VALIDATION
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        text: true 
    },
    SKU: {
        type: String,
        required: true,
        unique: true, 
        uppercase: true,
        trim: true
    },
    basePrice: {
        type: Number,
        required: true,
        min: [0.01, 'Base price must be positive.']
    },
    discountPrice: {
        type: Number,
        default: 0,
        min: [0, 'Discount price cannot be negative.']
        // REMOVED: The custom validator that causes crashes during updates
    },
    description: {
        type: String,
        required: true
    },
    images: {
        type: [String], 
        required: true,
        validate: [v => v && v.length > 0, 'A product must have at least one image.']
    },
    inventoryType: {
        type: String,
        required: true,
        enum: ['saya', 'barong', 'fabrics']
    },
    stockQuantity: {
        type: Number,
        default: 0,
        min: [0, 'Stock quantity cannot be negative.']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    isPublished: {
        type: Boolean,
        default: false 
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes
ProductSchema.index({ inventoryType: 1, category: 1 });
ProductSchema.index({ SKU: 1, name: 'text' }); 

// Soft Delete Middleware
ProductSchema.pre(['find', 'findOne', 'findById', 'countDocuments'], function() {
    if (!this.getQuery().hasOwnProperty('deletedAt')) {
        this.where({ deletedAt: null });
    }
});

const Product = mongoose.model('Product', ProductSchema);
export default Product;