import Product from "../models/Product.js";

export async function decreaseStock(items) {
  const productIds = items.filter((i) => i.productId).map((i) => i.productId);

  const bulkOps = items
    .filter((i) => i.productId)
    .map((i) => ({
      updateOne: {
        filter: {
          _id: i.productId,
          stock: { $gte: i.quantity },
        },
        update: {
          $inc: {
            stock: -i.quantity,
          },
        },
      },
    }));

  if (!bulkOps.length) return;

  await Product.bulkWrite(bulkOps);

  await Product.updateMany(
    {
      _id: { $in: productIds },
      stock: { $lte: 0 },
    },
    {
      $set: {
        available: false,
      },
    },
  );
}

export async function restoreStock(items) {
  const productIds = items.filter((i) => i.productId).map((i) => i.productId);

  const bulkOps = items
    .filter((i) => i.productId)
    .map((i) => ({
      updateOne: {
        filter: {
          _id: i.productId,
        },
        update: {
          $inc: {
            stock: i.quantity,
          },
        },
      },
    }));

  if (!bulkOps.length) return;

  await Product.bulkWrite(bulkOps);

  await Product.updateMany(
    {
      _id: { $in: productIds },
      stock: { $gt: 0 },
      available: false,
    },
    {
      $set: {
        available: true,
      },
    },
  );
}

export async function validateStock(items) {
  const productIds = items.filter((i) => i.productId).map((i) => i.productId);

  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = Object.fromEntries(
    products.map((product) => [product._id.toString(), product]),
  );

  for (const item of items) {
    const product = productMap[item.productId?.toString()];

    if (!product) {
      return {
        valid: false,
        status: 400,
        payload: { message: `Product "${item.name}" is no longer available` },
      };
    }

    if (!product.available) {
      return {
        valid: false,
        status: 400,
        payload: { message: `"${product.name}" is currently unavailable` },
      };
    }

    if (
      product.stock !== undefined &&
      product.stock !== null &&
      product.stock < item.quantity
    ) {
      return {
        valid: false,
        status: 409,
        payload: {
          message: `Only ${product.stock} unit${product.stock !== 1 ? "s" : ""} of "${product.name}" available`,
          available: product.stock,
        },
      };
    }
  }

  return { valid: true };
}
