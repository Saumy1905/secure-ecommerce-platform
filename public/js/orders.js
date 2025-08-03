document.addEventListener('DOMContentLoaded', function() {
    
    const token = localStorage.getItem('token');
    
    if (!token) {
        document.getElementById('loading-indicator').classList.add('d-none');
        document.getElementById('login-message').classList.remove('d-none');
        return;
    }
    
    loadOrders();
    
    async function loadOrders() {
        try {
            const response = await fetch('/api/orders', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load orders');
            }
            
            const data = await response.json();
            const orders = data.data;
            
            document.getElementById('loading-indicator').classList.add('d-none');
            
            if (!orders || orders.length === 0) {
                document.getElementById('no-orders-message').classList.remove('d-none');
                return;
            }
            
            document.getElementById('orders-list').classList.remove('d-none');
            
            renderOrders(orders);
            
        } catch (error) {
            console.error('Error loading orders:', error);
            document.getElementById('loading-indicator').classList.add('d-none');
            document.getElementById('orders-content').innerHTML = `
                <div class="alert alert-danger">
                    Failed to load orders. Please try again later.
                </div>
            `;
        }
    }
    
    function renderOrders(orders) {
        const ordersList = document.getElementById('orders-list');
        
        let html = '';
        
        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            const formattedDate = orderDate.toLocaleDateString() + ' ' + orderDate.toLocaleTimeString();
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
            
            html += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <strong>Order ID:</strong> ${order._id}
                        </div>
                        <span class="badge ${statusBadgeClass}">${capitalizeFirstLetter(order.orderStatus)}</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Date:</strong> ${formattedDate}</p>
                                <p><strong>Total:</strong> $${order.totalPrice.toFixed(2)}</p>
                                <p><strong>Payment Method:</strong> ${order.paymentMethod === 'upi' ? 'UPI Payment' : 'Cash on Delivery'}</p>
                                <p><strong>Payment Status:</strong> ${order.isPaid ? 
                                    `<span class="badge bg-success">Paid</span>` : 
                                    `<span class="badge bg-warning">Pending</span>`}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Shipping Address:</strong></p>
                                <p>
                                    ${escapeHTML(order.shippingAddress.name)}<br>
                                    ${escapeHTML(order.shippingAddress.address)}<br>
                                    ${escapeHTML(order.shippingAddress.city)}, ${escapeHTML(order.shippingAddress.state)} ${escapeHTML(order.shippingAddress.postalCode)}<br>
                                    ${escapeHTML(order.shippingAddress.country)}<br>
                                    Phone: ${escapeHTML(order.shippingAddress.phone)}
                                </p>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <h6>Order Items:</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
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
                        
                        <div class="d-flex justify-content-between mt-3">
                            <a href="order-detail.html?id=${order._id}" class="btn btn-outline-primary">View Details</a>
                            
                            ${['processing', 'confirmed'].includes(order.orderStatus) ? 
                                `<button class="btn btn-outline-danger cancel-order-btn" data-id="${order._id}">Cancel Order</button>` : 
                                ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        ordersList.innerHTML = html;
        
        document.querySelectorAll('.cancel-order-btn').forEach(button => {
            button.addEventListener('click', function() {
                const orderId = this.getAttribute('data-id');
                cancelOrder(orderId);
            });
        });
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
            loadOrders();
            
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