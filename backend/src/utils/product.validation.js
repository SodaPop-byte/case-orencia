import { z } from 'zod';

export const ProductSchema = z.object({
    name: z.string().trim().min(3),
    SKU: z.string().trim().toUpperCase().min(1),
    
    // Convert string "100" to number 100
    basePrice: z.preprocess((val) => Number(val), z.number().positive()),
    
    discountPrice: z.preprocess((val) => Number(val), z.number().min(0)).optional(),
    
    description: z.string().min(10),
    
    inventoryType: z.enum(['saya', 'barong', 'fabrics']),
    
    // Ensure Category ID is valid MongoDB ID
    category: z.string().regex(/^[0-9a-fA-F]{24}$/),
    
    // Fix: Add stockQuantity support (convert string to number)
    stockQuantity: z.preprocess((val) => Number(val), z.number().int().min(0)).default(0),
    
    // Handle "true"/"false" strings from FormData
    isPublished: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
});