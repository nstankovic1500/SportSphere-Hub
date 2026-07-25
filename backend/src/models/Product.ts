import { Schema, model, type Types } from 'mongoose';

interface IProduct {
  _id?: Types.ObjectId;
  facilityId: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  active: boolean;
}

const productSchema = new Schema<IProduct>(
  {
    facilityId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    stock: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'stock must be an integer',
      },
    },
    category: { type: String, required: true, trim: true },
    image: { type: String, required: false },
    active: { type: Boolean, required: true, default: true },
  },
  {
    collection: 'products',
  },
);

const Product = model<IProduct>('Product', productSchema);

export { Product, type IProduct };
