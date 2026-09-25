document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the page from refreshing
    
    const phone = document.getElementById('phone').value;
    const amount = document.getElementById('amountInput').value;
    const messageDiv = document.getElementById('message');
    
    // Show loading message
    messageDiv.innerHTML = '<p class="loading">Processing payment... Please check your phone.</p>';
    
    try {
        // Send data to our backend server
        const response = await fetch('/api/stkpush', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phoneNumber: phone,
                amount: amount
            })
        });
        
        const data = await response.json();
        
        // Check if M-Pesa accepted the request
        if (data.ResponseDescription === 'Success. Request accepted for processing') {
            messageDiv.innerHTML = '<p class="success">STK Push sent! Check your phone to enter your PIN.</p>';
        } else {
            messageDiv.innerHTML = `<p class="error">Error: ${data.errorMessage || data.ResponseDescription || 'Payment failed'}</p>`;
        }
    } catch (error) {
        messageDiv.innerHTML = `<p class="error">Connection Error: Is the server running? (${error.message})</p>`;
    }
});