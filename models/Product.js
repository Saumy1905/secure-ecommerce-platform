const mongoose = require('mongoose');
const sanitizeHtml = require('sanitize-html');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price must be non-negative']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: [
      'Electronics',
      'Clothing',
      'Books',
      'Home & Kitchen',
      'Beauty',
      'Toys',
      'Other'
    ]
  },
  imageUrl: {
    type: String,
    default: 'no-image.jpg'
  },
  inStock: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// prevent XSS by sanitizing HTML in desc
ProductSchema.pre('save', function(next) {
  if (this.isModified('description')) {
    this.description = sanitizeHtml(this.description, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt']
      }
    });
  }
  next();
});

module.exports = mongoose.model('Product', ProductSchema);