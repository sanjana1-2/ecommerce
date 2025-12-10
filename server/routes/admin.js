const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Dashboard stats
router.get('/dashboard', auth, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;
    const recentOrders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(5);
    res.json({ stats: { totalUsers, totalProducts, totalOrders, pendingOrders, totalRevenue }, recentOrders });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role
router.put('/users/:id/role', auth, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product
router.delete('/products/:id', auth, isAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Seed Flipkart-style data
router.post('/seed', async (req, res) => {
  try {
    await Category.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    // Create Flipkart-style categories
    const categories = await Category.insertMany([
      { name: 'Mobiles', slug: 'mobiles', description: 'Smartphones & Accessories', image: 'https://rukminim2.flixcart.com/flap/80/80/image/22fddf3c7da4c4f4.png?q=100' },
      { name: 'Electronics', slug: 'electronics', description: 'TV, Laptops, Cameras', image: 'https://rukminim2.flixcart.com/flap/80/80/image/69c6589653afdb9a.png?q=100' },
      { name: 'Fashion', slug: 'fashion', description: 'Clothing, Footwear, Watches', image: 'https://rukminim2.flixcart.com/flap/80/80/image/c12afc017e6f24cb.png?q=100' },
      { name: 'Home & Furniture', slug: 'home-furniture', description: 'Furniture, Decor, Kitchen', image: 'https://rukminim2.flixcart.com/flap/80/80/image/ab7e2b022a4587dd.jpg?q=100' },
      { name: 'Appliances', slug: 'appliances', description: 'AC, Refrigerator, Washing Machine', image: 'https://rukminim2.flixcart.com/flap/80/80/image/0ff199d1bd27eb98.png?q=100' },
      { name: 'Beauty', slug: 'beauty', description: 'Makeup, Skincare, Perfumes', image: 'https://rukminim2.flixcart.com/flap/80/80/image/dff3f7adcf3a90c6.png?q=100' },
      { name: 'Grocery', slug: 'grocery', description: 'Staples, Snacks, Beverages', image: 'https://rukminim2.flixcart.com/flap/80/80/image/29327f40e9c4d26b.png?q=100' },
      { name: 'Toys & Baby', slug: 'toys-baby', description: 'Toys, Baby Care, Kids', image: 'https://rukminim2.flixcart.com/flap/80/80/image/fd4d9d0b1c1e7b52.png?q=100' }
    ]);

    const [mobiles, electronics, fashion, home, appliances, beauty, grocery, toys] = categories;

    // Create 50+ Flipkart-style products
    const products = [
      // MOBILES (10 products)
      { name: 'iPhone 15 Pro Max 256GB', description: 'Apple iPhone 15 Pro Max with A17 Pro chip, 48MP camera, titanium design, USB-C, Action button.', price: 159900, originalPrice: 179900, category: mobiles._id, images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400'], stock: 25, rating: 4.7, numReviews: 2341, brand: 'Apple', isFeatured: true },
      { name: 'Samsung Galaxy S24 Ultra 512GB', description: 'Samsung flagship with S Pen, 200MP camera, Snapdragon 8 Gen 3, AI features, titanium frame.', price: 134999, originalPrice: 149999, category: mobiles._id, images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400'], stock: 30, rating: 4.6, numReviews: 1892, brand: 'Samsung', isFeatured: true },
      { name: 'OnePlus 12 256GB', description: 'OnePlus 12 with Snapdragon 8 Gen 3, Hasselblad camera, 100W charging, 5400mAh battery.', price: 64999, originalPrice: 69999, category: mobiles._id, images: ['https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400'], stock: 50, rating: 4.5, numReviews: 3421, brand: 'OnePlus', isFeatured: true },
      { name: 'Redmi Note 13 Pro+ 5G', description: 'Redmi Note 13 Pro+ with 200MP camera, 120W charging, AMOLED display, MediaTek Dimensity.', price: 29999, originalPrice: 34999, category: mobiles._id, images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'], stock: 100, rating: 4.3, numReviews: 8923, brand: 'Xiaomi' },
      { name: 'Realme GT 5 Pro', description: 'Realme GT 5 Pro with Snapdragon 8 Gen 3, 50MP Sony camera, 100W charging.', price: 39999, originalPrice: 44999, category: mobiles._id, images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400'], stock: 45, rating: 4.4, numReviews: 2134, brand: 'Realme' },
      { name: 'Vivo V30 Pro 5G', description: 'Vivo V30 Pro with ZEISS camera, Aura Light, 5000mAh battery, curved AMOLED display.', price: 46999, originalPrice: 51999, category: mobiles._id, images: ['https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400'], stock: 35, rating: 4.3, numReviews: 1567, brand: 'Vivo' },
      { name: 'POCO F6 5G 256GB', description: 'POCO F6 with Snapdragon 8s Gen 3, 90W charging, 6.67" AMOLED, Liquidcool 4.0.', price: 29999, originalPrice: 32999, category: mobiles._id, images: ['https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400'], stock: 80, rating: 4.4, numReviews: 4521, brand: 'POCO' },
      { name: 'Nothing Phone (2a)', description: 'Nothing Phone 2a with Glyph Interface, MediaTek Dimensity 7200, 50MP dual camera.', price: 23999, originalPrice: 27999, category: mobiles._id, images: ['https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400'], stock: 60, rating: 4.2, numReviews: 2890, brand: 'Nothing' },
      { name: 'Google Pixel 8 Pro', description: 'Google Pixel 8 Pro with Tensor G3, 50MP camera, 7 years updates, AI features.', price: 106999, originalPrice: 119999, category: mobiles._id, images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400'], stock: 20, rating: 4.6, numReviews: 1234, brand: 'Google' },
      { name: 'Motorola Edge 50 Pro', description: 'Motorola Edge 50 Pro with 125W charging, 50MP OIS camera, pOLED display.', price: 31999, originalPrice: 36999, category: mobiles._id, images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'], stock: 40, rating: 4.3, numReviews: 987, brand: 'Motorola' },

      // ELECTRONICS (10 products)
      { name: 'Sony Bravia 55" 4K Smart TV', description: 'Sony 55 inch 4K Ultra HD Smart LED Google TV with Dolby Vision, TRILUMINOS PRO.', price: 69990, originalPrice: 99990, category: electronics._id, images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400'], stock: 15, rating: 4.5, numReviews: 2341, brand: 'Sony', isFeatured: true },
      { name: 'MacBook Air M3 15"', description: 'Apple MacBook Air 15" with M3 chip, 8GB RAM, 256GB SSD, 18hr battery, Liquid Retina.', price: 134900, originalPrice: 144900, category: electronics._id, images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'], stock: 20, rating: 4.8, numReviews: 1567, brand: 'Apple', isFeatured: true },
      { name: 'HP Pavilion Gaming Laptop', description: 'HP Pavilion Gaming with RTX 4050, Intel i5-13th Gen, 16GB RAM, 512GB SSD, 144Hz.', price: 74990, originalPrice: 89990, category: electronics._id, images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400'], stock: 25, rating: 4.4, numReviews: 3421, brand: 'HP' },
      { name: 'Canon EOS R50 Mirrorless Camera', description: 'Canon EOS R50 with 24.2MP, 4K video, Dual Pixel CMOS AF, vlogging camera.', price: 75990, originalPrice: 85990, category: electronics._id, images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400'], stock: 12, rating: 4.6, numReviews: 892, brand: 'Canon' },
      { name: 'Sony WH-1000XM5 Headphones', description: 'Sony premium wireless noise cancelling headphones with 30hr battery, Hi-Res Audio.', price: 29990, originalPrice: 34990, category: electronics._id, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'], stock: 40, rating: 4.7, numReviews: 5678, brand: 'Sony', isFeatured: true },
      { name: 'Apple AirPods Pro 2nd Gen', description: 'AirPods Pro with H2 chip, Active Noise Cancellation, Adaptive Audio, USB-C.', price: 24900, originalPrice: 26900, category: electronics._id, images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400'], stock: 60, rating: 4.6, numReviews: 8934, brand: 'Apple' },
      { name: 'JBL Flip 6 Bluetooth Speaker', description: 'JBL Flip 6 portable speaker with IP67 waterproof, 12hr playtime, PartyBoost.', price: 9999, originalPrice: 14999, category: electronics._id, images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400'], stock: 80, rating: 4.5, numReviews: 12456, brand: 'JBL' },
      { name: 'Apple Watch Series 9 GPS', description: 'Apple Watch Series 9 with S9 chip, Double Tap gesture, bright display, health features.', price: 41900, originalPrice: 44900, category: electronics._id, images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400'], stock: 35, rating: 4.7, numReviews: 3456, brand: 'Apple' },
      { name: 'Samsung Galaxy Tab S9 FE', description: 'Samsung Tab S9 FE with S Pen, 10.9" display, IP68, One UI 5.1, 8GB RAM.', price: 44999, originalPrice: 54999, category: electronics._id, images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'], stock: 25, rating: 4.4, numReviews: 1234, brand: 'Samsung' },
      { name: 'Logitech MX Master 3S Mouse', description: 'Logitech MX Master 3S wireless mouse with 8K DPI, quiet clicks, USB-C, multi-device.', price: 9995, originalPrice: 11995, category: electronics._id, images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'], stock: 50, rating: 4.6, numReviews: 2345, brand: 'Logitech' },

      // FASHION (12 products)
      { name: 'Levi\'s Men Slim Fit Jeans', description: 'Levi\'s 511 Slim Fit Jeans in dark indigo wash, stretch denim, classic 5-pocket.', price: 2499, originalPrice: 4299, category: fashion._id, images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'], stock: 150, rating: 4.3, numReviews: 8923, brand: 'Levi\'s', isFeatured: true },
      { name: 'Nike Air Max 270 Sneakers', description: 'Nike Air Max 270 with Max Air unit, breathable mesh, iconic design, all-day comfort.', price: 12995, originalPrice: 15995, category: fashion._id, images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'], stock: 80, rating: 4.6, numReviews: 5678, brand: 'Nike', isFeatured: true },
      { name: 'Allen Solly Formal Shirt', description: 'Allen Solly Men\'s Regular Fit formal shirt, cotton blend, spread collar, full sleeves.', price: 1299, originalPrice: 2199, category: fashion._id, images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400'], stock: 200, rating: 4.2, numReviews: 12345, brand: 'Allen Solly' },
      { name: 'Zara Women Floral Dress', description: 'Zara floral print midi dress, V-neck, puff sleeves, flowy fit, perfect for occasions.', price: 3990, originalPrice: 5990, category: fashion._id, images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400'], stock: 100, rating: 4.4, numReviews: 3456, brand: 'Zara', isFeatured: true },
      { name: 'Puma Running Shoes Men', description: 'Puma Velocity Nitro 2 running shoes with NITRO foam, breathable mesh, responsive.', price: 8999, originalPrice: 11999, category: fashion._id, images: ['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400'], stock: 90, rating: 4.5, numReviews: 4567, brand: 'Puma' },
      { name: 'H&M Women Kurti Set', description: 'H&M ethnic kurti set with palazzo pants, cotton fabric, embroidered, festive wear.', price: 1999, originalPrice: 3499, category: fashion._id, images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400'], stock: 120, rating: 4.3, numReviews: 6789, brand: 'H&M' },
      { name: 'Fossil Men Chronograph Watch', description: 'Fossil Grant Chronograph watch, stainless steel, Roman numerals, leather strap.', price: 9995, originalPrice: 14995, category: fashion._id, images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400'], stock: 40, rating: 4.5, numReviews: 2345, brand: 'Fossil' },
      { name: 'Ray-Ban Aviator Sunglasses', description: 'Ray-Ban Aviator Classic sunglasses, gold frame, green G-15 lenses, iconic style.', price: 8490, originalPrice: 9990, category: fashion._id, images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400'], stock: 60, rating: 4.6, numReviews: 5678, brand: 'Ray-Ban' },
      { name: 'Wildcraft Backpack 35L', description: 'Wildcraft laptop backpack, 35L capacity, rain cover, multiple compartments, padded.', price: 1899, originalPrice: 2999, category: fashion._id, images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'], stock: 100, rating: 4.4, numReviews: 8901, brand: 'Wildcraft' },
      { name: 'Adidas Track Pants Men', description: 'Adidas Essentials 3-Stripes track pants, cotton blend, elastic waist, side pockets.', price: 2499, originalPrice: 3499, category: fashion._id, images: ['https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400'], stock: 150, rating: 4.3, numReviews: 7890, brand: 'Adidas' },
      { name: 'Biba Women Saree', description: 'Biba silk blend saree with blouse piece, traditional design, festive collection.', price: 2999, originalPrice: 5999, category: fashion._id, images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400'], stock: 80, rating: 4.4, numReviews: 3456, brand: 'Biba' },
      { name: 'US Polo T-Shirt Men', description: 'US Polo Assn. polo t-shirt, cotton pique, embroidered logo, classic fit.', price: 999, originalPrice: 1799, category: fashion._id, images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'], stock: 200, rating: 4.2, numReviews: 15678, brand: 'US Polo' },

      // HOME & FURNITURE (8 products)
      { name: 'Wakefit Orthopedic Mattress', description: 'Wakefit Orthopaedic Memory Foam Mattress, 6 inch, medium firm, 10 year warranty.', price: 8999, originalPrice: 16999, category: home._id, images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400'], stock: 30, rating: 4.4, numReviews: 23456, brand: 'Wakefit', isFeatured: true },
      { name: 'Nilkamal Plastic Chair Set', description: 'Nilkamal CHR 2005 plastic chair set of 4, stackable, weather resistant, durable.', price: 2999, originalPrice: 4499, category: home._id, images: ['https://images.unsplash.com/photo-1503602642458-232111445657?w=400'], stock: 50, rating: 4.2, numReviews: 8901, brand: 'Nilkamal' },
      { name: 'Prestige Induction Cooktop', description: 'Prestige PIC 20 induction cooktop, 1200W, push button, Indian menu, auto voltage.', price: 1999, originalPrice: 2999, category: home._id, images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'], stock: 80, rating: 4.3, numReviews: 12345, brand: 'Prestige' },
      { name: 'Solimo Bedsheet Set', description: 'Amazon Solimo 100% cotton bedsheet with 2 pillow covers, 144 TC, queen size.', price: 599, originalPrice: 1299, category: home._id, images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400'], stock: 200, rating: 4.1, numReviews: 34567, brand: 'Solimo' },
      { name: 'Urban Ladder Coffee Table', description: 'Urban Ladder Malabar coffee table, solid wood, walnut finish, storage shelf.', price: 12999, originalPrice: 18999, category: home._id, images: ['https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=400'], stock: 15, rating: 4.5, numReviews: 1234, brand: 'Urban Ladder' },
      { name: 'Pigeon Pressure Cooker 5L', description: 'Pigeon by Stovekraft pressure cooker, 5 litre, aluminium, induction base.', price: 1299, originalPrice: 2199, category: home._id, images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=400'], stock: 100, rating: 4.3, numReviews: 45678, brand: 'Pigeon' },
      { name: 'Curtain Set 2 Piece', description: 'Cortina polyester curtain set, 7 feet, blackout, eyelet, solid color.', price: 799, originalPrice: 1499, category: home._id, images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400'], stock: 150, rating: 4.2, numReviews: 8901, brand: 'Cortina' },
      { name: 'Godrej Interio Study Table', description: 'Godrej Interio study table with storage, engineered wood, modern design.', price: 7999, originalPrice: 11999, category: home._id, images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400'], stock: 25, rating: 4.4, numReviews: 2345, brand: 'Godrej' },

      // APPLIANCES (8 products)
      { name: 'LG 1.5 Ton 5 Star AC', description: 'LG 1.5 Ton 5 Star AI Dual Inverter Split AC, 4-in-1 convertible, HD filter.', price: 46990, originalPrice: 62990, category: appliances._id, images: ['https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400'], stock: 20, rating: 4.5, numReviews: 5678, brand: 'LG', isFeatured: true },
      { name: 'Samsung 253L Refrigerator', description: 'Samsung 253L 3 Star Frost Free Double Door Refrigerator, Digital Inverter.', price: 26990, originalPrice: 34990, category: appliances._id, images: ['https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400'], stock: 25, rating: 4.4, numReviews: 8901, brand: 'Samsung' },
      { name: 'IFB 6.5 Kg Washing Machine', description: 'IFB 6.5 Kg 5 Star Fully Automatic Front Load Washing Machine, Aqua Energie.', price: 24990, originalPrice: 32990, category: appliances._id, images: ['https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400'], stock: 18, rating: 4.3, numReviews: 4567, brand: 'IFB' },
      { name: 'Philips Air Fryer HD9252', description: 'Philips Air Fryer HD9252, 4.1L, Rapid Air Technology, touch screen, 1400W.', price: 7999, originalPrice: 12995, category: appliances._id, images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=400'], stock: 40, rating: 4.5, numReviews: 12345, brand: 'Philips' },
      { name: 'Bajaj Water Heater 15L', description: 'Bajaj New Shakti Storage 15L Water Heater, glass lined tank, 4 star rated.', price: 6999, originalPrice: 9999, category: appliances._id, images: ['https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400'], stock: 35, rating: 4.2, numReviews: 6789, brand: 'Bajaj' },
      { name: 'Dyson V12 Vacuum Cleaner', description: 'Dyson V12 Detect Slim cordless vacuum, laser dust detection, 60 min runtime.', price: 52900, originalPrice: 58900, category: appliances._id, images: ['https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400'], stock: 15, rating: 4.7, numReviews: 1234, brand: 'Dyson' },
      { name: 'Kent RO Water Purifier', description: 'Kent Grand Plus RO+UV+UF water purifier, 8L storage, TDS controller.', price: 15999, originalPrice: 21999, category: appliances._id, images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=400'], stock: 30, rating: 4.3, numReviews: 8901, brand: 'Kent' },
      { name: 'Havells Mixer Grinder', description: 'Havells Silencio 500W mixer grinder, 3 jars, low noise, stainless steel blades.', price: 4499, originalPrice: 6495, category: appliances._id, images: ['https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400'], stock: 60, rating: 4.4, numReviews: 15678, brand: 'Havells' },

      // BEAUTY (6 products)
      { name: 'Lakme Absolute Makeup Kit', description: 'Lakme Absolute makeup kit with foundation, lipstick, mascara, eyeshadow palette.', price: 2499, originalPrice: 3999, category: beauty._id, images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400'], stock: 80, rating: 4.3, numReviews: 5678, brand: 'Lakme', isFeatured: true },
      { name: 'Forest Essentials Face Cream', description: 'Forest Essentials Soundarya Radiance Cream with 24K Gold, anti-aging, 50g.', price: 4975, originalPrice: 5875, category: beauty._id, images: ['https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?w=400'], stock: 40, rating: 4.6, numReviews: 2345, brand: 'Forest Essentials' },
      { name: 'Maybelline Fit Me Foundation', description: 'Maybelline Fit Me Matte + Poreless foundation, oil-free, natural finish, SPF 22.', price: 499, originalPrice: 699, category: beauty._id, images: ['https://images.unsplash.com/photo-1631730486572-226d1f595b68?w=400'], stock: 150, rating: 4.2, numReviews: 23456, brand: 'Maybelline' },
      { name: 'Philips Hair Dryer', description: 'Philips HP8120 hair dryer, 1200W, ThermoProtect, 3 heat settings, foldable.', price: 1095, originalPrice: 1595, category: beauty._id, images: ['https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400'], stock: 100, rating: 4.3, numReviews: 34567, brand: 'Philips' },
      { name: 'Nivea Men Grooming Kit', description: 'Nivea Men grooming kit with face wash, moisturizer, deodorant, lip balm.', price: 599, originalPrice: 999, category: beauty._id, images: ['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400'], stock: 120, rating: 4.1, numReviews: 8901, brand: 'Nivea' },
      { name: 'MAC Ruby Woo Lipstick', description: 'MAC Retro Matte Lipstick Ruby Woo, iconic red, long-lasting, matte finish.', price: 1950, originalPrice: 2100, category: beauty._id, images: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400'], stock: 60, rating: 4.7, numReviews: 12345, brand: 'MAC' },

      // GROCERY (4 products)
      { name: 'Tata Sampann Dals Combo', description: 'Tata Sampann unpolished dals combo pack, toor dal, moong dal, chana dal, 1kg each.', price: 399, originalPrice: 549, category: grocery._id, images: ['https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400'], stock: 200, rating: 4.4, numReviews: 8901, brand: 'Tata' },
      { name: 'Aashirvaad Atta 10kg', description: 'Aashirvaad Superior MP Atta, 100% whole wheat, soft rotis, 10kg pack.', price: 449, originalPrice: 520, category: grocery._id, images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'], stock: 150, rating: 4.5, numReviews: 45678, brand: 'Aashirvaad' },
      { name: 'Cadbury Celebrations Pack', description: 'Cadbury Celebrations chocolate gift pack, assorted chocolates, 150g.', price: 249, originalPrice: 299, category: grocery._id, images: ['https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400'], stock: 300, rating: 4.6, numReviews: 23456, brand: 'Cadbury' },
      { name: 'Nescafe Gold Coffee 200g', description: 'Nescafe Gold Rich and Smooth instant coffee, 100% arabica, premium blend.', price: 699, originalPrice: 850, category: grocery._id, images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400'], stock: 100, rating: 4.4, numReviews: 12345, brand: 'Nescafe' },

      // TOYS & BABY (4 products)
      { name: 'LEGO City Police Set', description: 'LEGO City Police Station building set, 668 pieces, ages 6+, minifigures included.', price: 4999, originalPrice: 6999, category: toys._id, images: ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400'], stock: 40, rating: 4.7, numReviews: 2345, brand: 'LEGO', isFeatured: true },
      { name: 'Pampers Diapers Pack', description: 'Pampers All Round Protection pants, large size, 64 count, up to 12hr dryness.', price: 1099, originalPrice: 1399, category: toys._id, images: ['https://images.unsplash.com/photo-1584839404042-8bc21d240e63?w=400'], stock: 150, rating: 4.4, numReviews: 34567, brand: 'Pampers' },
      { name: 'Hot Wheels Track Set', description: 'Hot Wheels Ultimate Garage track set, stores 100+ cars, motorized, ages 5+.', price: 7999, originalPrice: 9999, category: toys._id, images: ['https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=400'], stock: 25, rating: 4.5, numReviews: 3456, brand: 'Hot Wheels' },
      { name: 'Johnson Baby Care Set', description: 'Johnson\'s Baby care gift set, shampoo, lotion, powder, oil, soap, gentle formula.', price: 599, originalPrice: 799, category: toys._id, images: ['https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400'], stock: 100, rating: 4.3, numReviews: 8901, brand: 'Johnson\'s' }
    ];

    await Product.insertMany(products);

    // Create admin users - Use environment variables for credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@shopkart.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'changeThisPassword123!';
    
    const users = await User.create([
      { name: 'Admin', email: adminEmail, password: adminPassword, role: 'admin' }
    ]);

    const [adminUser, sanjanaUser] = users;

    // Assign some products to Sanjana as seller
    const sanjanaProducts = products.slice(0, 15); // First 15 products
    sanjanaProducts.forEach(product => {
      product.seller = sanjanaUser._id;
    });

    // Assign remaining products to admin
    const adminProducts = products.slice(15);
    adminProducts.forEach(product => {
      product.seller = adminUser._id;
    });

    res.json({ message: `Data seeded! ${categories.length} categories, ${products.length} products (15 for Sanjana), 2 admin users` });
  } catch (error) {
    res.status(500).json({ message: 'Seed error', error: error.message });
  }
});

module.exports = router;
