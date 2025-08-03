document.addEventListener('DOMContentLoaded', function() {
    
    const token = localStorage.getItem('token');
    
    if (!token) {
        
        document.getElementById('loading-indicator').classList.add('d-none');
        document.getElementById('login-message').classList.remove('d-none');
    } else {
        loadCart();
    }
    
    async function loadCart() {
        try {
            const response = await fetch('/api/cart', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load cart');
            }
            
            const data = await response.json();
            const cart = data.data;
            
            console.log('Cart data received:', cart);
            
            document.getElementById('loading-indicator').classList.add('d-none');
            
            updateCartCount(cart.items.length);
            
            if (!cart.items || cart.items.length === 0) {
                document.getElementById('empty-cart-message').classList.remove('d-none');
                return;
            }
            const validItems = cart.items.filter(item => item.product && item.product._id);
            
            if (validItems.length === 0) {
                document.getElementById('empty-cart-message').classList.remove('d-none');
                return;
            }
            document.getElementById('cart-items').classList.remove('d-none');
            
            renderCartItems(cart);
            
            setupCartEventListeners();
            
        } catch (error) {
            console.error('Error loading cart:', error);
            document.getElementById('loading-indicator').classList.add('d-none');
            document.getElementById('cart-content').innerHTML = `
                <div class="alert alert-danger">
                    Failed to load cart. Please try again later.
                </div>
            `;
        }
    }
    function renderCartItems(cart) {
        const cartItemsBody = document.getElementById('cart-items-body');
        const cartTotal = document.getElementById('cart-total');
        
        let html = '';
        let totalPrice = 0;
        
        cart.items.forEach(item => {
            if (!item.product || !item.product._id) {
                console.warn('Found invalid product in cart item:', item);
                return;
            }
            
            const product = item.product;
            const price = product.price || 0;
            const subtotal = (price * item.quantity).toFixed(2);
            totalPrice += parseFloat(subtotal);
            
            html += `
                <tr data-item-id="${item._id}">
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${product.imageUrl || 'images/placeholder.jpg'}" alt="${escapeHTML(product.name)}" class="img-thumbnail me-3" style="width: 60px; height: 60px; object-fit: cover;"
                                onerror="this.onerror=null; this.src='images/placeholder.jpg';">
                            <div>
                                <h6 class="mb-0">${escapeHTML(product.name || 'Unknown Product')}</h6>
                                <small class="text-muted">${product.category || 'Uncategorized'}</small>
                            </div>
                        </div>
                    </td>
                    <td>$${price.toFixed(2)}</td>
                    <td>
                        <div class="input-group" style="max-width: 120px;">
                            <button class="btn btn-sm btn-outline-secondary decrease-qty" type="button">-</button>
                            <input type="number" class="form-control form-control-sm text-center item-quantity" value="${item.quantity}" min="1" max="10">
                            <button class="btn btn-sm btn-outline-secondary increase-qty" type="button">+</button>
                        </div>
                    </td>
                    <td>$${subtotal}</td>
                    <td>
                        <button class="btn btn-sm btn-danger remove-item">
                            <i class="bi bi-trash"></i> Remove
                        </button>
                    </td>
                </tr>
            `;
        });
        
        cartItemsBody.innerHTML = html;
        cartTotal.textContent = totalPrice.toFixed(2);
    }
    
    function setupCartEventListeners() {
        const clearCartBtn = document.getElementById('clear-cart');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', clearCart);
        }
        
        document.querySelectorAll('.decrease-qty').forEach(button => {
            button.addEventListener('click', function() {
                const row = this.closest('tr');
                const quantityInput = row.querySelector('.item-quantity');
                let quantity = parseInt(quantityInput.value);
                
                if (quantity > 1) {
                    quantity--;
                    quantityInput.value = quantity;
                    updateCartItemQuantity(row.getAttribute('data-item-id'), quantity);
                }
            });
        });
        document.querySelectorAll('.increase-qty').forEach(button => {
            button.addEventListener('click', function() {
                const row = this.closest('tr');
                const quantityInput = row.querySelector('.item-quantity');
                let quantity = parseInt(quantityInput.value);
                
                if (quantity < 10) {
                    quantity++;
                    quantityInput.value = quantity;
                    updateCartItemQuantity(row.getAttribute('data-item-id'), quantity);
                }
            });
        });
        document.querySelectorAll('.item-quantity').forEach(input => {
            input.addEventListener('change', function() {
                const row = this.closest('tr');
                let quantity = parseInt(this.value);
                
                if (isNaN(quantity) || quantity < 1) {
                    quantity = 1;
                    this.value = 1;
                } else if (quantity > 10) {
                    quantity = 10;
                    this.value = 10;
                }
                
                updateCartItemQuantity(row.getAttribute('data-item-id'), quantity);
            });
        });
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', function() {
                const row = this.closest('tr');
                removeCartItem(row.getAttribute('data-item-id'));
            });
        });
    }
    async function updateCartItemQuantity(itemId, quantity) {
        try {
            const response = await fetch(`/api/cart/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantity })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update item quantity');
            }
            
            const data = await response.json();
            
            renderCartItems(data.data);
            setupCartEventListeners();
            
        } catch (error) {
            console.error('Error updating quantity:', error);
            alert('Failed to update quantity. Please try again.');
        }
    }
    async function removeCartItem(itemId) {
        if (!confirm('Are you sure you want to remove this item from your cart?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/cart/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to remove item from cart');
            }
            
            const data = await response.json();
            
            updateCartCount(data.data.items.length);
            
            if (data.data.items.length === 0) {
                document.getElementById('cart-items').classList.add('d-none');
                document.getElementById('empty-cart-message').classList.remove('d-none');
            } else {
                renderCartItems(data.data);
                setupCartEventListeners();
            }
            
        } catch (error) {
            console.error('Error removing item:', error);
            alert('Failed to remove item. Please try again.');
        }
    }
    
    async function clearCart() {
        if (!confirm('Are you sure you want to clear your entire cart?')) {
            return;
        }
        
        try {
            const response = await fetch('/api/cart', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to clear cart');
            }
            
            updateCartCount(0);
            
            document.getElementById('cart-items').classList.add('d-none');
            document.getElementById('empty-cart-message').classList.remove('d-none');
            
        } catch (error) {
            console.error('Error clearing cart:', error);
            alert('Failed to clear cart. Please try again.');
        }
    }
    function updateCartCount(count) {
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = count;
        }
    }
    
    function escapeHTML(str) {
        if (!str) return '';
        
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});