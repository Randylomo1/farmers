// Initialize Stripe
const stripePublicKey = document.querySelector('meta[name="stripe-public-key"]')?.content;
let stripe = null;
let elements = null;
let card = null;

if (stripePublicKey) {
    stripe = Stripe(stripePublicKey);
    elements = stripe.elements({
        fonts: [
            {
                cssSrc: 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,600',
            },
        ],
    });
    
    card = elements.create('card', {
        style: {
            base: {
                fontFamily: 'Roboto, sans-serif',
                fontSize: '16px',
                color: '#32325d',
                '::placeholder': {
                    color: '#aab7c4',
                },
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa755a',
            },
        },
    });
    
    card.mount('#card-element');
    
    // Handle real-time validation errors
    card.addEventListener('change', function(event) {
        const displayError = document.getElementById('payment-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
            displayError.style.display = 'block';
        } else {
            displayError.textContent = '';
            displayError.style.display = 'none';
        }
    });
}

// Handle form submissions
document.addEventListener('DOMContentLoaded', function() {
    // Setup payment form if it exists
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        setupPaymentForm(paymentForm);
    }

    // Setup other interactive elements
    setupFormValidation();
    setupImagePreviews();
    setupQuantityControls();
    setupFilteringSorting();
    setupAutoHideAlerts();
});

// Payment form handling
function setupPaymentForm(form) {
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const submitButton = form.querySelector('#submit-button');
        const spinner = form.querySelector('#spinner');
        
        // Disable the submit button and show spinner
        submitButton.disabled = true;
        submitButton.querySelector('#button-text').classList.add('d-none');
        spinner.classList.remove('d-none');
        
        try {
            const {token, error} = await stripe.createToken(card);

            if (error) {
                showError(error.message);
                enableSubmitButton();
                return;
            }

            // Add token to form
            const hiddenInput = document.createElement('input');
            hiddenInput.setAttribute('type', 'hidden');
            hiddenInput.setAttribute('name', 'stripeToken');
            hiddenInput.setAttribute('value', token.id);
            form.appendChild(hiddenInput);

            // Submit the form
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            });

            const result = await response.json();

            if (result.success) {
                showSuccess('Payment successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = result.redirect_url;
                }, 1500);
            } else {
                showError(result.error);
                enableSubmitButton();
            }
        } catch (err) {
            showError('An error occurred. Please try again.');
            enableSubmitButton();
        }
    });
    
    function enableSubmitButton() {
        const submitButton = form.querySelector('#submit-button');
        const spinner = form.querySelector('#spinner');
        submitButton.disabled = false;
        submitButton.querySelector('#button-text').classList.remove('d-none');
        spinner.classList.add('d-none');
    }
}

// Form validation
function setupFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });
}

// Image preview
function setupImagePreviews() {
    const imageInputs = document.querySelectorAll('input[type="file"][accept^="image"]');
    imageInputs.forEach(input => {
        input.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.querySelector(`#${input.id}-preview`);
                    if (preview) {
                        preview.src = e.target.result;
                        preview.classList.remove('d-none');
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    });
}

// Quantity controls
function setupQuantityControls() {
    const quantityControls = document.querySelectorAll('.quantity-control');
    quantityControls.forEach(control => {
        const input = control.querySelector('input[type="number"]');
        const decreaseBtn = control.querySelector('.decrease');
        const increaseBtn = control.querySelector('.increase');

        if (input && decreaseBtn && increaseBtn) {
            const min = parseInt(decreaseBtn.dataset.min) || 0;
            const max = parseInt(increaseBtn.dataset.max);

            decreaseBtn.addEventListener('click', () => {
                const currentValue = parseInt(input.value) || 0;
                if (currentValue > min) {
                    input.value = currentValue - 1;
                    input.dispatchEvent(new Event('change'));
                }
            });

            increaseBtn.addEventListener('click', () => {
                const currentValue = parseInt(input.value) || 0;
                if (!max || currentValue < max) {
                    input.value = currentValue + 1;
                    input.dispatchEvent(new Event('change'));
                }
            });

            // Validate input on change
            input.addEventListener('change', () => {
                let value = parseInt(input.value) || 0;
                if (value < min) value = min;
                if (max && value > max) value = max;
                input.value = value;
            });
        }
    });
}

// Filtering and sorting
function setupFilteringSorting() {
    const filterForm = document.getElementById('filter-form');
    if (filterForm) {
        const inputs = filterForm.querySelectorAll('select, input:not([type="text"])');
        inputs.forEach(input => {
            input.addEventListener('change', () => filterForm.submit());
        });
    }
}

// Auto-hide alerts
function setupAutoHideAlerts() {
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            const closeButton = alert.querySelector('.btn-close');
            if (closeButton) closeButton.click();
        }, 5000);
    });
}

// Utility functions
function showSpinner() {
    const spinner = document.querySelector('.spinner-overlay');
    if (spinner) {
        spinner.style.display = 'flex';
    }
}

function hideSpinner() {
    const spinner = document.querySelector('.spinner-overlay');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('payment-errors');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('payment-success');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Handle real-time price updates
function updateTotalPrice() {
    const quantityInput = document.getElementById('quantity');
    const pricePerUnit = parseFloat(document.getElementById('price-per-unit').dataset.price);
    const totalPriceElement = document.getElementById('total-price');
    
    if (quantityInput && totalPriceElement && !isNaN(pricePerUnit)) {
        const quantity = parseInt(quantityInput.value) || 0;
        const total = (quantity * pricePerUnit).toFixed(2);
        totalPriceElement.textContent = `$${total}`;
    }
}

// Handle order status updates
function updateOrderStatus(orderId, status) {
    showSpinner();
    return fetch(`/orders/${orderId}/update-status/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ status })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            showError(data.error);
            hideSpinner();
        }
    })
    .catch(error => {
        showError('An error occurred while updating the order status.');
        hideSpinner();
    });
} 