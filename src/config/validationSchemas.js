import Joi from 'joi';

// User registration validation schema
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'string.min': 'Password must be at least 8 characters long',
    }),
  name: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('farmer', 'buyer', 'admin').required(),
});

// Login validation schema
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Product validation schema
export const productSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  price: Joi.number().positive().required(),
  quantity: Joi.number().integer().min(0).required(),
  category: Joi.string().required(),
  images: Joi.array().items(Joi.string().uri()).min(1).required(),
  farmerId: Joi.string().required(),
});

// Order validation schema
export const orderSchema = Joi.object({
  products: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      price: Joi.number().positive().required(),
    })
  ).min(1).required(),
  buyerId: Joi.string().required(),
  shippingAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().required(),
  }).required(),
  paymentMethod: Joi.string().valid('mpesa', 'card').required(),
});

// Support ticket validation schema
export const ticketSchema = Joi.object({
  subject: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(20).max(1000).required(),
  priority: Joi.string().valid('low', 'medium', 'high').required(),
  userId: Joi.string().required(),
});

// Message validation schema
export const messageSchema = Joi.object({
  text: Joi.string().min(1).max(1000).required(),
  userId: Joi.string().required(),
});

// Payment validation schema
export const paymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().valid('KES').required(),
  phoneNumber: Joi.string().pattern(/^254[0-9]{9}$/).required().messages({
    'string.pattern.base': 'Phone number must be in the format 254XXXXXXXXX',
  }),
  orderId: Joi.string().required(),
});