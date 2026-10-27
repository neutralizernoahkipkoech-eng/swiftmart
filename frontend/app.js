// ==========================================
// 1. SHOPPING CART LOGIC
// ==========================================
let cart = JSON.parse(localStorage.getItem('swiftmart_cart')) || [];

function initCart() {
    if (!document.getElementById('cartSidebar')) return;
    updateCartUI();
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
    checkoutSummary.innerHTML = `<p style="font-weight: 600; margin-bottom: 8px;">Items:</p><p style="color: var(--text-muted); margin-bottom: 16px; font-size: 0.9rem;">${productList}</p><p style="font-weight: 700; font-size: 1.1rem; color: var(--brand-primary);">Total: KES ${totalPrice.toLocaleString()}</p>`;
    checkoutSection.style.display = 'block';
    checkoutSection.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// 2. FOOTER MODAL LOGIC
// ==========================================
const modalContent = {
    about: `<h2>About SwiftMart</h2><p>SwiftMart is Kenya's trusted destination for top-tier digital services and premium products.</p><h3>Our Mission</h3><p>To empower Kenyan consumers and businesses with accessible, affordable, and reliable digital and physical products.</p>`,
    contact: `<h2>Contact Us</h2><p>We'd love to hear from you!</p><div class="contact-grid"><div class="contact-item"><strong>📍 Location</strong>Nairobi, Kenya</div><div class="contact-item"><strong>📞 Phone</strong><a href="tel:+254754427226">+254 754 427 226</a></div><div class="contact-item"><strong>✉️ Email</strong><a href="mailto:support@swiftmartkenya.co.ke">support@swiftmartkenya.co.ke</a></div></div>`,
    returns: `<h2>Returns & Refunds Policy</h2><p>You may request a return within <strong>7 days</strong> of receiving your product. Digital services are non-refundable once delivered.</p>`,
    shipping: `<h2>Shipping Information</h2><p>We deliver across Kenya with speed and reliability. Nairobi Metro: Same-day or next-day delivery.</p>`,
    faq: `<h2>Frequently Asked Questions</h2><h3>How do I place an order?</h3><p>Browse our products, click "Add to Cart", then proceed to checkout.</p>`,
    privacy: `<h2>Privacy Policy</h2><p>SwiftMart is committed to protecting your privacy. We never sell your data to third parties.</p>`,
    terms: `<h2>Terms & Conditions</h2><p>By using SwiftMart, you agree to our terms of service and privacy policy.</p>`
};

function openModal(type) {
    const modal = document.getElementById('footerModal');
    const body = document.getElementById('modalBody');
    if (modal && body) {
        body.innerHTML = modalContent[type] || '<h2>Page Not Found</h2><p>This content is coming soon.</p>';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('footerModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function closeBundleModal() { 
    const modal = document.getElementById('bundleModal');
    if (modal) {
        modal.classList.remove('active'); 
        document.body.style.overflow = 'auto'; 
    }
}

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
function scrollToProducts() {
    const productsSection = document.querySelector('.search-filter-container');
    if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// 3. AI CHATBOT LOGIC
// ==========================================
let chatInitialized = false;
let currentAgent = null;

const aiAgents = [
    { name: 'Noah', avatar: '👨‍💼', greeting: "Hi there! I'm Noah from SwiftMart. I'm here to personally help you with any issue you're facing. What can I assist you with today?" },
    { name: 'Ezra', avatar: '👨‍💻', greeting: "Hello! Ezra here from SwiftMart support. I'm ready to resolve any issue you're experiencing. How can I help?" },
    { name: 'Amani', avatar: '👩‍💼', greeting: "Welcome! I'm Amani, your SwiftMart support specialist. I'm here to solve your problems quickly and professionally. What do you need help with?" }
];

function initChatbot() {
    if (!document.getElementById('chatWindow')) return;
    currentAgent = aiAgents[Math.floor(Math.random() * aiAgents.length)];
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
        const agentNameEl = document.getElementById('chatAgentName');
        const agentAvatarEl = document.getElementById('chatAvatar');
        if (agentNameEl) agentNameEl.textContent = `SwiftMart AI • ${currentAgent.name}`;
        if (agentAvatarEl) agentAvatarEl.textContent = currentAgent.avatar;
        setTimeout(() => {
            addBotMessage(currentAgent.greeting);
            setTimeout(() => {
                addBotMessage("I can help you with **orders, payments, data bundles, product issues, returns, shipping, and account problems**. Just tell me what you're facing, and I'll get it sorted for you right away. 🙌");
            }, 900);
        }, 300);
        chatInitialized = true;
    }
}

function addBotMessage(text) {
    const messagesDiv = document.getElementById('chatMessages');
    if (!messagesDiv) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message bot';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    msgDiv.innerHTML = `<span class="msg-sender">${currentAgent.name} • SwiftMart Support</span>${formattedText}<span class="msg-time">${time}</span>`;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addUserMessage(text) {
    const messagesDiv = document.getElementById('chatMessages');
    if (!messagesDiv) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message user';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    msgDiv.innerHTML = text + `<span class="msg-time">${time}</span>`;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.style.display = 'flex';
    const messagesDiv = document.getElementById('chatMessages');
    if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.style.display = 'none';
}

const aiResponses = {
    orderTracking: {
        keywords: ['track', 'where', 'order', 'delivery', 'status', 'dispatch', 'shipped', 'arrived', 'late', 'when will', 'hasn\'t arrived', 'not received'],
        analyze: (msg) => {
            if (msg.includes('late') || msg.includes('delayed')) return 'late';
            if (msg.includes('not received') || msg.includes('hasn\'t arrived')) return 'notReceived';
            return 'general';
        },
        solve: (issue, msg) => {
            if (issue === 'late') return `**I completely understand your frustration with the delay.** 😔\n\nPlease share your order number (starts with #ORD) and I'll track it personally right now. 📦`;
            if (issue === 'notReceived') return `**I'm sorry to hear you haven't received your order.** Let me investigate this immediately. Please provide your order number and phone number. 💪`;
            return `**I'll help you track your order right now.** 📦\n\nPlease provide your order number (starts with #ORD).`;
        }
    },
    paymentIssues: {
        keywords: ['payment', 'pay', 'mpesa', 'failed', 'error', 'charged', 'money', 'deducted', 'not confirmed', 'transaction', 'stk push', 'pin'],
        analyze: (msg) => {
            if (msg.includes('deducted') || msg.includes('charged') || msg.includes('money taken')) return 'deductedNotConfirmed';
            if (msg.includes('failed') || msg.includes('error')) return 'failedPayment';
            return 'general';
        },
        solve: (issue, msg) => {
            if (issue === 'deductedNotConfirmed') return `**I understand money was deducted but your order wasn't confirmed.** 💪\n\nPlease provide your M-Pesa transaction ID, and I'll manually verify it with Paystack right now. 🔍`;
            if (issue === 'failedPayment') return `**Payment failed — don't worry, I'll help you complete it successfully.** 💳\n\nPlease ensure your phone number is in the format 2547XXXXXXXX (12 digits, no + or 0). Try again or use card payment.`;
            return `**I'll help you with your payment issue.** 💳\n\nPlease tell me specifically: Did payment fail completely, or was money deducted but order not confirmed?`;
        }
    },
    bundleActivation: {
        keywords: ['bundle', 'data', 'airtime', 'not activated', 'not received', 'activate', 'activation', 'safari', 'internet', 'safaricom', 'sms'],
        analyze: (msg) => {
            if (msg.includes('not activated') || msg.includes('not received')) return 'notActivated';
            return 'general';
        },
        solve: (issue, msg) => {
            if (issue === 'notActivated') return `**Your data bundle hasn't activated — I'll fix this immediately.** ⚡\n\nPlease provide your phone number and order number, and I'll activate it while we chat!`;
            return `**I'll help you purchase or activate a data bundle!**\n\nOur available bundles (instant activation): 1GB Daily (KES 50), 5GB Monthly (KES 500). Which bundle do you want?`;
        }
    },
    productIssues: {
        keywords: ['product', 'item', 'defective', 'damaged', 'wrong', 'broken', 'not working', 'quality', 'faulty'],
        analyze: (msg) => {
            if (msg.includes('damaged') || msg.includes('broken')) return 'damaged';
            if (msg.includes('wrong')) return 'wrongItem';
            return 'general';
        },
        solve: (issue, msg) => {
            if (issue === 'damaged') return `**I'm very sorry you received a damaged item.** 😔\n\nPlease share your order number and send photos via WhatsApp to +254 754 427 226. I'll approve a replacement or refund immediately!`;
            if (issue === 'wrongItem') return `**You received the wrong item — I sincerely apologize.**\n\nPlease provide your order number and what you received. I'll dispatch the correct item within 2 hours!`;
            return `**I'll help you with your product issue.** 🔧\n\nPlease tell me: What product did you buy and what's the specific problem?`;
        }
    },
    returns: {
        keywords: ['return', 'refund', 'exchange', 'send back', 'money back', 'cancel'],
        analyze: (msg) => {
            if (msg.includes('exchange')) return 'exchange';
            return 'refund';
        },
        solve: (issue, msg) => {
            if (issue === 'exchange') return `**I'll help you exchange your item.** 🔄\n\nPlease share your order number and what you want to exchange it for. Eligible within 7 days of delivery!`;
            return `**I'll process your return/refund right away.** 💰\n\nPlease provide your order number and reason for return. Refunds are processed via M-Pesa within 24-48 hours.`;
        }
    },
    technicalSupport: {
        keywords: ['website', 'app', 'not loading', 'error', 'bug', 'login', 'can\'t access', 'technical', 'crash', 'slow'],
        analyze: (msg) => {
            if (msg.includes('login')) return 'loginIssue';
            return 'general';
        },
        solve: (issue, msg) => {
            if (issue === 'loginIssue') return `**You can't login — let me get you back into your account.** 🔑\n\nTry clearing your browser cache (Ctrl+Shift+Delete) or try incognito mode. If it still fails, please provide your email address.`;
            return `**I'll help you resolve this technical issue.** 🔧\n\nPlease tell me: What were you trying to do and what error message do you see?`;
        }
    },
    accountIssues: {
        keywords: ['account', 'register', 'signup', 'verify', 'email verification', 'create account'],
        analyze: (msg) => {
            if (msg.includes('verify') || msg.includes('verification')) return 'verification';
            return 'general';
        },
        solve: (issue, msg) => {
            if (issue === 'verification') return `**You haven't received the email verification — I'll resend it immediately.** 📧\n\nPlease provide your email address, and I'll send a new verification link right now!`;
            return `**I'll help you create or access your account.** 👤\n\nHaving trouble? Tell me where you're stuck!`;
        }
    },
    shipping: {
        keywords: ['shipping', 'delivery', 'how long', 'when', 'arrive', 'location', 'cost', 'charge', 'fee'],
        analyze: (msg) => {
            if (msg.includes('cost') || msg.includes('price') || msg.includes('charge') || msg.includes('fee')) return 'cost';
            return 'general';
        },
        solve: (issue, msg) => {
            if (issue === 'cost') return `**Here are our shipping costs:** 📦\n\n📍 Nairobi Metro: KES 200 (1-2 days)\n📍 Major Towns: KES 350 (2-3 days)\n📍 Other Areas: KES 500 (3-5 days)\n\n**FREE** for orders over KES 5,000! Where are you located?`;
            return `**I'll provide shipping information for your order.** 🚚\n\nPlease share your order number so I can give you the exact delivery date!`;
        }
    }
};

function getAIResponse(message) {
    const lowerMsg = message.toLowerCase();
    for (const key in aiResponses) {
        const category = aiResponses[key];
        if (category.keywords) {
            for (const keyword of category.keywords) {
                if (lowerMsg.includes(keyword)) {
                    const issue = category.analyze ? category.analyze(lowerMsg) : 'general';
                    return category.solve(issue, lowerMsg);
                }
            }
        }
    }
    if (/^(hi|hello|hey|howdy|jambo|habari|sasa|mjengo)/i.test(lowerMsg)) {
        return `Hello! 👋 I'm ${currentAgent.name} from SwiftMart. I'm here to **solve your actual problems**. What issue are you facing?`;
    }
    if (/(thank|thanks|appreciate|helpful|great|perfect|awesome)/i.test(lowerMsg)) {
        return `😊 You're very welcome! I'm glad I could **actually solve your problem**. Is there anything else I can help with?`;
    }
    if (/(bye|goodbye|see you|later|asante|kwaheri)/i.test(lowerMsg)) {
        return `👋 Thank you for chatting with me! Have a wonderful day! ✨ — ${currentAgent.name}`;
    }
    if (lowerMsg.includes('human') || lowerMsg.includes('agent') || lowerMsg.includes('real person') || lowerMsg.includes('speak to') || lowerMsg.includes('manager')) {
        return `💼 **I understand you'd like to speak with a human specialist.**\n\n📱 **WhatsApp:** +254 754 427 226\n✉️ **Email:** support@swiftmartkenya.co.ke\n🕐 **Hours:** Mon-Sat, 8AM-6PM`;
    }
    return `I want to help you **solve this issue**, but I need a bit more detail.\n\n**Examples of what I can help with:**\n• "My order hasn't arrived"\n• "I paid via M-Pesa but order not confirmed"\n• "How much is shipping to Mombasa?"\n\n**What's your specific issue?** I'm listening! 👂`;
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    const message = input.value.trim();
    if (!message) return;
    addUserMessage(message);
    input.value = '';
    showTypingIndicator();
    const thinkingTime = 1000 + Math.random() * 1500;
    setTimeout(() => {
        hideTypingIndicator();
        const response = getAIResponse(message);
        addBotMessage(response);
    }, thinkingTime);
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
// 4. AUTH CHECK LOGIC
// ==========================================
function initAuthCheck() {
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
// 5. JUMIA AFFILIATE LINKS
// ==========================================
function initJumiaAffiliateLinks() {
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
// 6. PAYMENT FUNCTIONS
// ==========================================
async function payWithPaystack() {
    if (typeof cart === 'undefined' || cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const amount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const product = cart.map(item => `${item.name} (x${item.qty})`).join(', ');
    const messageBox = document.getElementById('messageBox');
    
    if (!email) {
        messageBox.textContent = '❌ Please enter your email address.';
        messageBox.className = 'message error';
        messageBox.style.display = 'block';
        return;
    }
    if (!phone || phone.length !== 12 || !phone.startsWith('254')) {
        messageBox.textContent = '❌ Please enter a valid M-Pesa number (Format: 2547XXXXXXXX)';
        messageBox.className = 'message error';
        messageBox.style.display = 'block';
        return;
    }
    
    messageBox.style.display = 'none';
    const btn = document.getElementById('globalPayBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="display: block;"></div> Processing...';
    
    try {
        const response = await fetch('/api/paystack/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, amount, productName: product, phone })
        });
        const data = await response.json();
        if (data.authorization_url) {
            window.location.href = data.authorization_url;
        } else {
            messageBox.textContent = '❌ Could not start payment. Please try again.';
            messageBox.className = 'message error';
            messageBox.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    } catch (error) {
        console.error('Payment error:', error);
        messageBox.textContent = '❌ Network error. Please check your connection and try again.';
        messageBox.className = 'message error';
        messageBox.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function processBundlePayment(e) {
    e.preventDefault();
    const email = document.getElementById('bundleEmail').value;
    const phone = document.getElementById('bundlePhone').value;
    const messageBox = document.getElementById('bundleMessageBox');
    const btn = document.getElementById('bundlePayBtn');
    const price = parseInt(document.getElementById('bundleModalPrice').textContent.replace('KES ', '').replace(/,/g, ''));
    const name = document.getElementById('bundleModalTitle').textContent.replace('Activate: ', '');
    
    let formattedPhone = phone;
    if (phone.startsWith('0')) {
        formattedPhone = '254' + phone.substring(1);
    }
    
    messageBox.style.display = 'none';
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="display: block;"></div> Processing...';
    
    try {
        const response = await fetch('/api/paystack/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, amount: price, productName: name, phone: formattedPhone })
        });
        const data = await response.json();
        if (data.authorization_url) {
            window.location.href = data.authorization_url;
        } else {
            messageBox.textContent = '❌ Could not start payment.';
            messageBox.className = 'message error';
            messageBox.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    } catch (error) {
        console.error('Payment error:', error);
        messageBox.textContent = '❌ Network error.';
        messageBox.className = 'message error';
        messageBox.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ==========================================
// 7. UTILITIES & INITIALIZATION
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

function filterProducts() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const selectedCategory = document.getElementById('categoryFilter').value;
    const cards = document.querySelectorAll('.card');
    let visibleCount = 0;
    cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        const cardName = card.querySelector('.card-name').textContent.toLowerCase();
        const matchesSearch = cardName.includes(searchText);
        const matchesCategory = selectedCategory === 'all' || cardCategory === selectedCategory;
        if (matchesSearch && matchesCategory) { card.style.display = 'flex'; visibleCount++; } 
        else { card.style.display = 'none'; }
    });
    document.getElementById('noResults').style.display = visibleCount === 0 ? 'block' : 'none';
}

function quickBuyBundle(name, price) {
    document.getElementById('bundleModalTitle').textContent = 'Activate: ' + name;
    document.getElementById('bundleModalPrice').textContent = 'KES ' + price.toLocaleString();
    document.getElementById('bundleMessageBox').style.display = 'none';
    document.getElementById('bundleModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function loadReviews() {
    const list = document.getElementById('reviewsList');
    if (!list) return;
    try {
        const res = await fetch('/api/reviews');
        const data = await res.json();
        if (data.reviews && data.reviews.length > 0) {
            list.innerHTML = data.reviews.map(r => `<div style="border-bottom: 1px solid var(--border-color); padding: 12px 0;"><div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><strong>${r.productName}</strong><span style="color: #f59e0b;">${'⭐'.repeat(r.rating)}</span></div><p style="font-size: 0.875rem; color: var(--text-main); margin-bottom: 4px; font-style: italic;">"${r.comment}"</p><small style="color: var(--text-muted);">- ${r.author}</small></div>`).join('');
        } else { 
            list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No approved reviews yet. Be the first!</p>'; 
        }
    } catch (error) { 
        list.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Failed to load reviews.</p>'; 
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initCart();
    initChatbot();
    initAuthCheck();
    initJumiaAffiliateLinks();
    loadReviews();
    
    const footerModal = document.getElementById('footerModal');
    if (footerModal) {
        footerModal.addEventListener('click', function(e) { if (e.target === this) closeModal(); });
    }
    const bundleModal = document.getElementById('bundleModal');
    if (bundleModal) {
        bundleModal.addEventListener('click', function(e) { if (e.target === this) closeBundleModal(); });
    }
    document.addEventListener('keydown', function(e) { 
        if (e.key === 'Escape') { closeModal(); closeBundleModal(); } 
    });
});