import mongoose from "mongoose";

const GiftTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export default mongoose.model("GiftType", GiftTypeSchema);
