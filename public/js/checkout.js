document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");

  if (!token) {
    document.getElementById("loading-indicator").classList.add("d-none");
    document.getElementById("login-message").classList.remove("d-none");
    return;
  }

  loadCart();

  getCsrfToken();

  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", handleCheckout);
  }

  async function loadCart() {
    try {
      const response = await fetch("/api/cart", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load cart");
      }

      const data = await response.json();
      const cart = data.data;

      document.getElementById("loading-indicator").classList.add("d-none");

      updateCartCount(cart.items.length);

      if (!cart.items || cart.items.length === 0) {
        document
          .getElementById("empty-cart-message")
          .classList.remove("d-none");
        return;
      }

      document
        .getElementById("checkout-form-container")
        .classList.remove("d-none");

      renderCartSummary(cart);

      prefillUserData();
    } catch (error) {
      console.error("Error loading cart:", error);
      document.getElementById("loading-indicator").classList.add("d-none");
      document.getElementById("checkout-content").innerHTML = `
                <div class="alert alert-danger">
                    Failed to load cart. Please try again later.
                </div>
            `;
    }
  }

  function renderCartSummary(cart) {
    const cartSummary = document.getElementById("cart-summary");

    let subtotal = 0;
    let html = `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
    `;

    cart.items.forEach((item) => {
      const product = item.product;

      if (!product || !product._id) {
        console.warn("Found invalid product in cart:", item);
        return;
      }

      const price = product.price || 0;
      const itemQuantity = item.quantity || 0;
      const itemSubtotal = price * itemQuantity;
      subtotal += itemSubtotal;

      html += `
            <tr>
                <td>${escapeHTML(product.name || "Unknown Product")}</td>
                <td>${itemQuantity}</td>
                <td>$${itemSubtotal.toFixed(2)}</td>
            </tr>
        `;
    });

    if (Math.abs(subtotal - cart.totalPrice) > 0.01) {
      console.warn("Calculated subtotal differs from cart.totalPrice", {
        calculated: subtotal,
        fromCart: cart.totalPrice,
      });
    }

    const shipping = 0; 
    const tax = 0; 
    const total = subtotal + shipping + tax;

    html += `
                </tbody>
            </table>
        </div>
        
        <hr>
        
        <div class="d-flex justify-content-between mb-2">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
        </div>
        
        <div class="d-flex justify-content-between mb-2">
            <span>Shipping:</span>
            <span>$${shipping.toFixed(2)}</span>
        </div>
        
        <div class="d-flex justify-content-between mb-2">
            <span>Tax:</span>
            <span>$${tax.toFixed(2)}</span>
        </div>
        
        <hr>
        
        <div class="d-flex justify-content-between mb-2">
            <strong>Total:</strong>
            <strong>$${total.toFixed(2)}</strong>
        </div>
    `;

    cartSummary.innerHTML = html;
  }

  async function prefillUserData() {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load user data");
      }

      const data = await response.json();
      const user = data.data;

      document.getElementById("name").value = user.name;
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }
  async function getCsrfToken() {
    try {
      const response = await fetch("/api/csrf-token");

      if (!response.ok) {
        throw new Error("Failed to get CSRF token");
      }

      const data = await response.json();

      document.getElementById("csrf-token").value = data.csrfToken;
    } catch (error) {
      console.error("Error getting CSRF token:", error);
    }
  }

  async function handleCheckout(e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const address = document.getElementById("address").value;
    const city = document.getElementById("city").value;
    const state = document.getElementById("state").value;
    const postalCode = document.getElementById("postalCode").value;
    const country = document.getElementById("country").value;
    const paymentMethod = document.querySelector(
      'input[name="paymentMethod"]:checked'
    ).value;

    const orderData = {
      shippingAddress: {
        name,
        address,
        city,
        state,
        postalCode,
        country,
        phone,
      },
      paymentMethod,
    };

    try {
      const submitButton = document.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.innerHTML = "Processing...";

      // Create order
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "CSRF-Token": document.getElementById("csrf-token").value,
        },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        throw new Error("Failed to create order");
      }

      const orderResult = await orderResponse.json();
      const order = orderResult.data;

      // If COD, redirect to success page
      if (paymentMethod === "cod") {
        // Set order ID in session storage for order success page
        sessionStorage.setItem(
          "orderSuccess",
          JSON.stringify({
            orderId: order._id,
            orderNumber: order._id
              .substring(order._id.length - 8)
              .toUpperCase(),
          })
        );

        window.location.href = "order-success.html";
        return;
      }

      // process mock payment for UPI
      const paymentResponse = await fetch("/api/payment/mock-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "CSRF-Token": document.getElementById("csrf-token").value,
        },
        body: JSON.stringify({
          orderId: order._id,
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error("Failed to process payment");
      }

      // Set order ID in session storage for order success page
      sessionStorage.setItem(
        "orderSuccess",
        JSON.stringify({
          orderId: order._id,
          orderNumber: order._id.substring(order._id.length - 8).toUpperCase(),
        })
      );

      // Redirect to order success page
      window.location.href = "order-success.html";
    } catch (error) {
      console.error("Checkout error:", error);

      // Reset submit button
      const submitButton = document.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.innerHTML = "Place Order";
      alert("Failed to process your order. Please try again.");
    }
  }

  function updateCartCount(count) {
    const cartCountElement = document.getElementById("cart-count");
    if (cartCountElement) {
      cartCountElement.textContent = count;
    }
  }

  function escapeHTML(str) {
    if (!str) return "";

    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
