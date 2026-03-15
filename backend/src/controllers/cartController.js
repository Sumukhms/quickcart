import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

export const addToCart = async (req,res) => {

  try{

    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);

    if(!product){
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    let cart = await Cart.findOne({ userId: req.user.userId });

    if(!cart){
      cart = new Cart({
        userId: req.user.userId,
        items: []
      });
    }

    if (cart.items.length > 0) {

    const existingProduct = await Product.findById(cart.items[0].productId);

    if (existingProduct.storeId.toString() !== product.storeId.toString()) {
      return res.status(400).json({
        message: "You can only add products from one store at a time"
      });
    }

}

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if(itemIndex > -1){
      cart.items[itemIndex].quantity += quantity;
    } 
    else{
      cart.items.push({
        productId,
        quantity
      });
    }

    await cart.save();

    res.status(200).json({
      message: 'Item added to cart',
      cart
    });

  }catch(err){

    res.status(500).json({
      message: 'Error adding to cart'
    });

  }

}

export const getCart = async (req,res) => {

  try{

    const cart = await Cart.findOne({
      userId: req.user.userId
    }).populate("items.productId");

    if(!cart){
      return res.status(200).json({
        items:[]
      });
    }

    res.status(200).json(cart);

  }catch(error){

    res.status(500).json({
      message:"Error fetching cart"
    });

  }

}