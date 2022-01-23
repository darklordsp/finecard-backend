module.exports = (mongoose) => {
  const Scans = mongoose.model(
    "scans",
    new mongoose.Schema({
      client_id: {
        type: String,
        required: true,
      },
      coffeehouse_id: {
        type: String,
      },
      scan_date: {
        type: Date,
        default: Date.now,
      },
    })
  );
  return Scans;
};
