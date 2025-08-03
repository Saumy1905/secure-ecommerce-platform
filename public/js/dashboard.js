document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
});

// Load user profile data
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to load profile');
        }
        
        // Update profile information
        document.getElementById('user-name').textContent = data.data.name;
        document.getElementById('user-email').textContent = data.data.email;
        document.getElementById('user-role').textContent = data.data.role;
        
        const createdDate = new Date(data.data.createdAt);
        document.getElementById('user-created').textContent = createdDate.toLocaleDateString();
        
    } catch (error) {
        console.error('Profile loading error:', error);
        // If unauthorized, redirect to login
        if (error.message.includes('Not authorized')) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    }
}