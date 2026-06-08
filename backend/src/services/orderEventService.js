export function emitOrderStatusUpdate(io, order) {
  io?.to(`order_${order._id}`).emit("order_status_update", {
    status: order.status,
    orderId: order._id,
    order,
  });
}

export function emitStoreOrderUpdate(io, order) {
  io?.to(`store_${order.storeId}`).emit("order_updated", {
    orderId: order._id,
    status: order.status,
  });
}

export function emitDeliveryAvailable(io, order) {
  io?.emit("delivery_available", {
    orderId: order._id,
    address: order.deliveryAddress,
    storeId: order.storeId,
    triggerStatus: order.status,
  });
}
