export const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join_order", (orderId) => {
      socket.join(`order_${orderId}`);
    });

    socket.on("update_location", ({ orderId, lat, lng }) => {
      io.to(`order_${orderId}`).emit("location_update", { lat, lng });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};