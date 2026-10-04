import mongoose, { Schema, Document } from "mongoose";

export interface IRepositoryFile extends Document {
  repositoryId: mongoose.Types.ObjectId;
  path: string;
  content: string;
}

const repositoryFileSchema = new Schema<IRepositoryFile>({
  repositoryId: {
    type: Schema.Types.ObjectId,
    ref: "Repository",
    required: true
  },

  path: {
    type: String,
    required: true
  },

  content: {
    type: String,
    required: true
  }
});

export const RepositoryFile = mongoose.model<IRepositoryFile>(
  "RepositoryFile",
  repositoryFileSchema
);