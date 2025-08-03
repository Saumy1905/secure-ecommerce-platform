const Cart = require("../models/Cart");
const Product = require("../models/Product");

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [],
        totalPrice: 0,
      });
    } else {
      const validItems = cart.items.filter(
        (item) => item.product && item.product._id
      );

      if (validItems.length !== cart.items.length || true) {
        console.log("Recalculating cart total price");
        cart.items = validItems;

        let total = 0;
        for (const item of validItems) {
          if (item.product && item.product.price) {
            total += item.product.price * item.quantity;
          }
        }
        cart.totalPrice = total;
        await cart.save();
      }
    }

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const validQuantity = parseInt(quantity) || 1;
    if (validQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!product.inStock) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock",
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, quantity: validQuantity }],
        totalPrice: product.price * validQuantity,
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += validQuantity;
      } else {
        cart.items.push({ product: productId, quantity: validQuantity });
      }

      cart = await cart.populate("items.product");
      let total = 0;
      for (const item of cart.items) {
        if (item.product && item.product.price) {
          total += item.product.price * item.quantity;
        }
      }
      cart.totalPrice = total;
      await cart.save();
    }

    cart = await Cart.findById(cart._id).populate("items.product");

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (err) {
    console.error("Add to cart error:", err);

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Server Error: " +
        (process.env.NODE_ENV === "development" ? err.message : ""),
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    const validQuantity = parseInt(quantity);
    if (!validQuantity || validQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    cart.items[itemIndex].quantity = validQuantity;

    await cart.save();

    try {
      await cart.updateCartTotal();
    } catch (error) {
      console.error("Error updating cart total:", error);

      const populatedCart = await Cart.findById(cart._id).populate(
        "items.product"
      );
      let total = 0;
      for (const item of populatedCart.items) {
        if (item.product && item.product.price) {
          total += item.product.price * item.quantity;
        }
      }
      cart.totalPrice = total;
      await cart.save();
    }

    cart = await Cart.findById(cart._id).populate("items.product");

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

    await cart.save();

    try {
      await cart.updateCartTotal();
    } catch (error) {
      console.error("Error updating cart total:", error);

      const populatedCart = await Cart.findById(cart._id).populate(
        "items.product"
      );
      let total = 0;
      for (const item of populatedCart.items) {
        if (item.product && item.product.price) {
          total += item.product.price * item.quantity;
        }
      }
      cart.totalPrice = total;
      await cart.save();
    }

    cart = await Cart.findById(cart._id).populate("items.product");

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = [];
    cart.totalPrice = 0;

    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
