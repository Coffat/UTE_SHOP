import { Request, Response, NextFunction } from 'express';
import Recipe from '../models/Recipe.js';
import '../models/ProductVariant.js'; // Ensure model is registered
import '../models/Product.js'; // Ensure model is registered
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import mongoose from 'mongoose';

export const createRecipe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productVariant, ingredients, isActive } = req.body;
    
    // Check if recipe already exists for this variant
    const existing = await Recipe.findOne({ productVariant });
    if (existing) {
      return sendError(res, 400, 'Recipe already exists for this variant');
    }
    
    const recipe = new Recipe({ productVariant, ingredients, isActive });
    await recipe.save();
    
    sendSuccess(res, 201, 'Recipe created successfully', recipe);
  } catch (error) {
    next(error);
  }
};

export const updateRecipe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { ingredients, isActive } = req.body;
    
    const recipe = await Recipe.findByIdAndUpdate(
      id,
      { ingredients, isActive },
      { new: true, runValidators: true }
    );
    
    if (!recipe) return sendError(res, 404, 'Recipe not found');
    
    sendSuccess(res, 200, 'Recipe updated successfully', recipe);
  } catch (error) {
    next(error);
  }
};

export const getRecipeByVariant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { variantId } = req.params;
    const recipe = await Recipe.findOne({ productVariant: variantId }).populate('ingredients.material');
    
    if (!recipe) return sendError(res, 404, 'Recipe not found');
    
    sendSuccess(res, 200, 'Recipe fetched successfully', recipe);
  } catch (error) {
    next(error);
  }
};

export const getAllRecipes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recipes = await Recipe.find()
      .populate({
        path: 'productVariant',
        populate: { path: 'product', select: 'name' }
      })
      .populate('ingredients.material');
    sendSuccess(res, 200, 'OK', recipes);
  } catch (err) {
    next(err);
  }
};
