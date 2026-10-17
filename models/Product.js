const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { 
        type: String, 
        required: true,
        enum: [
            'services', 
            'webdev', 
            'socialmedia', 
            'databundles', 
            'smartphones', 
            'tablets', 
            'laptops', 
            'audio', 
            'pcspeakers', 
            'accessories', 
            'fashion', 
            'watches', 
            'home', 
            'beauty', 
            'healthcare'
        ]
    },
    price: { type: Number, required: true },
    stock: { type: Number, default: 10 } // Default stock is 10
});

module.exports = mongoose.model('Product', productSchema);