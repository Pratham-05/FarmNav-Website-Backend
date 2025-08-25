const productModel = require('../models/productModel');

const getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const products = await productModel.getAllProducts(category);
    
    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

const getProductDetails = async (req, res) => {
  try {
    const product = await productModel.getProductById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product details',
      error: error.message
    });
  }
};

module.exports = {
  getProducts,
  getProductDetails
};