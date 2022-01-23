module.exports = (mongoose) => {
  const Codes = mongoose.model(
    "codes",
    new mongoose.Schema({
      client_id: {
        type: String,
        required: true,
      },
      coffeehouse_id: {
        type: String,
        require: true,
      },
      phonenumber: {
        type: String,
        require: true,
      },
      confirmation_code: {
        type: String,
      },
    })
  );
  return Codes;
};
