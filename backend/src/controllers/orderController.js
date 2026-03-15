import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

export const placeOrder = async (req,res) => {

  try{

    const { deliveryAddress } = req.body;

    const cart = await Cart.findOne({
      userId: req.user.userId
    });

    if(!cart || cart.items.length === 0){
      return res.status(400).json({
        message:"Cart is empty"
      });
    }

    let totalPrice = 0;
    let storeId = null;

    const orderItems = [];

    for(const item of cart.items){

      const product = await Product.findById(item.productId);

      if(!product){
        return res.status(404).json({
          message:"Product not found"
        });
      }

      totalPrice += product.price * item.quantity;

      storeId = product.storeId;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price
      });

    }

    const order = new Order({
      userId: req.user.userId,
      storeId,
      items: orderItems,
      totalPrice,
      deliveryAddress
    });

    await order.save();

    cart.items = [];
    await cart.save();

    res.status(201).json({
      message:"Order placed successfully",
      order
    });

  }catch(error){

    res.status(500).json({
      message:"Error placing order"
    });

  }

};

export const getMyOrders = async (req,res) => {

  try{

    const orders = await Order.find({
      userId: req.user.userId
    })
    .populate("items.productId")
    .sort({ createdAt: -1 });

    res.status(200).json(orders);

  }catch(error){

    res.status(500).json({
      message:"Error fetching orders"
    });

  }

};