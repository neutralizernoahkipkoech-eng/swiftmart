const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// 1. LOAD ENVIRONMENT VARIABLES FIRST!
dotenv.config();

const axios = require('axios');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// 2. NOW initialize Paystack
const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);

// Import Models
const User = require('./models/User');
const Order = require('./models/Order');
const Product = require('./models/Product');
const Review = require('./models/Review');

const app = express();
const PORT = process.env.PORT || 3000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// --- EMAIL TRANSPORTER SETUP ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendOrderEmail(customerEmail, productName, amount, paymentMethod, status) {
    const mailOptions = {
        from: `"SwiftMart" <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        subject: `Order Confirmation - SwiftMart`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">🛍️ SwiftMart</h1>
                </div>
                <div style="padding: 30px;">
                    <h2 style="color: #0f172a;">Thank you for your purchase!</h2>
                    <p>Hi there,</p>
                    <p>Thank you for your purchase! <strong>Since this is a digital service, our team will contact you within 24 hours</strong> via the email or phone number you provided to get started.</p>
                    <p>Here are your order details:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr style="background: #f8fafc;">
                            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Product</td>
                            <td style="padding: 12px; border: 1px solid #e2e8f0;">${productName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Amount</td>
                            <td style="padding: 12px; border: 1px solid #e2e8f0;">KES ${amount}</td>
                        </tr>
                        <tr style="background: #f8fafc;">
                            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Payment Method</td>
                            <td style="padding: 12px; border: 1px solid #e2e8f0;">${paymentMethod}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Status</td>
                            <td style="padding: 12px; border: 1px solid #e2e8f0; color: green; font-weight: bold;">${status.toUpperCase()}</td>
                        </tr>
                    </table>
                    <p>Best regards,<br><strong>The SwiftMart Team</strong></p>
                </div>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${customerEmail}`);
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
    }
}

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mpesa-ecommerce')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Reliable Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'super-secret-key-change-this-later',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'frontend')));

// M-Pesa Configuration
const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const SHORTCODE = process.env.SHORTCODE;
const PASSKEY = process.env.PASSKEY;
const CALLBACK_URL = process.env.CALLBACK_URL;

async function getAccessToken() {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    try {
        const response = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            { headers: { Authorization: `Basic ${auth}` } }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error.message);
        return null;
    }
}

const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Please log in to continue' });
    }
};

// ================= AUTH ROUTES =================

