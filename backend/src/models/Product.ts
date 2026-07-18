import { Schema, model, type Types } from 'mongoose';

interface IProduct {
  _id?: Types.ObjectId;
  facilityId: Types.ObjectId;
  sportId: Types.ObjectId;
  name: string;
  image: string;
  price: number;
  stock: number;
  active: boolean;
}

const productSchema = new Schema<IProduct>(
  {
    facilityId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true },
    sportId: { type: Schema.Types.ObjectId, ref: 'Sport', required: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true },
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
    active: { type: Boolean, required: true, default: true },
  },
  {
    collection: 'products',
  },
);

const Product = model<IProduct>('Product', productSchema);

export { Product, type IProduct };
