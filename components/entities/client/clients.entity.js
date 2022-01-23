module.exports = (mongoose) => {
  const Clients = mongoose.model(
    "clients",
    new mongoose.Schema({
      phonenumber: {
        type: String,
        required: true,
      },
      coffeehouse_id: {
        type: String,
        required: true,
      },
      card_id: {
        type: String,
      },
      accepted: {
        type: Boolean,
        default: false,
      },
      current_stamps: {
        type: Number,
      },
      qr_url: {
        type: String,
      },
      card_url: {
        type: String,
      },
    })
  );
  return Clients;
};