// REGISTER
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || !email || !phone || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email already registered' });
        
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        const user = new User({ 
            name, email, phone, password, 
            emailVerificationToken: verificationToken,
            emailVerified: false
        });
        await user.save();
        
        const verificationUrl = `${process.env.BASE_URL || 'https://swiftmartkenya.co.ke'}/api/auth/verify-email?token=${verificationToken}`;
        try {
            await transporter.sendMail({
                from: `"SwiftMart" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Verify Your SwiftMart Account',
                html: `<h2>Welcome to SwiftMart! 👋</h2><p>Please click below to verify your email:</p><a href="${verificationUrl}" style="display:inline-block; padding:12px 24px; background:#2563eb; color:white; text-decoration:none; border-radius:6px;">Verify Email</a><p>Link expires in 24 hours.</p>`
            });
        } catch (emailError) {
            console.error('Email send error:', emailError);
        }
        
        res.status(201).json({ success: true, message: 'Registration successful! Please check your email to verify.', user: { name: user.name, email: user.email } });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });
        
        if (!user.emailVerified) {
            return res.status(403).json({ error: 'Please verify your email before logging in. Check your inbox.' });
        }
        
        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: rememberMe ? '30d' : '1d' });
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
        });
        
        req.session.userId = user._id;
        res.json({ success: true, user: { name: user.name, email: user.email } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// FORGOT PASSWORD
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.json({ message: 'If an account exists, a reset link has been sent.' });
        
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 3600000;
        await user.save();
        
        const resetUrl = `${process.env.BASE_URL || 'https://swiftmartkenya.co.ke'}/reset-password?token=${resetToken}`;
        try {
            await transporter.sendMail({
                from: `"SwiftMart" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Reset Your SwiftMart Password',
                html: `<h2>Password Reset Request 🔐</h2><p>Click below to reset your password:</p><a href="${resetUrl}" style="display:inline-block; padding:12px 24px; background:#2563eb; color:white; text-decoration:none; border-radius:6px;">Reset Password</a><p>Link expires in 1 hour.</p>`
            });
            res.json({ message: 'Password reset link sent to your email' });
        } catch (emailError) {
            res.status(500).json({ message: 'Failed to send email.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// RESET PASSWORD
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });
        
        user.password = newPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();
        res.json({ message: 'Password reset successful! Please login.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// VERIFY EMAIL
app.get('/api/auth/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        const user = await User.findOne({ emailVerificationToken: token });
        if (!user) return res.status(400).json({ message: 'Invalid verification token' });
        
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save();
        res.json({ message: 'Email verified successfully! You can now login.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// LOGOUT
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    req.session.destroy();
    res.json({ success: true });
});

// GET CURRENT USER
app.get('/api/auth/me', async (req, res) => {
    let userId = req.session.userId;
    if (!userId && req.cookies.token) {
        try {
            const decoded = jwt.verify(req.cookies.token, JWT_SECRET);
            userId = decoded.userId;
            req.session.userId = userId;
        } catch (err) { /* Invalid token */ }
    }
    if (!userId) return res.json({ user: null });
    const user = await User.findById(userId).select('-password');
    res.json({ user });
});

// ================= GOOGLE OAUTH ROUTES (NEW) =================

app.get('/api/auth/google', (req, res) => {
    const redirectUri = process.env.NODE_ENV === 'production' 
        ? 'https://swiftmartkenya.co.ke/api/auth/google/callback' 
        : 'http://localhost:3000/api/auth/google/callback';
        
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=profile email`;
    res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        const redirectUri = process.env.NODE_ENV === 'production' 
            ? 'https://swiftmartkenya.co.ke/api/auth/google/callback' 
            : 'http://localhost:3000/api/auth/google/callback';

        // 1. Exchange code for tokens
        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        });

        // 2. Get user info from Google
        const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
        });
        const googleUser = userRes.data;

        // 3. Find or create user in database
        let user = await User.findOne({ email: googleUser.email });
        if (!user) {
            user = new User({
                name: googleUser.name,
                email: googleUser.email,
                phone: 'N/A',
                password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
                emailVerified: true
            });
            await user.save();
        }

        // 4. Log the user in
        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 * 1000 });
        req.session.userId = user._id;
        
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.redirect('/login?error=google_failed');
    }
});

// ================= M-PESA & ORDER ROUTES =================

// STK Push
app.post('/api/stkpush', requireAuth, async (req, res) => {
    try {
        const { phoneNumber, amount, productName } = req.body;
        const accessToken = await getAccessToken();
        if (!accessToken) return res.status(500).json({ error: 'Failed to authenticate with M-Pesa' });

        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
        const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');
        const safeReference = "SWIFTMART"; 

        const stkPushData = {
            BusinessShortCode: SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phoneNumber,
            PartyB: SHORTCODE,
            PhoneNumber: phoneNumber,
            CallBackURL: CALLBACK_URL,
            AccountReference: safeReference,
            TransactionDesc: "Payment"
        };

        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            stkPushData,
            { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
        );
        
        const checkoutRequestId = response.data.CheckoutRequestID;

        const order = new Order({
            user: req.session.userId,
            checkoutRequestId,
            product: productName || 'Item',
            amount,
            phone: phoneNumber,
            paymentMethod: 'M-Pesa',
            status: 'pending'
        });
        await order.save();

        res.json(response.data);
    } catch (error) {
        const safaricomError = error.response ? error.response.data : error.message;
        console.error('STK Push Error:', safaricomError);
        res.status(500).json({ error: safaricomError });
    }
});

app.post('/api/callback', async (req, res) => {
    try {
        const callbackData = req.body;
        console.log('--- M-Pesa Callback Received ---');
        const { Body } = callbackData;
        if (Body && Body.stkCallback) {
            const { CheckoutRequestID, ResultCode, CallbackMetadata } = Body.stkCallback;
            const order = await Order.findOne({ checkoutRequestId: CheckoutRequestID });
            if (order) {
                order.status = ResultCode === 0 ? 'success' : 'failed';
                if (ResultCode === 0 && CallbackMetadata && CallbackMetadata.Item) {
                    const receiptItem = CallbackMetadata.Item.find(i => i.Name === 'MpesaReceiptNumber');
                    if (receiptItem) order.mpesaReceiptNumber = receiptItem.Value;
                }
                await order.save();
                console.log(`Order updated: ${order.status}`);
            }
        }
        res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (error) {
        console.error('Callback error:', error);
        res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }
});

app.get('/api/status/:id', async (req, res) => {
    try {
        const order = await Order.findOne({ checkoutRequestId: req.params.id });
        if (!order) return res.status(404).json({ error: 'Transaction not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get status' });
    }
});

app.get('/api/orders', requireAuth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.session.userId }).sort({ createdAt: -1 });
        res.json({ orders });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get orders' });
    }
});

// ================= PAYSTACK GLOBAL PAYMENT ROUTES =================
app.post('/api/paystack/initialize', async (req, res) => {
    try {
        const { email, amount, productName } = req.body;
        const amountInCents = amount * 100; 
        const response = await paystack.transaction.initialize({
            email: email,
            amount: amountInCents,
            reference: 'SWIFTMART_' + Math.floor(Math.random() * 1000000000),
            metadata: { custom_fields: [{ display_name: "Product", variable_name: "product", value: productName }] }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Paystack Initialize Error:', error);
        res.status(500).json({ error: 'Payment initialization failed' });
    }
});

app.get('/api/paystack/verify/:reference', async (req, res) => {
    try {
        const response = await paystack.transaction.verify(req.params.reference);
        if (response.data.status === 'success') {
            const customerEmail = response.data.customer.email;
            const amount = response.data.amount / 100;
            const product = response.data.metadata.custom_fields[0].value;
            
            const newOrder = new Order({
                user: req.session.userId || null,
                product: product,
                amount: amount,
                phone: 'N/A',
                email: customerEmail,
                paymentMethod: 'Paystack',
                status: 'success'
            });
            await newOrder.save();
            sendOrderEmail(customerEmail, product, amount, 'Paystack (Card/PayPal)', 'success');
            res.json({ status: 'success', message: 'Payment verified!' });
        } else {
            res.json({ status: 'failed' });
        }
    } catch (error) {
        console.error('Paystack Verify Error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// ================= ADMIN ROUTES =================
app.get('/api/admin/orders', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user || user.email !== 'neutralizernoahkipkoech@gmail.com') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json({ orders });
    } catch (error) {
        console.error('Admin orders error:', error);
        res.status(500).json({ error: 'Failed to get orders' });
    }
});

// ================= INVENTORY MANAGEMENT ROUTES =================
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json({ products });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get products' });
    }
});

app.put('/api/admin/products/:id/stock', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user || user.email !== 'neutralizernoahkipkoech@gmail.com') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { stock } = req.body;
        const product = await Product.findByIdAndUpdate(req.params.id, { stock }, { returnDocument: 'after' });
        
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ success: true, product });
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

app.get('/api/seed-products', async (req, res) => {
    try {
        const initialProducts = [
            { name: 'E-commerce Store Setup', category: 'webdev', price: 25000, stock: 99 },
            { name: 'Website Maintenance & Support', category: 'webdev', price: 3000, stock: 99 },
            { name: 'Domain & Hosting Setup', category: 'webdev', price: 2500, stock: 99 },
            { name: 'Professional Web Design', category: 'services', price: 15000, stock: 99 },
            { name: 'Logo & Graphic Design', category: 'services', price: 5000, stock: 99 },
            { name: 'Business Consultation', category: 'services', price: 3000, stock: 99 },
            { name: 'SEO & Digital Marketing', category: 'services', price: 8000, stock: 99 },
            { name: 'Social Media Page Setup', category: 'socialmedia', price: 6000, stock: 99 },
            { name: 'Monthly Social Media Management', category: 'socialmedia', price: 12000, stock: 99 },
            { name: 'Custom Social Media Graphics (10 Posts)', category: 'socialmedia', price: 8000, stock: 99 },
            { name: 'iPhone 13 Pro', category: 'smartphones', price: 95000, stock: 5 },
            { name: 'Samsung Galaxy S22', category: 'smartphones', price: 78000, stock: 8 },
            { name: 'iPad Air', category: 'smartphones', price: 65000, stock: 12 },
            { name: 'MacBook Air M2', category: 'laptops', price: 115000, stock: 3 },
            { name: 'Dell XPS 13', category: 'laptops', price: 98000, stock: 4 },
            { name: 'HP Pavilion 15', category: 'laptops', price: 52000, stock: 10 },
            { name: 'Sony WH-1000XM5', category: 'audio', price: 32000, stock: 15 },
            { name: 'AirPods Pro 2', category: 'audio', price: 24000, stock: 20 },
            { name: 'JBL Flip 6', category: 'audio', price: 12000, stock: 25 },
            { name: 'Logitech MX Master 3', category: 'accessories', price: 8500, stock: 30 },
            { name: 'Mechanical Keyboard', category: 'accessories', price: 7200, stock: 20 },
            { name: 'Logitech C920', category: 'accessories', price: 9500, stock: 15 },
            { name: '27-inch 4K Monitor', category: 'accessories', price: 35000, stock: 7 },
            { name: 'Classic Leather Watch', category: 'fashion', price: 3500, stock: 50 },
            { name: 'Nike Air Max', category: 'fashion', price: 8500, stock: 40 },
            { name: 'Leather Backpack', category: 'fashion', price: 4500, stock: 35 },
            { name: 'Polarized Sunglasses', category: 'fashion', price: 1800, stock: 60 },
            { name: 'Electric Blender', category: 'home', price: 4200, stock: 25 },
            { name: 'Coffee Maker', category: 'home', price: 6500, stock: 18 },
            { name: 'LED Desk Lamp', category: 'home', price: 2200, stock: 40 },
            { name: 'Hair Dryer', category: 'beauty', price: 3800, stock: 30 },
            { name: 'Electric Toothbrush', category: 'beauty', price: 2900, stock: 45 },
            { name: 'Fitness Tracker', category: 'beauty', price: 3200, stock: 35 }
        ];

        await Product.deleteMany({});
        await Product.insertMany(initialProducts);
        res.json({ message: '✅ Database seeded with all products!' });
    } catch (error) {
        res.status(500).json({ error: 'Seeding failed' });
    }
});

// ================= REVIEW ROUTES =================
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Review.find({ approved: true }).sort({ createdAt: -1 }).limit(10);
        res.json({ reviews });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ error: 'Failed to get reviews' });
    }
});

app.post('/api/reviews', async (req, res) => {
    try {
        const { productName, rating, comment, author } = req.body;
        const newReview = new Review({ productName, rating, comment, author });
        await newReview.save();
        res.json({ success: true, message: 'Review submitted! It will appear once approved.' });
    } catch (error) {
        console.error('Submit review error:', error);
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

app.get('/api/reviews/:productName', async (req, res) => {
    try {
        const reviews = await Review.find({ productName: req.params.productName, approved: true }).sort({ createdAt: -1 });
        res.json({ reviews });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get reviews' });
    }
});

app.get('/api/admin/reviews', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user || user.email !== 'neutralizernoahkipkoech@gmail.com') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json({ reviews });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get reviews' });
    }
});

app.put('/api/admin/reviews/:id/approve', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user || user.email !== 'neutralizernoahkipkoech@gmail.com') {
            return res.status(403).json({ error: 'Access denied' });
        }
        await Review.findByIdAndUpdate(req.params.id, { approved: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to approve review' });
    }
});

app.delete('/api/admin/reviews/:id', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user || user.email !== 'neutralizernoahkipkoech@gmail.com') {
            return res.status(403).json({ error: 'Access denied' });
        }
        await Review.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

// ================= FRONTEND ROUTES =================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'dashboard.html')));
app.get('/receipt.html', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'receipt.html')));

// SECURE ADMIN ROUTE: ONLY YOU CAN ACCESS THIS
app.get('/admin', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    try {
        const user = await User.findById(req.session.userId);
        if (!user || user.email !== 'neutralizernoahkipkoech@gmail.com') {
            return res.redirect('/'); 
        }
        res.sendFile(path.join(__dirname, 'frontend', 'admin.html'));
    } catch (error) {
        res.redirect('/');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});