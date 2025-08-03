document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    
    loadFeaturedProducts();
    
    async function loadFeaturedProducts() {
        try {
            // Fetch 4 random products
            const response = await fetch('/api/products?limit=4');
            
            if (!response.ok) {
                throw new Error('Failed to load products');
            }
            
            const data = await response.json();
            
            renderFeaturedProducts(data.data);
            
        } catch (error) {
            console.error('Error loading featured products:', error);
            document.getElementById('featured-products').innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        Failed to load featured products. Please try again later.
                    </div>
                </div>
            `;
        }
    }
    function renderFeaturedProducts(products) {
        const featuredProductsContainer = document.getElementById('featured-products');
        
        if (!products || products.length === 0) {
            featuredProductsContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        No products available. Check back soon!
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        products.forEach(product => {
            html += `
                <div class="col-md-6 col-lg-3 mb-4">
                    <div class="card h-100">
                        <img src="${product.imageUrl}" class="card-img-top" alt="${product.name}" 
                            onerror="this.onerror=null; this.src='images/placeholder.jpg';" style="height: 200px; object-fit: cover;">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${escapeHTML(product.name)}</h5>
                            <p class="card-text text-truncate">${escapeHTML(product.description)}</p>
                            <div class="mt-auto">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="fw-bold">$${product.price.toFixed(2)}</span>
                                    <span class="badge ${product.inStock ? 'bg-success' : 'bg-danger'}">
                                        ${product.inStock ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                </div>
                                <a href="product-detail.html?id=${product._id}" class="btn btn-primary w-100">View Details</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        featuredProductsContainer.innerHTML = html;
    }
    function checkAuthStatus() {
        const token = localStorage.getItem('token');
        const authLinks = document.getElementById('auth-links');
        const ordersLink = document.getElementById('orders-link');
        
        if (token) {
            authLinks.innerHTML = `
                <a class="nav-link" href="dashboard.html">Dashboard</a>
                <a class="nav-link" href="#" id="logout-link">Logout</a>
            `;
            if (ordersLink) {
                ordersLink.style.display = 'block';
            }
            document.getElementById('logout-link').addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.removeItem('token');
                window.location.href = 'index.html';
            });
            loadCartCount(token);
        }
    }
    async function loadCartCount(token) {
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
            
            // Update cart count
            const cartCountElement = document.getElementById('cart-count');
            if (cartCountElement && data.data && data.data.items) {
                cartCountElement.textContent = data.data.items.length;
            }
            
        } catch (error) {
            console.error('Error loading cart count:', error);
        }
    }
    
    // Escape HTML to prevent XSS
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