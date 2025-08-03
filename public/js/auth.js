function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname.split('/').pop();

    const protectedPages = ['dashboard.html', 'checkout.html', 'orders.html', 'order-detail.html'];
    const authPages = ['login.html', 'register.html'];
    
    updateNavLinks(token);
    
    if (token) {
        if (authPages.includes(currentPage)) {
            window.location.href = 'index.html';
        }
        
        loadCartCount(token);
    } else {
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
    }
}

function updateNavLinks(token) {
    const authLinksElement = document.getElementById('auth-links');
    const ordersLinkElement = document.getElementById('orders-link');
    
    if (authLinksElement) {
        if (token) {
            authLinksElement.innerHTML = `
                <a class="nav-link" href="dashboard.html">Dashboard</a>
                <a class="nav-link" href="#" id="logout-link">Logout</a>
            `;
            
            const logoutLink = document.getElementById('logout-link');
            if (logoutLink) {
                logoutLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    logoutUser();
                });
            }
            if (ordersLinkElement) {
                ordersLinkElement.style.display = 'block';
            }
        } else {
            authLinksElement.innerHTML = `
                <a class="nav-link" href="login.html">Login</a>
                <a class="nav-link" href="register.html">Register</a>
            `;
            
            if (ordersLinkElement) {
                ordersLinkElement.style.display = 'none';
            }
        }
    }
}

async function loadCartCount(token) {
    try {
        const cartCountElement = document.getElementById('cart-count');
        if (!cartCountElement) return;
        
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
        
        if (data.data && data.data.items) {
            cartCountElement.textContent = data.data.items.length;
        }
        
    } catch (error) {
        console.error('Error loading cart count:', error);
    }
}
async function registerUser(formData) {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }
        
        localStorage.setItem('token', data.token);
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        showError(error.message);
    }
}

async function loginUser(formData) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        localStorage.setItem('token', data.token);
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        showError(error.message);
    }
}
async function logoutUser() {
    try {
        const token = localStorage.getItem('token');
        
        if (token) {
            await fetch('/api/auth/logout', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }
        localStorage.removeItem('token');
        
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }
}
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
        
        setTimeout(() => {
            errorDiv.classList.add('d-none');
        }, 5000);
    }
}
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const password2 = document.getElementById('password2').value;
            
            if (password !== password2) {
                return showError('Passwords do not match');
            }
            
            const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
            if (!passwordRegex.test(password)) {
                return showError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character');
            }
            
            registerUser({ name, email, password });
        });
    }
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            loginUser({ email, password });
        });
    }
});