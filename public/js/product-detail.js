document.addEventListener('DOMContentLoaded', function() {
    
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        window.location.href = 'products.html';
        return;
    }
    loadProductDetails(productId);
    
    async function loadProductDetails(id) {
        try {
            const response = await fetch(`/api/products/${id}`);
            
            if (!response.ok) {
                throw new Error('Failed to load product details');
            }
            
            const data = await response.json();
            const product = data.data;
            
            document.title = `${product.name} - Secure E-commerce`;
            document.getElementById('product-breadcrumb').textContent = product.name;
            
            renderProductDetails(product);
            
        } catch (error) {
            console.error('Error loading product details:', error);
            document.getElementById('product-detail').innerHTML = `
                <div class="alert alert-danger">
                    Failed to load product details. Please try again later.
                </div>
            `;
        }
    }
    
    function renderProductDetails(product) {
        const productDetailContainer = document.getElementById('product-detail');
        
        const html = `
            <div class="row">
                <div class="col-md-5 mb-4">
                    <img src="${product.imageUrl}" class="img-fluid rounded" alt="${product.name}"
                        onerror="this.onerror=null; this.src='images/placeholder.jpg';">
                </div>
                <div class="col-md-7">
                    <h2>${escapeHTML(product.name)}</h2>
                    <p class="text-muted">Category: ${product.category}</p>
                    
                    <div class="mb-3">
                        <span class="badge ${product.inStock ? 'bg-success' : 'bg-danger'} me-2">
                            ${product.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                    </div>
                    
                    <h3 class="mb-3">$${product.price.toFixed(2)}</h3>
                    
                    <div class="mb-4">
                        <label for="quantity" class="form-label">Quantity</label>
                        <div class="input-group mb-3" style="max-width: 150px;">
                            <button class="btn btn-outline-secondary" type="button" id="decrease-quantity">-</button>
                            <input type="number" class="form-control text-center" id="quantity" value="1" min="1" max="10">
                            <button class="btn btn-outline-secondary" type="button" id="increase-quantity">+</button>
                        </div>
                    </div>
                    
                    <div class="d-grid gap-2 d-md-block mb-4">
                        <button id="add-to-cart-btn" class="btn btn-primary btn-lg px-4 me-md-2" ${!product.inStock ? 'disabled' : ''}>
                            Add to Cart
                        </button>
                    </div>
                    
                    <div class="mt-4">
                        <h4>Product Description</h4>
                        <p>${escapeHTML(product.description)}</p>
                    </div>
                    
                    <div class="mt-4">
                        <h4>Secure Purchase</h4>
                        <p>
                            <i class="bi bi-shield-check"></i> Your transaction is secure
                            <br>
                            <i class="bi bi-lock"></i> SSL encrypted checkout
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        productDetailContainer.innerHTML = html;
        const quantityInput = document.getElementById('quantity');
        const decreaseBtn = document.getElementById('decrease-quantity');
        const increaseBtn = document.getElementById('increase-quantity');
        
        if (decreaseBtn && increaseBtn && quantityInput) {
            decreaseBtn.addEventListener('click', function() {
                let quantity = parseInt(quantityInput.value);
                if (quantity > 1) {
                    quantityInput.value = quantity - 1;
                }
            });
            
            increaseBtn.addEventListener('click', function() {
                let quantity = parseInt(quantityInput.value);
                if (quantity < 10) {
                    quantityInput.value = quantity + 1;
                }
            });
            
            quantityInput.addEventListener('change', function() {
                let quantity = parseInt(this.value);
                if (isNaN(quantity) || quantity < 1) {
                    this.value = 1;
                } else if (quantity > 10) {
                    this.value = 10;
                }
            });
        }
        
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', function() {
                addToCart(product._id);
            });
        }
    }
    
    async function addToCart(productId) {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login to add items to your cart');
            window.location.href = 'login.html';
            return;
        }
        
        const quantityInput = document.getElementById('quantity');
        const quantity = parseInt(quantityInput.value);
        
        if (isNaN(quantity) || quantity < 1) {
            alert('Please enter a valid quantity');
            return;
        }
        
        try {
            const addToCartBtn = document.getElementById('add-to-cart-btn');
            
            addToCartBtn.disabled = true;
            addToCartBtn.innerHTML = 'Adding...';
            
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId,
                    quantity
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to add item to cart');
            }
            
            const data = await response.json();
            
            updateCartCount(data.data.items.length);
            
            alert('Item added to cart');
            
            addToCartBtn.innerHTML = 'Add to Cart';
            addToCartBtn.disabled = false;
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add item to cart. Please try again.');
            
            const addToCartBtn = document.getElementById('add-to-cart-btn');
            addToCartBtn.innerHTML = 'Add to Cart';
            addToCartBtn.disabled = false;
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