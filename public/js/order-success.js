document.addEventListener('DOMContentLoaded', function() {
    const orderSuccessData = sessionStorage.getItem('orderSuccess');
    
    if (!orderSuccessData) {
        window.location.href = 'index.html';
        return;
    }
    
    const orderSuccess = JSON.parse(orderSuccessData);
    
    document.getElementById('order-id').textContent = orderSuccess.orderNumber || orderSuccess.orderId;
    
    // Clear session storage
    sessionStorage.removeItem('orderSuccess');
    
    // Reset cart count in navbar
    document.getElementById('cart-count').textContent = '0';
});