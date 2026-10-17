/**
 * SwiftMart Shared JavaScript
 * Handles Cart, Chatbot, and Auth checks across all pages.
 */

document.addEventListener('DOMContentLoaded', () => {
    initCart();
    initChatbot();
    initAuthCheck();
    initJumiaAffiliateLinks();
});

// ==========================================
// 1. SHOPPING CART LOGIC
// ==========================================
let cart = JSON.parse(localStorage.getItem('swiftmart_cart')) || [];

function initCart() {
    // Only run cart logic if cart elements exist on the page
    if (!document.getElementById('cartSidebar')) return;

    updateCartUI();

    // Expose functions to global scope so HTML onclick attributes can find them
    window.addToCart = addToCart;
    window.updateQty = updateQty;
    window.removeItem = removeItem;
    window.toggleCart = toggleCart;
    window.proceedToCheckout = proceedToCheckout;
}

function saveCart() {
    localStorage.setItem('swiftmart_cart', JSON.stringify(cart));
    updateCartUI();
}

function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ name, price, qty: 1 });
    }
    saveCart();
    toggleCart(true);
    showToast('✅ Added to cart: ' + name, '#065f46');
}

function updateQty(name, change) {
    const item = cart.find(item => item.name === name);
    if (item) {
        item.qty += change;
        if (item.qty <= 0) cart = cart.filter(i => i.name !== name);
        saveCart();
    }
}

