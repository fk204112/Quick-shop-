const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    price: { 
        type: Number, 
        required: true 
    },
    image: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    }
}, { 
    collection: 'product' // Yeh ensure karega ki Mongoose aapke Atlas wale 'product' collection se hi connect ho
});

module.exports = mongoose.model('Product', productSchema);