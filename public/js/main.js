function safeInsertHTML(element, content) {
    const temp = document.createElement('div');
    temp.textContent = content;
    element.innerHTML = temp.innerHTML;
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Security measures initialized');
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data and validate
            const formData = new FormData(form);
            const data = {};
            let isValid = true;
            
            for (const [key, value] of formData.entries()) {
                // Basic validation
                if (!value.trim()) {
                    isValid = false;
                    alert(`${key} cannot be empty`);
                    break;
                }
                
                // Prevent XSS in form inputs
                data[key] = value.trim();
            }
            
            if (isValid) {
                console.log('Validated data:', data);
            }
        });
    }
});