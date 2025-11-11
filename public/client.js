const SERVER_URL = 'http://localhost:3000/api/';

// Helper function to show messages
function showMessage(text, isError = false) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    // Set colors based on success or error
    if (isError) {
        messageDiv.style.backgroundColor = '#cc0000';
        messageDiv.style.color = 'white';
    } else {
        messageDiv.style.backgroundColor = '#00a000';
        messageDiv.style.color = 'white';
    }
}

// Function to send the OTP request to the server
async function sendOtp() {
    const emailInput = document.getElementById('email').value;
    
    if (!emailInput) {
        return showMessage('សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែល', true);
    }
    
    showMessage('កំពុងផ្ញើ OTP...', false);

    try {
        const response = await fetch(SERVER_URL + 'send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: emailInput }),
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(data.message);
            // Hide email step, show OTP input step
            document.getElementById('email-step').style.display = 'none';
            document.getElementById('otp-step').style.display = 'block';
        } else {
            showMessage(data.error || 'មានបញ្ហាមួយចំនួនបានកើតឡើង។', true);
        }

    } catch (error) {
        showMessage('មិនអាចភ្ជាប់ទៅ Server បានទេ (សូមប្រាកដថា server កំពុងរត់)', true);
        console.error('Fetch Error:', error);
    }
}

// Function to verify the entered OTP
async function verifyOtp() {
    const emailInput = document.getElementById('email').value;
    const otpInput = document.getElementById('otp').value;
    
    if (!otpInput || otpInput.length !== 6) {
        return showMessage('សូមបញ្ចូលកូដ OTP ៦ ខ្ទង់ឱ្យបានត្រឹមត្រូវ', true);
    }

    showMessage('កំពុងផ្ទៀងផ្ទាត់ OTP...', false);

    try {
        const response = await fetch(SERVER_URL + 'verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: emailInput, otp: otpInput }),
        });

        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message + ' 🎉', false);
            
            // Redirect to the protected dashboard page after 1 second
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000); 

        } else {
            showMessage(data.error || 'ការផ្ទៀងផ្ទាត់មិនបានជោគជ័យ។', true);
        }

    } catch (error) {
        showMessage('មិនអាចភ្ជាប់ទៅ Server បានទេ', true);
        console.error('Fetch Error:', error);
    }
}

// Attach functions to buttons
document.getElementById('send-otp-btn').addEventListener('click', sendOtp);
document.getElementById('verify-otp-btn').addEventListener('click', verifyOtp);