import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRecipeIngredient {
  material: Types.ObjectId;
  amount: Types.Decimal128;
  wastePercent: Types.Decimal128;
}

export interface IRecipe extends Document {
  productVariant: Types.ObjectId;
  ingredients: IRecipeIngredient[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const recipeIngredientSchema = new Schema<IRecipeIngredient>(
  {
    material: {
      type: Schema.Types.ObjectId,
      ref: 'Material',
      required: true,
    },
    amount: { type: Schema.Types.Decimal128, required: true },
    wastePercent: { type: Schema.Types.Decimal128, default: 0 },
  },
  { _id: false }
);

const recipeSchema = new Schema<IRecipe>(
  {
    productVariant: {
      type: Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
      unique: true,
    },
    ingredients: [recipeIngredientSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Recipe = mongoose.model<IRecipe>('Recipe', recipeSchema);
export default Recipe;
