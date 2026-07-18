import { Schema, model, type Types } from 'mongoose';

enum DiscountType {
  Percentage = 'percentage',
  Fixed = 'fixed',
}

interface IPromotion {
  _id?: Types.ObjectId;
  facilityId: Types.ObjectId;
  name: string;
  sportId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  discountType: DiscountType;
  discountValue: number;
  active: boolean;
}

const promotionSchema = new Schema<IPromotion>(
  {
    facilityId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true },
    name: { type: String, required: true, trim: true },
    sportId: { type: Schema.Types.ObjectId, ref: 'Sport', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    discountType: {
      type: String,
      required: true,
      enum: Object.values(DiscountType),
    },
    discountValue: { type: Number, required: true, min: 0.000001 },
    active: { type: Boolean, required: true, default: true },
  },
  {
    collection: 'promotions',
  },
);

promotionSchema.path('endDate').validate(function validateEndDate(value: Date): boolean {
  return value.getTime() > this.startDate.getTime();
}, 'endDate must be after startDate');

promotionSchema.path('discountValue').validate(function validateDiscountValue(value: number): boolean {
  if (this.discountType === DiscountType.Percentage) {
    return value >= 1 && value <= 100;
  }

  return value > 0;
}, 'discountValue is invalid for the selected discountType');

const Promotion = model<IPromotion>('Promotion', promotionSchema);

export { Promotion, DiscountType, type IPromotion };
