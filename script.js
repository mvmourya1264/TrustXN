// DOM Elements
const connectWalletBtn = document.getElementById('connectWalletBtn');
const walletConnect = document.getElementById('walletConnect');
const walletOptions = document.querySelectorAll('.wallet-option');
const signUpBtn = document.getElementById('signUpBtn');
const signInBtn = document.getElementById('signInBtn');
const subscribeForm = document.getElementById('subscribe-form');
const walletAddressSpan = document.getElementById('walletAddress');

// Toggle wallet connection modal
connectWalletBtn.addEventListener('click', () => {
    walletConnect.style.display = (walletConnect.style.display === 'block') ? 'none' : 'block';
});

// Toggle sign-up modal
signUpBtn.addEventListener('click', () => {
    document.getElementById('signUpModal').style.display = 'block';
});

// Toggle sign-in modal
signInBtn.addEventListener('click', () => {
    document.getElementById('signInModal').style.display = 'block';
});

// Close modals when clicking outside
document.addEventListener('click', (event) => {
    if (!walletConnect.contains(event.target) && event.target !== connectWalletBtn) {
        walletConnect.style.display = 'none';
    }
    if (!document.getElementById('signUpModal').contains(event.target) && event.target !== signUpBtn) {
        document.getElementById('signUpModal').style.display = 'none';
    }
    if (!document.getElementById('signInModal').contains(event.target) && event.target !== signInBtn) {
        document.getElementById('signInModal').style.display = 'none';
    }
});

// Sign-up handler
function handleSignUp() {
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;

    fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message || data.error);
        if (!data.error) document.getElementById('signUpModal').style.display = 'none';
    })
    .catch(error => alert('Error: ' + error.message));
}

// Sign-in handler
function handleSignIn() {
    const email = document.getElementById('signInEmail').value;
    const password = document.getElementById('signInPassword').value;

    fetch('http://localhost:5000/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message || data.error);
        if (!data.error) {
            document.getElementById('signInModal').style.display = 'none';
            if (data.wallet_address) walletAddressSpan.textContent = data.wallet_address;
        }
    })
    .catch(error => alert('Error: ' + error.message));
}

// Wallet connection functionality
walletOptions.forEach(option => {
    option.addEventListener('click', async () => {
        const walletName = option.querySelector('p').textContent;
        try {
            connectWalletBtn.textContent = `Connecting to ${walletName}...`;
            let walletAddress = null;

            if (walletName === 'MetaMask' && window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                walletAddress = accounts[0];
            } else {
                walletAddress = '0x' + Math.random().toString(16).substr(2, 10) + '...';
            }

            const email = localStorage.getItem('signedInEmail') || 'default@example.com';
            const response = await fetch('http://localhost:5000/api/connect-wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, wallet_address: walletAddress })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            connectWalletBtn.textContent = 'Connected';
            walletConnect.style.display = 'none';
            if (walletAddressSpan) walletAddressSpan.textContent = walletAddress;
            alert('Wallet connected!');
        } catch (error) {
            console.error('Error connecting wallet:', error);
            connectWalletBtn.textContent = 'Connect Wallet';
        }
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    });
});

// Check if user has previously connected wallet or signed in
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('walletConnected') === 'true') {
        connectWalletBtn.textContent = 'Connected';
    }
    const signedInEmail = localStorage.getItem('signedInEmail');
    if (signedInEmail && walletAddressSpan) {
        fetch('http://localhost:5000/api/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: signedInEmail, password: localStorage.getItem('signedInPassword') || '' })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.error && data.wallet_address) walletAddressSpan.textContent = data.wallet_address;
        });
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.feature-card').forEach(card => {
        observer.observe(card);
    });
});

// Newsletter subscription form submission
if (subscribeForm) {
    subscribeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email-input').value;

        if (!email || !email.includes('@')) {
            alert('Please enter a valid email address');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            alert('Thank you for subscribing to our newsletter!');
            subscribeForm.reset();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
}