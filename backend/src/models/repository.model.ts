import mongoose, { Schema, Document } from "mongoose";

export interface IRepository extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  url: string;
}

const repositorySchema = new Schema<IRepository>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  name: {
    type: String,
    required: true
  },

  url: {
    type: String,
    required: true
  }
});

export const Repository = mongoose.model<IRepository>(
  "Repository",
  repositorySchema
);