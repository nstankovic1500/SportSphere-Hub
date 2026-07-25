import { Schema, model, type Types } from 'mongoose';

interface ICartItem {
  _id?: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
}

interface ICart {
  _id?: Types.ObjectId;
  athleteId: Types.ObjectId;
  items: ICartItem[];
  updatedAt?: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'quantity must be an integer',
      },
    },
  },
  {
    _id: true,
  },
);

const cartSchema = new Schema<ICart>(
  {
    athleteId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      required: true,
      default: [],
    },
  },
  {
    collection: 'carts',
    timestamps: {
      createdAt: false,
      updatedAt: true,
    },
  },
);

const Cart = model<ICart>('cart', cartSchema);

export { Cart, type ICart, type ICartItem };
