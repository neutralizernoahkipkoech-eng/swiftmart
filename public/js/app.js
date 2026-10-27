/**
 * SwiftMart Shared JavaScript
 * Handles Cart, Chatbot, Auth checks, Modals, Jumia Affiliate links, and Search across all pages.
 */

// ==========================================
// 1. SHOPPING CART LOGIC
// ==========================================
let cart = JSON.parse(localStorage.getItem('swiftmart_cart')) || [];

function initCart() {
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
let currentAgent = null;

const aiAgents = [
    { name: 'Noah', avatar: '👨‍', greeting: "Hi there! I'm Noah from SwiftMart. I'm here to personally help you with any issue you're facing. What can I assist you with today?" },
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
                addBotMessage("I can help you with **orders, payments, data bundles, product issues, returns, shipping, and account problems**. Just tell me what you're facing, and I'll get it sorted for you right away. ");
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
            if (msg.includes('wrong')) return 'wrongAddress';
            return 'general';
        },
        solve: (issue, msg) => {
            if (issue === 'late') {
                return `**I completely understand your frustration with the delay — I sincerely apologize for the inconvenience.** 😔\n\nHere's exactly what I'll do right now:\n\n1️⃣ **Check your order status** — Please share your order number (it starts with #ORD or you can find it in your email)\n2️⃣ **Investigate the delay** — I'll personally contact our logistics team\n3️⃣ **Expedite delivery** — If it's stuck, we'll rush it to you at no extra cost\n4️⃣ **Compensation** — If the delay is our fault, you'll receive a **10% discount** on your next order\n\n**Our typical delivery times:**\n• Nairobi: 1-2 days\n• Major towns (Mombasa, Kisumu, Nakuru): 2-3 days\n• Remote areas: 3-5 days\n\n**What's your order number?** I'll track it personally right now. 📦`;
            }
            if (issue === 'notReceived') {
                return `**I'm sorry to hear you haven't received your order. Let me investigate this immediately.**\n\n**Here's my action plan:**\n\n1. **Verify delivery status** — Share your order number\n2. **Contact the courier** — I'll call them while we chat\n3. **Locate your package** — We'll find it within 10 minutes\n4. **Resolution options:**\n   • If lost: **Full refund OR replacement sent TODAY**\n   • If delivered to wrong address: We'll retrieve it or send a new one\n   • If still with courier: We'll expedite immediately\n\n**Please provide:**\n• Your order number\n• Phone number you used\n• Delivery address\n\nI'm staying online until this is fully resolved! 💪`;
            }
            return `**I'll help you track your order right now.** 📦\n\n**To locate your order instantly, I need:**\n\n **Your Order Number** (check your confirmation email — it starts with #ORD)\n\n**Once you provide it, I will:**\n✅ Check real-time location\n✅ Give you the exact delivery date\n✅ Share courier contact if needed\n✅ Send tracking link to your phone\n\n**What's your order number?**`;
        }
    },
    paymentIssues: {
        keywords: ['payment', 'pay', 'mpesa', 'failed', 'error', 'charged', 'money', 'deducted', 'not confirmed', 'transaction', 'stk push', 'pin'],
        analyze: (msg) => {
            if (msg.includes('deducted') || msg.includes('charged') || msg.includes('money taken')) return 'deductedNotConfirmed';
            if (msg.includes('failed') || msg.includes('error')) return 'failedPayment';
            if (msg.includes('refund')) return 'refund';
            return 'general';
        },
        solve: (issue, msg) => {
            if (issue === 'deductedNotConfirmed') {
                return `**I understand money was deducted but your order wasn't confirmed — I know this is stressful, and I'll fix it RIGHT NOW.** 💪\n\n**Why this happens:**\n• M-Pesa confirmation delayed (usually resolves in 5 mins)\n• Network timeout during payment\n• System didn't receive the callback\n\n**IMMEDIATE ACTION PLAN:**\n\n1️⃣ **Check your M-Pesa message** — Do you have the transaction ID? (e.g., QGH7X8Y9)\n2️⃣ **Wait 5 minutes** — Sometimes the system auto-resolves\n3️⃣ **If still not confirmed:**\n   • Send me the M-Pesa transaction ID\n   • I'll manually verify with Paystack\n   • Your order will be confirmed within **10 minutes**\n   • OR instant refund if you prefer\n\n**What's your M-Pesa transaction ID?** I'm checking it right now. 🔍`;
            }
            if (issue === 'failedPayment') {
                return `**Payment failed — don't worry, I'll help you complete it successfully.** 💳\n\n**Common causes & quick solutions:**\n\n **Insufficient balance**\n✅ Check your M-Pesa balance: Dial *334# (not *234#)\n\n **Wrong phone format**\n✅ Must be: **2547XXXXXXXX** (12 digits, no + or 0)\n\n❌ **M-Pesa service down**\n✅ Wait 10 mins, try again, or use card payment\n\n **Daily limit exceeded**\n✅ Use card payment instead\n\n**Try these steps NOW:**\n1. Clear browser cache (Ctrl+Shift+Delete)\n2. Use incognito mode\n3. Try card payment instead of M-Pesa\n4. Or try from mobile data (not WiFi)\n\n**Still failing?** Send me:\n• Exact error message\n• Phone number you used\n• Amount you tried to pay\n\nI'll process it manually for you!`;
            }
            return `**I'll help you with your payment issue.** 💳\n\n**Please tell me specifically:**\n• Did payment fail completely?\n• Was money deducted but order not confirmed?\n• Are you trying to get a refund?\n• Wrong amount charged?\n\n**I need these details to solve this quickly.** What exactly happened?`;
        }
    },
    bundleActivation: {
        keywords: ['bundle', 'data', 'airtime', 'not activated', 'not received', 'activate', 'activation', 'safari', 'internet', 'safaricom', 'sms'],
        analyze: (msg) => {
            if (msg.includes('not activated') || msg.includes('not received')) return 'notActivated';
            if (msg.includes('wrong')) return 'wrongNumber';
            return 'general';
        },
        solve: (issue, msg) => {
            if (issue === 'notActivated') {
                return `**Your data bundle hasn't activated — I'll fix this immediately.** ⚡\n\n**Quick diagnosis:**\n\n1️⃣ **Check confirmation SMS** — Did you get an SMS from Safaricom?\n   • If YES: Bundle is active, just restart your phone\n   • If NO: Activation failed, I'll resend it\n\n2️⃣ **Verify phone number** — What number did you provide?\n   • Must be a Safaricom number\n   • Check if you typed it correctly\n\n3️⃣ **Check payment status** — Was payment successful?\n   • If yes: I'll manually activate within **5 minutes**\n   • If pending: Wait for confirmation\n\n**IMMEDIATE SOLUTION:**\n\n 📱 **WhatsApp your details to +254 754 427 226:**\n• Your order number\n• Phone number for activation\n• M-Pesa confirmation code\n\n**OR** give me your details right here and I'll activate it while we chat!\n\n**What's your phone number and order number?**`;
            }
            return `**I'll help you purchase or activate a data bundle!**\n\n**Our available bundles (instant activation):**\n• 1GB Daily — KES 50 (24 hours)\n• 2GB Monthly — KES 250 (30 days)\n• **5GB Monthly — KES 500** (30 days) ⭐ MOST POPULAR\n• 10GB Monthly — KES 1,000\n• Unlimited Weekend — KES 150\n\n**How to activate:**\n1. Add to cart or use Quick Buy on our website\n2. Pay via M-Pesa or Card\n3. WhatsApp confirmation code to +254 754 427 226\n4. Activated within **5 minutes!** \n\n**Which bundle do you want?** I'll guide you through it step by step.`;
        }
    },
    productIssues: {
        keywords: ['product', 'item', 'defective', 'damaged', 'wrong', 'broken', 'not working', 'quality', 'faulty'],
        analyze: (msg) => {
            if (msg.includes('damaged') || msg.includes('broken')) return 'damaged';
            if (msg.includes('wrong')) return 'wrongItem';
            if (msg.includes('not working') || msg.includes('defective')) return 'defective';
            return 'general';
        },
        solve: (issue, msg) => {
            if (issue === 'damaged') {
                return `**I'm very sorry you received a damaged item — this is completely unacceptable, and I'll make it right immediately.** \n\n**IMMEDIATE ACTION PLAN:**\n\n1️⃣ **Document the damage** — Take 2-3 clear photos\n2️⃣ **Don't discard packaging** — Keep everything\n3️⃣ **Choose your resolution:**\n   • 🔄 **Replacement** — We send a new item TODAY (free express shipping)\n   • 💰 **Full refund** — Money back to M-Pesa within 24 hours\n   • 🎁 **Store credit** — 110% value for future purchases\n\n**I'll process this RIGHT NOW:**\n• Share your order number\n• Send photos via WhatsApp to +254 754 427 226\n• I'll approve replacement/refund immediately\n• No need to return the damaged item (we'll arrange pickup)\n\n**What's your order number?** I'm escalating this personally! 🔥`;
            }
            if (issue === 'wrongItem') {
                return `**You received the wrong item — I sincerely apologize. Let me fix this immediately.**\n\n**Resolution Process:**\n\n✅ **We send the correct item TODAY** (free express delivery)\n✅ **Free return pickup** of the wrong item\n✅ **10% discount** on your next order for the inconvenience\n\n**What I need from you:**\n1. Order number\n2. What you ordered vs. what you received\n3. Photos of the received item\n\n**I'll personally:**\n• Dispatch the correct item within 2 hours\n• Send you a tracking number immediately\n• Arrange pickup of the wrong item at your convenience\n\n**What's your order number?** Let me check what happened! 🔍`;
            }
            return `**I'll help you with your product issue.** 🔧\n\n**Please tell me:**\n• What product did you buy?\n• What's the specific problem?\n• When did you receive it?\n• Is it completely not working or partially defective?\n\n**I need these details to provide the exact solution.** What's happening?`;
        }
    },
    returns: {
        keywords: ['return', 'refund', 'exchange', 'send back', 'money back', 'cancel'],
        analyze: (msg) => {
            if (msg.includes('exchange')) return 'exchange';
            if (msg.includes('refund') || msg.includes('money back')) return 'refund';
            return 'general';
        },
        solve: (issue, msg) => {
            if (issue === 'exchange') {
                return `**I'll help you exchange your item for a different one.** 🔄\n\n**Exchange Policy:**\n\n✅ **Eligible within 7 days** of delivery\n✅ **Item must be unused** with original tags\n✅ **Free exchange** — no extra charges\n\n**Steps:**\n1. Share your order number\n2. Tell me what you want to exchange it for\n3. I'll check availability\n4. Arrange free pickup of current item\n5. Send new item immediately\n\n**What item do you want to exchange, and what would you like instead?**`;
            }
            return `**I'll process your return/refund right away.** 💰\n\n**Our Return Policy:**\n✅ 7-day return window\n✅ Full refund for defective items\n✅ Refund via M-Pesa within 24-48 hours\n\n**To initiate a return:**\n1. Order number\n2. Reason for return
3. Choose: Refund OR Replacement\n\n**I'll email you a return label** and arrange free pickup.\n\n**What's your order number?**`;
        }
    },
    technicalSupport: {
        keywords: ['website', 'app', 'not loading', 'error', 'bug', 'login', 'can\'t access', 'technical', 'crash', 'slow'],
        analyze: (msg) => {
            if (msg.includes('login')) return 'loginIssue';
            if (msg.includes('loading') || msg.includes('slow')) return 'loadingIssue';
            if (msg.includes('error')) return 'errorMessage';
            return 'general';
        },
        solve: (issue, msg) => {
            if (issue === 'loginIssue') {
                return `**You can't login — let me get you back into your account immediately.** \n\n**Quick fixes (try these first):**\n\n🔑 **Forgot password?**\n• Click "Forgot Password" on the login page\n• Enter your email\n• Check inbox (and spam) for reset link\n• Reset takes 2 minutes\n\n **Email not verified?**\n• Check email for verification link\n• Didn't get it? I'll resend it now\n\n🔑 **Account locked?**\n• Too many attempts locks account for 30 mins\n• I can unlock it manually — give me your email\n\n**Still can't login?**\n• Clear browser cache: Ctrl+Shift+Delete\n• Try incognito mode\n• Try from your phone instead\n\n**What's your email?** I'll check your account status right now! 🔍`;
            }
            if (issue === 'loadingIssue') {
                return `**Website not loading — let me get you back online.** 🌐\n\n**Try these steps IN ORDER:**\n\n1️⃣ **Clear browser cache**\n   • Chrome: Ctrl+Shift+Delete → Clear data\n   • Safari: Cmd+Opt+E → Empty caches\n\n2️⃣ **Try incognito/private mode**\n   • Ctrl+Shift+N (Chrome)\n   • Cmd+Shift+N (Safari)\n\n3️⃣ **Switch internet connection**\n   • From WiFi to mobile data (or vice versa)\n   • Disable VPN if active\n\n4️⃣ **Try a different browser**\n   • Chrome → Firefox → Edge\n\n5️⃣ **Clear DNS cache**\n   • Windows: ipconfig /flushdns in CMD\n   • Mac: sudo killall -HUP mDNSResponder\n\n**Still not loading?**\n• What error do you see?\n• What browser are you using?\n• Are you on phone or computer?\n\nI'm here until it's fixed!`;
            }
            return `**I'll help you resolve this technical issue.** \n\n**Please tell me:**\n• What were you trying to do?\n• What error message do you see? (screenshot if possible)\n• What device/browser are you using?\n• When did this start?\n\n**I'll diagnose and fix it with you right now.** What's happening?`;
        }
    },
    accountIssues: {
        keywords: ['account', 'register', 'signup', 'verify', 'email verification', 'create account'],
        analyze: (msg) => {
            if (msg.includes('verify') || msg.includes('verification')) return 'verification';
            if (msg.includes('register') || msg.includes('signup') || msg.includes('create')) return 'registration';
            return 'general';
        },
        solve: (issue, msg) => {
            if (issue === 'verification') {
                return `**You haven't received the email verification — I'll resend it immediately.** \n\n**Quick solution:**\n\n1️⃣ **Check spam/junk folder**\n   • Email might be there\n   • Mark as "Not Spam"\n\n2️⃣ **I'll resend verification NOW**\n   • Give me your email address\n   • I'll send it within 30 seconds\n   • Check inbox immediately\n\n3️⃣ **Still not received?**\n   • I'll verify your account manually\n   • No need to wait for email\n   • You'll be able to login immediately\n\n**What's your email address?** I'm resending it right now! `;
            }
            return `**I'll help you create or access your account.** 👤\n\n**To create an account:**\n1. Click "Login" → "Create Account"\n2. Enter email, phone, password\n3. Verify email (check spam folder)\n4. Login immediately\n\n**Benefits of having an account:**\n✅ Track all orders\n✅ Save payment details\n✅ Exclusive discounts\n✅ Faster checkout\n\n**Having trouble?** Tell me where you're stuck!`;
        }
    },
    shipping: {
        keywords: ['shipping', 'delivery', 'how long', 'when', 'arrive', 'location', 'cost', 'charge', 'fee'],
        analyze: (msg) => {
            if (msg.includes('cost') || msg.includes('price') || msg.includes('charge') || msg.includes('fee')) return 'cost';
            if (msg.includes('change') || msg.includes('update')) return 'changeAddress';
            return 'general';
        },
        solve: (issue, msg) => {
            if (issue === 'cost') {
                return `**Here are our shipping costs:** 📦\n\n  **Nairobi Metro:**\n• Standard: KES 200 (1-2 days)\n• Express: KES 350 (Same day)\n• **FREE** for orders over KES 5,000\n\n 📍 **Major Towns (Mombasa, Kisumu, Nakuru):**\n• Standard: KES 350 (2-3 days)\n• Express: KES 600 (Next day)\n• **FREE** for orders over KES 10,000\n\n📍 **Other Areas:**\n• Standard: KES 500 (3-5 days)\n• **FREE** for orders over KES 15,000\n\n**Where are you located?** I'll give you the exact delivery time! 📦`;
            }
            return `**I'll provide shipping information for your order.** \n\n**Delivery Times:**\n• Nairobi: 1-2 days (same day if ordered before 2 PM)\n• Major towns: 2-3 days\n• Remote areas: 3-5 days\n\n**To track YOUR order:**\n• Share your order number\n• I'll give you the exact delivery date\n• Share courier contact if needed\n\n**What's your order number?**`;
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
        return `Hello! 👋 I'm ${currentAgent.name} from SwiftMart. I'm here to **solve your actual problems**, not just chat.\n\n**Tell me what issue you're facing:**\n• Order delayed or lost?\n• Payment failed or money deducted?\n• Product damaged or wrong item?\n• Can't login or technical issue?\n• Bundle not activated?\n• Shipping or returns question?\n\n**I'm ready to help — what's the problem?** 💪`;
    }
    
    if (/(thank|thanks|appreciate|helpful|great|perfect|awesome)/i.test(lowerMsg)) {
        return `😊 You're very welcome! I'm glad I could **actually solve your problem**.\n\nIs there anything else I can help you with? I'm here until everything is completely resolved! `;
    }
    
    if (/(bye|goodbye|see you|later|asante|kwaheri)/i.test(lowerMsg)) {
        return `👋 Thank you for chatting with me! If any issue comes up, I'm here 24/7.\n\nHave a wonderful day! ✨ — ${currentAgent.name}`;
    }
    
    if (lowerMsg.includes('human') || lowerMsg.includes('agent') || lowerMsg.includes('real person') || lowerMsg.includes('speak to') || lowerMsg.includes('manager')) {
        return ` **I understand you'd like to speak with a human specialist.**\n\n**I'm connecting you now:**\n\n📱 **WhatsApp:** +254 754 427 226\n✉️ **Email:** support@swiftmartkenya.co.ke\n🕐 **Hours:** Mon-Sat, 8AM-6PM\n\n**Response time:** Usually within 2 hours\n\n**Before you go:**\n• Share your order number with them\n• Mention what issue you're facing\n• I've logged our conversation for them\n\nIs there anything I can help you with before you connect with them?`;
    }
    
    return `I want to help you **solve this issue**, but I need a bit more detail.\n\n**Please tell me:**\n• What specific problem are you facing?\n• What were you trying to do?\n• What error or issue occurred?\n• When did this happen?\n\n**Examples of what I can help with:**\n• "My order #ORD123 hasn't arrived and it's 3 days late"\n• "I paid via M-Pesa but order not confirmed"\n• "I received damaged headphones"\n• "Can't login, forgot password"\n• "How much is shipping to Mombasa?"\n\n**What's your specific issue?** I'm listening! 👂`;
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
// 3. AUTH CHECK LOGIC
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
// 4. JUMIA AFFILIATE LINKS
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
// 5. MODAL & SCROLL UTILITIES (CRITICAL FOR FOOTER LINKS)
// ==========================================
const modalContent = {
    about: `
        <h2>About SwiftMart</h2>
        <p><strong>SwiftMart</strong> is Kenya's trusted destination for top-tier digital services and premium products. We are committed to delivering quality, speed, and excellence to every customer.</p>
        
        <h3>Our Mission</h3>
        <p>To empower Kenyan consumers and businesses with accessible, affordable, and reliable digital and physical products through innovative e-commerce solutions.</p>
        
        <h3>Our Vision</h3>
        <p>To become East Africa's most trusted e-commerce platform by 2030, known for exceptional customer service and product quality.</p>
        
        <h3>Why Choose Us?</h3>
        <ul style="margin-left: 20px; margin-top: 10px;">
            <li>✅ Secure M-Pesa and card payments via Paystack</li>
            <li>✅ Fast delivery across Kenya (1-5 days)</li>
            <li>✅ 24/7 AI-powered customer support</li>
            <li>✅ Quality guaranteed on every product</li>
            <li>✅ Easy returns and refunds</li>
            <li>✅ Verified products and services</li>
        </ul>
        
        <h3>Our Values</h3>
        <p><strong>Integrity:</strong> We conduct business with honesty and transparency.<br>
        <strong>Excellence:</strong> We strive for the highest quality in everything we do.<br>
        <strong>Customer Focus:</strong> Your satisfaction is our top priority.<br>
        <strong>Innovation:</strong> We embrace technology to serve you better.</p>
    `,
    
    contact: `
        <h2>Contact Us</h2>
        <p>We'd love to hear from you! Our team is ready to assist you with any questions or concerns.</p>
        
        <div class="contact-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px;">
            <div style="background: #f8fafc; padding: 16px; border-radius: 10px; border-left: 4px solid #2563eb;">
                <strong> Location</strong><br>
                Nairobi, Kenya
            </div>
            <div style="background: #f8fafc; padding: 16px; border-radius: 10px; border-left: 4px solid #2563eb;">
                <strong>📞 Phone</strong><br>
                <a href="tel:+254754427226" style="color: #2563eb;">+254 754 427 226</a>
            </div>
            <div style="background: #f8fafc; padding: 16px; border-radius: 10px; border-left: 4px solid #2563eb;">
                <strong>✉️ Email</strong><br>
                <a href="mailto:support@swiftmartkenya.co.ke" style="color: #2563eb;">support@swiftmartkenya.co.ke</a>
            </div>
            <div style="background: #f8fafc; padding: 16px; border-radius: 10px; border-left: 4px solid #2563eb;">
                <strong>🕒 Business Hours</strong><br>
                Mon - Sat: 8:00 AM - 6:00 PM<br>
                Sunday: Closed
            </div>
        </div>
        
        <h3 style="margin-top: 24px;">Quick Support</h3>
        <p>For immediate assistance, click the chat icon at the bottom right to chat with our AI assistant. For complex issues, our human support team typically responds within 2 hours during business hours.</p>
        
        <h3>Follow Us</h3>
        <p>Stay connected on social media for updates, promotions, and new arrivals!</p>
    `,
    
    returns: `
        <h2>Returns & Refunds Policy</h2>
        <p>At SwiftMart, your satisfaction is our priority. We want you to be completely happy with your purchase.</p>
        
        <h3>Return Window</h3>
        <p>You may request a return within <strong>7 days</strong> of receiving your product. Digital services are non-refundable once delivered.</p>
        
        <h3>Eligible Items</h3>
        <ul style="margin-left: 20px; margin-top: 10px;">
            <li>✅ Products must be unused and in original packaging</li>
            <li>✅ Physical items must not show signs of wear</li>
            <li>✅ Defective items qualify for full refund or replacement</li>
            <li>✅ Original receipt or proof of purchase required</li>
        </ul>
        
        <h3>Non-Refundable Items</h3>
        <ul style="margin-left: 20px; margin-top: 10px;">
            <li>❌ Digital services (web design, hosting, consultation)</li>
            <li> Data bundles and airtime</li>
            <li>❌ Customized or personalized products</li>
            <li>❌ Items damaged due to misuse</li>
        </ul>
        
        <h3>How to Request a Return</h3>
        <ol style="margin-left: 20px; margin-top: 10px;">
            <li>Contact us via chat or email with your order number</li>
            <li>Provide photos of the item (if applicable)</li>
            <li>Once approved, return the item to our Nairobi office</li>
            <li>Refunds are processed within 5-7 business days via M-Pesa</li>
        </ol>
        
        <h3>Refund Processing</h3>
        <p>Refunds are processed back to the original payment method. M-Pesa refunds are instant. Card refunds may take 5-10 business days depending on your bank.</p>
    `,
    
    shipping: `
        <h2>Shipping Information</h2>
        <p>We deliver across Kenya with speed and reliability. Your order is processed and shipped within 24 hours of payment confirmation.</p>
        
        <h3>Delivery Options & Costs</h3>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 12px 0;">
            <strong>📍 Nairobi Metro Area</strong><br>
            • Standard Delivery: KES 200 (1-2 days)<br>
            • Express Delivery: KES 350 (Same day)<br>
            • <strong>FREE</strong> for orders over KES 5,000
        </div>
        
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 12px 0;">
            <strong>📍 Major Towns</strong> (Mombasa, Kisumu, Nakuru, Eldoret)<br>
            • Standard Delivery: KES 350 (2-3 days)<br>
            • Express Delivery: KES 600 (Next day)<br>
            • <strong>FREE</strong> for orders over KES 10,000
        </div>
        
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 12px 0;">
            <strong>📍 Other Areas</strong><br>
            • Standard Delivery: KES 500 (3-5 days)<br>
            • <strong>FREE</strong> for orders over KES 15,000
        </div>
        
        <h3>Digital Services</h3>
        <p>Digital services are delivered electronically within the agreed timeframe — no shipping required! You'll receive access details via email.</p>
        
        <h3>Data Bundles</h3>
        <p>Data bundles are activated instantly upon payment confirmation via M-Pesa. WhatsApp your confirmation code to +254 754 427 226 for immediate activation (usually within 5-15 minutes).</p>
        
        <h3>Tracking Your Order</h3>
        <p>Once your order ships, you'll receive an SMS with tracking details. You can also check your order status in the "My Orders" section of your account dashboard.</p>
        
        <h3>Delivery Issues?</h3>
        <p>If your order is delayed or you have any concerns, contact our support team immediately. We'll investigate and resolve the issue within 24 hours.</p>
    `,
    
    faq: `
        <h2>Frequently Asked Questions</h2>
        
        <h3>📦 Orders & Delivery</h3>
        <p><strong>How do I place an order?</strong><br>
        Browse our products, click "Add to Cart", then proceed to checkout. You can pay via M-Pesa or card.</p>
        
        <p><strong>How long does delivery take?</strong><br>
        Nairobi: 1-2 days | Major towns: 2-3 days | Remote areas: 3-5 days</p>
        
        <p><strong>Can I track my order?</strong><br>
        Yes! You'll receive an SMS with tracking details once your order ships. You can also check "My Orders" in your dashboard.</p>
        
        <h3>💳 Payments</h3>
        <p><strong>Is my payment secure?</strong><br>
        Yes! We use Paystack, a PCI-DSS compliant payment processor. Your card details are never stored on our servers.</p>
        
        <p><strong>What payment methods do you accept?</strong><br>
        M-Pesa (STK Push), Visa, Mastercard, and PayPal via Paystack.</p>
        
        <p><strong>How do I receive my data bundle?</strong><br>
        After payment, WhatsApp your M-Pesa confirmation code to +254 754 427 226. Your bundle will be activated within 5-15 minutes.</p>
        
        <h3>🔄 Returns & Refunds</h3>
        <p><strong>What is your return policy?</strong><br>
        7-day return window for physical products. Digital services are non-refundable once delivered.</p>
        
        <p><strong>How long do refunds take?</strong><br>
        M-Pesa refunds are instant. Card refunds take 5-10 business days.</p>
        
        <h3>🛍️ Products & Services</h3>
        <p><strong>Do you offer warranties?</strong><br>
        Yes, all physical products come with a manufacturer warranty. Digital services include a 30-day support window.</p>
        
        <p><strong>Can I change my order after placing it?</strong><br>
        Contact us within 1 hour of placing your order. After that, changes depend on whether the item has shipped.</p>
        
        <h3>📞 Support</h3>
        <p><strong>How do I contact support?</strong><br>
        Use our AI chatbot (headset icon) for instant help, or WhatsApp us at +254 754 427 226. We respond within 2 hours during business hours (Mon-Sat, 8AM-6PM).</p>
    `,
    
    privacy: `
        <h2>Privacy Policy</h2>
        <p><em>Last updated: October 2026</em></p>
        <p>SwiftMart is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.</p>
        
        <h3>Information We Collect</h3>
        <ul style="margin-left: 20px; margin-top: 10px;">
            <li><strong>Personal Info:</strong> Name, email, phone number (for order processing)</li>
            <li><strong>Payment Info:</strong> Processed securely via Paystack — we never store card details</li>
            <li><strong>Usage Data:</strong> Browser type, pages visited (for improving our service)</li>
            <li><strong>Location Data:</strong> Delivery address (for shipping purposes)</li>
        </ul>
        
        <h3>How We Use Your Info</h3>
        <ul style="margin-left: 20px; margin-top: 10px;">
            <li>To process and deliver your orders</li>
            <li>To send order confirmations and updates</li>
            <li>To improve our website and services</li>
            <li>To send promotional offers (only if you subscribe)</li>
            <li>To prevent fraud and ensure security</li>
        </ul>
        
        <h3>Your Rights</h3>
        <p>You have the right to:</p>
        <ul style="margin-left: 20px; margin-top: 10px;">
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Export your data in a portable format</li>
        </ul>
        
        <h3>Data Security</h3>
        <p>We use industry-standard encryption (SSL/TLS) and secure servers. Your data is never sold to third parties. We only share information with trusted service providers (like Paystack for payments and delivery partners for shipping).</p>
        
        <h3>Cookies</h3>
        <p>We use cookies to enhance your browsing experience and remember your preferences. You can disable cookies in your browser settings, but some features may not work properly.</p>
        
        <h3>Contact Us</h3>
        <p>For privacy concerns, email us at privacy@swiftmartkenya.co.ke</p>
    `,
    
    terms: `
        <h2>Terms & Conditions</h2>
        <p><em>Last updated: October 2026</em></p>
        <p>By using SwiftMart, you agree to the following terms:</p>
        
        <h3>1. Acceptance of Terms</h3>
        <p>Using our website constitutes acceptance of these terms. If you disagree, please do not use our services.</p>
        
        <h3>2. Products & Services</h3>
        <p>We strive for accuracy in product descriptions and pricing. However, we reserve the right to correct errors and update prices without prior notice. All products are subject to availability.</p>
        
        <h3>3. Orders & Payments</h3>
        <p>All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order. Prices are in Kenyan Shillings (KES) and include applicable taxes. Payment must be completed at checkout.</p>
        
        <h3>4. User Accounts</h3>
        <p>You are responsible for maintaining the confidentiality of your account credentials and all activities under your account. You must notify us immediately of any unauthorized use.</p>
        
        <h3>5. Shipping & Delivery</h3>
        <p>Delivery times are estimates and not guaranteed. We are not liable for delays caused by courier services or circumstances beyond our control.</p>
        
        <h3>6. Returns & Refunds</h3>
        <p>Subject to our Returns Policy (see separate section). Digital services are non-refundable once delivered.</p>
        
        <h3>7. Intellectual Property</h3>
        <p>All content on this website (logos, text, images) is the property of SwiftMart and protected by copyright laws.</p>
        
        <h3>8. Limitation of Liability</h3>
        <p>SwiftMart is not liable for indirect, incidental, or consequential damages arising from the use of our services, to the maximum extent permitted by Kenyan law.</p>
        
        <h3>9. Indemnification</h3>
        <p>You agree to indemnify and hold harmless SwiftMart from any claims arising from your use of our services or violation of these terms.</p>
        
        <h3>10. Modifications</h3>
        <p>We reserve the right to modify these terms at any time. Continued use of the website constitutes acceptance of modified terms.</p>
        
        <h3>11. Governing Law</h3>
        <p>These terms are governed by the laws of the Republic of Kenya. Any disputes will be resolved in Kenyan courts.</p>
        
        <h3>12. Contact</h3>
        <p>For questions about these terms, contact us at legal@swiftmartkenya.co.ke</p>
    `
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

function scrollToTop() { 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
}

function scrollToProducts() {
    const productsSection = document.querySelector('.search-filter-container');
    if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' });
}

// Expose modal functions to global scope so HTML onclick works
window.openModal = openModal;
window.closeModal = closeModal;
window.closeBundleModal = closeBundleModal;
window.scrollToTop = scrollToTop;
window.scrollToProducts = scrollToProducts;

// ==========================================
// 6. PAYMENT FUNCTIONS
// ==========================================

// Quick Buy Bundle Function
function quickBuyBundle(bundleName, price) {
    // Open the bundle modal
    const modal = document.getElementById('bundleModal');
    const modalTitle = document.getElementById('bundleModalTitle');
    const modalDesc = document.getElementById('bundleModalDesc');
    const modalPrice = document.getElementById('bundleModalPrice');
    
    if (modal && modalTitle && modalPrice) {
        modalTitle.textContent = `Activate: ${bundleName}`;
        modalDesc.textContent = `Enter your Safaricom number for instant activation of ${bundleName}.`;
        modalPrice.textContent = `KES ${price.toLocaleString()}`;
        
        // Store the bundle info for payment processing
        modal.dataset.bundleName = bundleName;
        modal.dataset.bundlePrice = price;
        
        // Show the modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus on the phone input
        setTimeout(() => {
            const phoneInput = document.getElementById('bundlePhone');
            if (phoneInput) phoneInput.focus();
        }, 300);
    }
}

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
    
    // Get bundle info from modal dataset or elements
    const modal = document.getElementById('bundleModal');
    const price = parseInt(modal.dataset.bundlePrice || document.getElementById('bundleModalPrice').textContent.replace('KES ', '').replace(/,/g, ''));
    const name = modal.dataset.bundleName || document.getElementById('bundleModalTitle').textContent.replace('Activate: ', '');
    
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

// Expose to global scope so HTML onclick can find them
window.payWithPaystack = payWithPaystack;
window.processBundlePayment = processBundlePayment;
window.quickBuyBundle = quickBuyBundle;

// ==========================================
// 7. SEARCH & FILTER FUNCTIONALITY (IMPROVED!)
// ==========================================
function filterProducts() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    if (!searchInput || !categoryFilter) return;

    const searchText = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;
    const cards = document.querySelectorAll('.card');
    let visibleCount = 0;
    let firstVisibleCard = null;
    
    cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category') || '';
        const cardNameElement = card.querySelector('.card-name');
        const cardDescElement = card.querySelector('.card-description');
        
        if (!cardNameElement || !cardDescElement) return;

        const cardName = cardNameElement.textContent.toLowerCase();
        const cardDesc = cardDescElement.textContent.toLowerCase();
        
        // Check if matches category filter
        const matchesCategory = selectedCategory === 'all' || cardCategory === selectedCategory;
        
        // Check if matches search text (search in name, description, AND category)
        let matchesSearch = true;
        
        if (searchText) {
            // Search in product name
            const nameMatch = cardName.includes(searchText);
            // Search in description
            const descMatch = cardDesc.includes(searchText);
            // Search in category (e.g., "pcspeakers" matches "pc speakers")
            const categoryMatch = cardCategory.toLowerCase().includes(searchText.replace(/\s/g, ''));
            // Search in section header (find the parent section)
            const sectionHeader = card.closest('.grid')?.previousElementSibling?.querySelector('h2');
            const sectionText = sectionHeader ? sectionHeader.textContent.toLowerCase() : '';
            const sectionMatch = sectionText.includes(searchText);
            
            matchesSearch = nameMatch || descMatch || categoryMatch || sectionMatch;
        }
        
        if (matchesSearch && matchesCategory) { 
            card.style.display = 'flex'; 
            if (!firstVisibleCard) firstVisibleCard = card;
            visibleCount++; 
        } else { 
            card.style.display = 'none'; 
        }
    });
    
    // Also show/hide section headers based on visible cards
    document.querySelectorAll('.section-header').forEach(header => {
        const section = header.nextElementSibling;
        if (section && section.classList.contains('grid')) {
            const visibleCards = section.querySelectorAll('.card[style="display: flex;"], .card:not([style*="display: none"])');
            if (visibleCards.length === 0 && searchText) {
                header.style.display = 'none';
            } else {
                header.style.display = 'block';
            }
        }
    });
    
    const noResults = document.getElementById('noResults');
    if (noResults) {
        noResults.style.display = visibleCount === 0 && searchText ? 'block' : 'none';
    }
    
    // Auto-scroll to first visible product when searching
    if (searchText && firstVisibleCard) {
        setTimeout(() => {
            firstVisibleCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// ==========================================
// 8. GLOBAL UTILITIES & INITIALIZATION
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

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initCart();
    initChatbot();
    initAuthCheck();
    initJumiaAffiliateLinks();
    
    // ==========================================
    // NEW: Review Form Submission Logic
    // ==========================================
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const product = document.getElementById('reviewProduct').value;
            const author = document.getElementById('reviewAuthor').value;
            const rating = document.getElementById('reviewRating').value;
            const comment = document.getElementById('reviewComment').value;
            const msgBox = document.getElementById('reviewMessage');

            try {
                const res = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productName: product, author, rating, comment })
                });
                const data = await res.json();
                
                if (res.ok) {
                    msgBox.textContent = '✅ ' + data.message;
                    msgBox.style.color = 'green';
                    reviewForm.reset();
                } else {
                    msgBox.textContent = '❌ ' + data.error;
                    msgBox.style.color = 'red';
                }
            } catch (error) {
                msgBox.textContent = '❌ Network error.';
                msgBox.style.color = 'red';
            }
        });
    }
    // ==========================================
    
    // Search and Filter Event Listeners
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }

    // *** CRUCIAL FIX: Sync Top Navigation Search with Main Search ***
    const navSearchInput = document.getElementById('navSearchInput');
    if (navSearchInput) {
        navSearchInput.addEventListener('input', function() {
            const mainSearchInput = document.getElementById('searchInput');
            if (mainSearchInput) {
                mainSearchInput.value = this.value;
                filterProducts();
            }
        });
    }
    
    // Modal click-outside-to-close listeners
    const footerModal = document.getElementById('footerModal');
    if (footerModal) {
        footerModal.addEventListener('click', function(e) { 
            if (e.target === this) closeModal(); 
        });
    }

    const bundleModal = document.getElementById('bundleModal');
    if (bundleModal) {
        bundleModal.addEventListener('click', function(e) { 
            if (e.target === this) closeBundleModal(); 
        });
    }

    // ESC key to close modals
    document.addEventListener('keydown', function(e) { 
        if (e.key === 'Escape') { 
            closeModal(); 
            closeBundleModal(); 
        } 
    });
});