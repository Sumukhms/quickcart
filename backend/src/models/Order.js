import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({

  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  storeId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true
  },

  items:[
    {
      productId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required:true
      },

      quantity:{
        type:Number,
        default:1,
        min:1
      },

      price:{
        type:Number,
        required:true
      }
    }
  ],

  totalPrice:{
    type:Number,
    required:true
  },

  status:{
    type:String,
    enum:[
      'pending',
      'confirmed',
      'preparing',
      'out_for_delivery',
      'delivered',
      'cancelled'
    ],
    default:'pending'
  },

  deliveryAddress:{
    type:String,
    required:true
  }

},{ timestamps:true });

const Order = mongoose.model("Order", orderSchema);

export default Order;