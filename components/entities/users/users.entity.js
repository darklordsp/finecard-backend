module.exports = (mongoose) => {
  const Users = mongoose.model(
    "users",
    new mongoose.Schema({
      coffeehouse: {
        type: String,
      },
      email: {
        type: String,
        required: true,
      },
      password: {
        type: String,
        required: true,
      },
      phonenumber: {
        type: String,
      },
      maxstamps: {
        type: Number,
        default: 6,
      },
    })
  );
  return Users;
};