function removeItem(name) {
    cart = cart.filter(item => item.name !== name);
    saveCart();
}

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cartItems');
    const cartBadge = document.getElementById('cartBadge');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('proceedToCheckoutBtn');
    
    if (!cartItemsDiv) return;

    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    if (cartBadge) cartBadge.textContent = totalQty;
    if (cartTotal) cartTotal.textContent = `KES ${totalPrice.toLocaleString()}`;
    if (checkoutBtn) checkoutBtn.disabled = totalQty === 0;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 40px;">Your cart is empty.</p>';
    } else {
        cartItemsDiv.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>KES ${item.price.toLocaleString()} x ${item.qty}</p>
                </div>
                <div class="cart-item-actions">
                    <button class="qty-btn" onclick="updateQty('${item.name}', -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty('${item.name}', 1)">+</button>
                    <button class="remove-btn" onclick="removeItem('${item.name}')">Remove</button>
                </div>
            </div>
        `).join('');
    }
}

function toggleCart(forceOpen = false) {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    if (!sidebar || !overlay) return;

    if (forceOpen || !sidebar.classList.contains('open')) {
        sidebar.classList.add('open');
        overlay.classList.add('active');
    } else {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }
}

function proceedToCheckout() {
    toggleCart(false);
    const checkoutSection = document.getElementById('checkout');
    const checkoutSummary = document.getElementById('checkoutSummary');
    if (!checkoutSection || !checkoutSummary) return;

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const productList = cart.map(item => `${item.name} (x${item.qty})`).join(', ');
    
    checkoutSummary.innerHTML = `
        <p style="font-weight: 600; margin-bottom: 8px;">Items:</p>
        <p style="color: var(--text-muted); margin-bottom: 16px; font-size: 0.9rem;">${productList}</p>
        <p style="font-weight: 700; font-size: 1.1rem; color: var(--brand-primary);">Total: KES ${totalPrice.toLocaleString()}</p>
    `;
    checkoutSection.style.display = 'block';
    checkoutSection.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// 2. AI CHATBOT LOGIC
// ==========================================
let chatInitialized = false;

function initChatbot() {
    if (!document.getElementById('chatWindow')) return;
    
    window.toggleChat = toggleChat;
    window.sendChatMessage = sendChatMessage;
    window.sendQuickMessage = sendQuickMessage;
    window.handleChatKeyPress = handleChatKeyPress;
}

function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    if (!chatWindow) return;
    
    const isActive = chatWindow.style.display === 'flex';
    chatWindow.style.display = isActive ? 'none' : 'flex';
    
    if (!isActive && !chatInitialized) {
        addBotMessage("Hi there! 👋 I'm the SwiftMart AI. How can I help you today?");
        chatInitialized = true;
    }
}

function addBotMessage(text) {
    const messagesDiv = document.getElementById('chatMessages');
    if (!messagesDiv) return;
    
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = "background: white; color: #0f172a; padding: 12px 16px; border-radius: 16px; border-bottom-left-radius: 4px; max-width: 85%; font-size: 0.9rem; line-height: 1.5; box-shadow: 0 2px 8px rgba(0,0,0,0.06);";
    msgDiv.innerHTML = text + `<div style="font-size: 0.7rem; opacity: 0.7; margin-top: 4px;">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>`;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addUserMessage(text) {
    const messagesDiv = document.getElementById('chatMessages');
    if (!messagesDiv) return;

    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = "background: #2563eb; color: white; padding: 12px 16px; border-radius: 16px; border-bottom-right-radius: 4px; max-width: 85%; font-size: 0.9rem; line-height: 1.5; align-self: flex-end;";
    msgDiv.innerHTML = text + `<div style="font-size: 0.7rem; opacity: 0.7; margin-top: 4px; text-align: right;">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>`;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    addUserMessage(message);
    input.value = '';
    
    setTimeout(() => {
        addBotMessage("Thanks for your message! For detailed support, please WhatsApp us at <strong>+254 754 427 226</strong> or check our FAQ.");
    }, 1000);
}

function sendQuickMessage(message) {
    const input = document.getElementById('chatInput');
    if (input) input.value = message;
    sendChatMessage();
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') sendChatMessage();
}

// ==========================================
// 3. AUTH CHECK LOGIC
// ==========================================
function initAuthCheck() {
    // Only run if we are on a page that has user elements
    if (document.getElementById('userName') || document.getElementById('guestView')) {
        checkAuth();
    }
    window.logout = logout;
    window.toggleUserDropdown = toggleUserDropdown;
}

async function checkAuth() {
    try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        
        const guestView = document.getElementById('guestView');
        const userView = document.getElementById('userView');
        const adminLink = document.getElementById('adminLink');
        const displayUserName = document.getElementById('displayUserName');
        const dropdownUserEmail = document.getElementById('dropdownUserEmail');
        const userNameSpan = document.getElementById('userName');

        if (data.user) {
            if (guestView) guestView.style.display = 'none';
            if (userView) userView.style.display = 'block';
            if (displayUserName) displayUserName.textContent = data.user.name.split(' ')[0];
            if (dropdownUserEmail) dropdownUserEmail.textContent = data.user.email;
            if (userNameSpan) userNameSpan.textContent = data.user.name.split(' ')[0];
            
            if (data.user.email === 'neutralizernoahkipkoech@gmail.com' && adminLink) {
                adminLink.style.display = 'block';
            }
        } else {
            if (guestView) guestView.style.display = 'flex';
            if (userView) userView.style.display = 'none';
            if (adminLink) adminLink.style.display = 'none';
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

document.addEventListener('click', function(event) {
    const userView = document.getElementById('userView');
    const dropdown = document.getElementById('userDropdown');
    if (userView && dropdown && !userView.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        window.location.href = '/login';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/login';
    }
}

// ==========================================
// 4. JUMIA AFFILIATE LINKS (Homepage Only)
// ==========================================
function initJumiaAffiliateLinks() {
    // Only run on homepage where product grids exist
    if (!document.querySelector('.card[data-category]')) return;

    const affiliateLinks = {
        'smartphones': 'https://jmia.io/OSg3VfD',
        'tablets': 'https://jmia.io/VnmcM0w',
        'laptops': 'https://jmia.io/yUlmIGy',
        'audio': 'https://jmia.io/wzVCDee', 
        'pcspeakers': 'https://jmia.io/puapbUt',
        'accessories': 'https://jmia.io/oIaPjuf',
        'fashion': 'https://jmia.io/lnvxNU5',
        'watches': 'https://www.jumia.co.ke/catalog/?q=watches',
        'home': 'https://jmia.io/3j1Ua6q',
        'beauty': 'https://jmia.io/hw4gGo5',
        'healthcare': 'https://jmia.io/h4alcwk'
    };

    const physicalCategories = ['smartphones', 'tablets', 'laptops', 'audio', 'pcspeakers', 'accessories', 'fashion', 'watches', 'home', 'beauty', 'healthcare'];
    
    physicalCategories.forEach(category => {
        const cards = document.querySelectorAll(`.card[data-category="${category}"]`);
        const link = affiliateLinks[category] || 'https://jmia.io/OSg3VfD'; 
        
        cards.forEach(card => {
            if (card.querySelector('.jumia-btn')) return;

            const jumiaBtn = document.createElement('a');
            jumiaBtn.href = link;
            jumiaBtn.target = '_blank';
            jumiaBtn.rel = 'noopener noreferrer';
            jumiaBtn.className = 'jumia-btn';
            jumiaBtn.innerHTML = '<i class="fas fa-shopping-bag"></i> Buy on Jumia';
            
            const cardBody = card.querySelector('.card-body');
            if (cardBody) cardBody.appendChild(jumiaBtn);
        });
    });
}

// ==========================================
// 5. UTILITIES
// ==========================================
function showToast(message, color = '#0f172a') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); background: ${color}; color: white; padding: 14px 28px; border-radius: 10px; font-weight: 600; z-index: 9999; animation: fadeIn 0.3s ease; box-shadow: 0 10px 25px rgba(0,0,0,0.2); font-size: 0.95rem;`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}