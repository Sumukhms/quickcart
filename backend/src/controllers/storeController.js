import Store from "../models/Store.js";

export const createStore = async (req, res) => {

  try {

    const { name, phone, address, category } = req.body;

    const ownerId = req.user.userId;

    if (!name || !phone || !address || !category) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    const newStore = new Store({
      name,
      ownerId,
      phone,
      address,
      category
    });

    const savedStore = await newStore.save();

    res.status(201).json({
      message: "Store created successfully",
      store: savedStore
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });
  }
};

export const getStores = async (req,res) => {
  try {
  const stores = await Store.find();
  res.json(stores);
} catch(error) {
  res.status(500).json({ message: error.message });
}
};

export const getStoreById = async (req,res) => {
  try {
    const store = await Store.findById(req.params.id);
    res.json(store);
  } catch(error) {
    res.status(500).json({ message: error.message });
  }
};