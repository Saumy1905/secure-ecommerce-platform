document.addEventListener('DOMContentLoaded', function() {
    let currentPage = 1;
    let productsData = {};
    
    const filterForm = document.getElementById('filter-form');
    const categoryFilter = document.getElementById('category-filter');
    const minPriceFilter = document.getElementById('min-price');
    const maxPriceFilter = document.getElementById('max-price');
    const inStockFilter = document.getElementById('in-stock');
    
    loadProducts();
    
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            currentPage = 1; 
            loadProducts();
        });
    }
    
    // Load products function with filters
    async function loadProducts() {
        try {
            const productsContainer = document.getElementById('products-container');
            productsContainer.innerHTML = `
                <div class="text-center w-100 py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
            let queryParams = new URLSearchParams();
            queryParams.append('page', currentPage);
            queryParams.append('limit', 8); // 8 products per page
            
            if (categoryFilter && categoryFilter.value) {
                queryParams.append('category', categoryFilter.value);
            }
            
            if (minPriceFilter && minPriceFilter.value) {
                queryParams.append('minPrice', minPriceFilter.value);
            }
            
            if (maxPriceFilter && maxPriceFilter.value) {
                queryParams.append('maxPrice', maxPriceFilter.value);
            }
            if (inStockFilter && inStockFilter.checked) {
                queryParams.append('inStock', true);
            }
            
            const response = await fetch(`/api/products?${queryParams.toString()}`);
            
            if (!response.ok) {
                throw new Error('Failed to load products');
            }
            
            productsData = await response.json();
            
            // Render products
            renderProducts(productsData.data);
            
            // Render pagination
            renderPagination(productsData.pagination);
            
        } catch (error) {
            console.error('Error loading products:', error);
            document.getElementById('products-container').innerHTML = `
                <div class="alert alert-danger w-100">
                    Failed to load products. Please try again later.
                </div>
            `;
        }
    }
    
    // Render products function
    function renderProducts(products) {
        const productsContainer = document.getElementById('products-container');
        
        if (!products || products.length === 0) {
            productsContainer.innerHTML = `
                <div class="alert alert-info w-100">
                    No products found matching your criteria. Try different filters.
                </div>
            `;
            return;
        }
        
        let html = '';
        
        products.forEach(product => {
            html += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100">
                        <img src="${product.imageUrl}" class="card-img-top" alt="${product.name}" 
                            onerror="this.onerror=null; this.src='images/placeholder.jpg';">
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
                                <div class="d-grid gap-2">
                                    <a href="product-detail.html?id=${product._id}" class="btn btn-outline-primary">View Details</a>
                                    <button class="btn btn-primary add-to-cart-btn" data-id="${product._id}" 
                                        ${!product.inStock ? 'disabled' : ''}>
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        productsContainer.innerHTML = html;
        
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', addToCart);
        });
    }
    function renderPagination(pagination) {
        const paginationContainer = document.getElementById('pagination');
        
        if (!pagination || pagination.pages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        let html = `<ul class="pagination">`;
        
        // Previous page button
        html += `
            <li class="page-item ${pagination.page === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${pagination.page - 1}" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `;
        
        // Page numbers
        for (let i = 1; i <= pagination.pages; i++) {
            html += `
                <li class="page-item ${pagination.page === i ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        // Next page button
        html += `
            <li class="page-item ${pagination.page === pagination.pages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${pagination.page + 1}" aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        `;
        
        html += `</ul>`;
        
        paginationContainer.innerHTML = html;
        document.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = parseInt(this.getAttribute('data-page'));
                if (page && page !== currentPage) {
                    currentPage = page;
                    loadProducts();
                    document.getElementById('products-container').scrollIntoView();
                }
            });
        });
    }
    
    // Add to cart function
async function addToCart(e) {
    e.preventDefault();
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login to add items to your cart');
        window.location.href = 'login.html';
        return;
    }
    
    const productId = this.getAttribute('data-id');
    console.log('Adding product to cart:', productId);
    
    try {
        this.disabled = true;
        this.innerHTML = 'Adding...';
        
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productId,
                quantity: 1
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Server response:', data);
            throw new Error(data.message || 'Failed to add item to cart');
        }
        
        console.log('Cart response:', data);
        
        updateCartCount(data.data.items.length);
        
        alert('Item added to cart');
        
        this.innerHTML = 'Add to Cart';
        this.disabled = false;
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add item to cart. Please try again.');
        
        this.innerHTML = 'Add to Cart';
        this.disabled = false;
    }
}
    
    // Update cart count in navbar
    function updateCartCount(count) {
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = count;
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