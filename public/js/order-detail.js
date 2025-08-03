document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        document.getElementById('loading-indicator').classList.add('d-none');
        document.getElementById('login-message').classList.remove('d-none');
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    
    if (!orderId) {
        window.location.href = 'orders.html';
        return;
    }
    
    loadOrderDetails(orderId);
    
    async function loadOrderDetails(id) {
        try {
            const response = await fetch(`/api/orders/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load order details');
            }
            
            const data = await response.json();
            const order = data.data;
            
            document.getElementById('loading-indicator').classList.add('d-none');
            
            // Update page title and breadcrumb
            document.title = `Order #${id} - Secure E-commerce`;
            document.getElementById('order-breadcrumb').textContent = `Order #${id.substring(id.length - 8).toUpperCase()}`;
            
            document.getElementById('order-details').classList.remove('d-none');
            
            renderOrderDetails(order);
            
        } catch (error) {
            console.error('Error loading order details:', error);
            document.getElementById('loading-indicator').classList.add('d-none');
            document.getElementById('order-not-found').classList.remove('d-none');
        }
    }
    
    function renderOrderDetails(order) {
        const orderDetails = document.getElementById('order-details');
        
        const orderDate = new Date(order.createdAt);
        const formattedOrderDate = orderDate.toLocaleDateString() + ' ' + orderDate.toLocaleTimeString();
        
        let formattedPaidDate = 'Not paid yet';
        if (order.isPaid && order.paidAt) {
            const paidDate = new Date(order.paidAt);
            formattedPaidDate = paidDate.toLocaleDateString() + ' ' + paidDate.toLocaleTimeString();
        }
        
        let formattedDeliveredDate = 'Not delivered yet';
        if (order.isDelivered && order.deliveredAt) {
            const deliveredDate = new Date(order.deliveredAt);
            formattedDeliveredDate = deliveredDate.toLocaleDateString() + ' ' + deliveredDate.toLocaleTimeString();
        }
        
        let statusBadgeClass = 'bg-secondary';
        switch (order.orderStatus) {
            case 'processing':
                statusBadgeClass = 'bg-info';
                break;
            case 'confirmed':
                statusBadgeClass = 'bg-primary';
                break;
            case 'shipped':
                statusBadgeClass = 'bg-warning';
                break;
            case 'delivered':
                statusBadgeClass = 'bg-success';
                break;
            case 'cancelled':
                statusBadgeClass = 'bg-danger';
                break;
        }
        
        let html = `
            <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">Order #${order._id.substring(order._id.length - 8).toUpperCase()}</h5>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <p><strong>Order Date:</strong> ${formattedOrderDate}</p>
                            <p><strong>Order Status:</strong> <span class="badge ${statusBadgeClass}">${capitalizeFirstLetter(order.orderStatus)}</span></p>
                            <p><strong>Payment Method:</strong> ${order.paymentMethod === 'upi' ? 'UPI Payment' : 'Cash on Delivery'}</p>
                            <p><strong>Payment Status:</strong> ${order.isPaid ? 
                                `<span class="badge bg-success">Paid</span> (${formattedPaidDate})` : 
                                `<span class="badge bg-warning">Pending</span>`}</p>
                            <p><strong>Delivery Status:</strong> ${order.isDelivered ? 
                                `<span class="badge bg-success">Delivered</span> (${formattedDeliveredDate})` : 
                                `<span class="badge bg-warning">Not Delivered</span>`}</p>
                        </div>
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">Shipping Information</h6>
                                </div>
                                <div class="card-body">
                                    <p class="mb-1">
                                        ${escapeHTML(order.shippingAddress.name)}<br>
                                        ${escapeHTML(order.shippingAddress.address)}<br>
                                        ${escapeHTML(order.shippingAddress.city)}, ${escapeHTML(order.shippingAddress.state)} ${escapeHTML(order.shippingAddress.postalCode)}<br>
                                        ${escapeHTML(order.shippingAddress.country)}<br>
                                        Phone: ${escapeHTML(order.shippingAddress.phone)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <h6 class="mb-3">Order Items</h6>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        order.items.forEach(item => {
            const subtotal = (item.price * item.quantity).toFixed(2);
            
            html += `
                <tr>
                    <td>${escapeHTML(item.name)}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>$${subtotal}</td>
                </tr>
            `;
        });
        
        html += `
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="row mt-4">
                        <div class="col-md-6">
                            <div class="d-grid gap-2">
                                <a href="orders.html" class="btn btn-outline-primary">Back to Orders</a>
                                
                                ${['processing', 'confirmed'].includes(order.orderStatus) ? 
                                    `<button id="cancel-order-btn" class="btn btn-outline-danger" data-id="${order._id}">Cancel Order</button>` : 
                                    ''}
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">Order Summary</h6>
                                </div>
                                <div class="card-body">
                                    <div class="d-flex justify-content-between mb-2">
                                        <span>Subtotal:</span>
                                        <span>$${order.totalPrice.toFixed(2)}</span>
                                    </div>
                                    <div class="d-flex justify-content-between mb-2">
                                        <span>Shipping:</span>
                                        <span>$0.00</span>
                                    </div>
                                    <div class="d-flex justify-content-between mb-2">
                                        <span>Tax:</span>
                                        <span>$0.00</span>
                                    </div>
                                    <hr>
                                    <div class="d-flex justify-content-between">
                                        <strong>Total:</strong>
                                        <strong>$${order.totalPrice.toFixed(2)}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0">Order Tracking</h5>
                </div>
                <div class="card-body">
                    <div class="position-relative">
                        <div class="progress" style="height: 5px;">
                            <div class="progress-bar bg-success" role="progressbar" style="width: ${getOrderProgress(order.orderStatus)}%"></div>
                        </div>
                        <div class="d-flex justify-content-between mt-3">
                            <div class="text-center">
                                <div class="rounded-circle ${order.orderStatus !== 'cancelled' ? 'bg-success' : 'bg-secondary'} text-white d-inline-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                    <i class="bi bi-check"></i>
                                </div>
                                <p class="mt-2">Order Placed</p>
                            </div>
                            <div class="text-center">
                                <div class="rounded-circle ${['confirmed', 'shipped', 'delivered'].includes(order.orderStatus) ? 'bg-success' : 'bg-secondary'} text-white d-inline-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                    <i class="bi bi-check"></i>
                                </div>
                                <p class="mt-2">Confirmed</p>
                            </div>
                            <div class="text-center">
                                <div class="rounded-circle ${['shipped', 'delivered'].includes(order.orderStatus) ? 'bg-success' : 'bg-secondary'} text-white d-inline-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                    <i class="bi bi-truck"></i>
                                </div>
                                <p class="mt-2">Shipped</p>
                            </div>
                            <div class="text-center">
                                <div class="rounded-circle ${order.orderStatus === 'delivered' ? 'bg-success' : 'bg-secondary'} text-white d-inline-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                    <i class="bi bi-house-door"></i>
                                </div>
                                <p class="mt-2">Delivered</p>
                            </div>
                        </div>
                    </div>
                    
                    ${order.orderStatus === 'cancelled' ? 
                        `<div class="alert alert-danger mt-3">
                            <i class="bi bi-exclamation-triangle"></i> This order has been cancelled.
                        </div>` : 
                        ''}
                </div>
            </div>
        `;
        
        orderDetails.innerHTML = html;
        
        const cancelOrderBtn = document.getElementById('cancel-order-btn');
        if (cancelOrderBtn) {
            cancelOrderBtn.addEventListener('click', function() {
                cancelOrder(this.getAttribute('data-id'));
            });
        }
    }
    
    function getOrderProgress(status) {
        switch (status) {
            case 'processing':
                return 25;
            case 'confirmed':
                return 50;
            case 'shipped':
                return 75;
            case 'delivered':
                return 100;
            case 'cancelled':
                return 0;
            default:
                return 0;
        }
    }
    async function cancelOrder(orderId) {
        if (!confirm('Are you sure you want to cancel this order?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to cancel order');
            }
            
            loadOrderDetails(orderId);
            
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('Failed to cancel order. Please try again.');
        }
    }
    
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
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