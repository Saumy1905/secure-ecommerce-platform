const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity cannot be less than 1"],
    default: 1,
  },
});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [CartItemSchema],
  totalPrice: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

CartSchema.methods.updateCartTotal = async function () {
  try {
    const cart = await this.constructor
      .findById(this._id)
      .populate("items.product");

    // Calculate total price
    let total = 0;
    for (const item of cart.items) {
      if (item.product && item.product.price) {
        const itemPrice = item.product.price || 0;
        const itemQuantity = item.quantity || 0;
        total += itemPrice * itemQuantity;
      } else {
        console.warn("Missing product or price for cart item:", item);
      }
    }

    // Update the total price
    this.totalPrice = total;
    return this.save();
  } catch (error) {
    console.error("Error in updateCartTotal:", error);
    
    this.totalPrice = 0; 
    return this.save();
  }
};

CartSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Cart", CartSchema);
