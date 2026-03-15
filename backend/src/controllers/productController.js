import Product from "../models/Product.js";
import Store from "../models/Store.js";

export const createProduct = async (req,res) =>{

  try{
    if(req.user.role !== "store"){
      return res.status(403).json({
        message:"Only store owners can create products"
      });
    }

    const store = await Store.findById(storeId);

    if (!store) {
    return res.status(404).json({
        message: "Store not found"
    });
    }

    if (store.ownerId.toString() !== req.user.userId) {
    return res.status(403).json({
        message: "You are not the owner of this store"
    });
    }

    const { name, description, price, category, image, storeId } = req.body;

    if(!name || !price || !category || !storeId){
      return res.status(400).json({
        message:"Missing required fields"
      });
    }

    const newProduct = new Product({
      name,
      storeId,
      description,
      price,
      category,
      image
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      message:"Product created successfully",
      product:savedProduct
    });

  }catch(error){

    res.status(500).json({
      message:error.message
    });

  }

};

export const getProductsByStore = async (req,res) => {
  try{
    const products = await Product.find({ storeId: req.params.storeId });   
    res.json(products);
  }catch(error){
    res.status(500).json({
      message:error.message
    });
}
};