import { Schema, model, type Types } from 'mongoose';

enum OrderStatus {
  Ordered = 'ordered',
  Accepted = 'accepted',
  PickedUp = 'picked_up',
  Cancelled = 'cancelled',
}

interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  quantity: number;
  priceAtPurchase: number;
}

interface IOrder {
  _id?: Types.ObjectId;
  athleteId: Types.ObjectId;
  facilityId: Types.ObjectId;
  items: IOrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt?: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'quantity must be an integer',
      },
    },
    priceAtPurchase: { type: Number, required: true, min: 0 },
  },
  {
    _id: false,
  },
);

const orderSchema = new Schema<IOrder>(
  {
    athleteId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    facilityId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (value: IOrderItem[]): boolean => value.length > 0,
        message: 'items must contain at least one order item',
      },
    },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: Object.values(OrderStatus),
    },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: 'orders',
  },
);

const Order = model<IOrder>('Order', orderSchema);

export { Order, OrderStatus, type IOrder, type IOrderItem };
