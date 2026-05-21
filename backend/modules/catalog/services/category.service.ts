import Category, { ICategory } from '../models/Category.js';

export const createCategory = async (data: Partial<ICategory>): Promise<ICategory> => 
  Category.create(data);

export const getCategories = async (): Promise<ICategory[]> => 
  Category.find({ isActive: true }).sort('name');

export const getCategoryById = async (id: string): Promise<ICategory | null> => 
  Category.findById(id);

export const updateCategory = async (id: string, data: Partial<ICategory>): Promise<ICategory | null> =>
  Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });

export const toggleCategory = async (id: string, isActive: boolean): Promise<ICategory | null> =>
  Category.findByIdAndUpdate(id, { isActive }, { new: true });

export const getCategoryBySlug = async (slug: string): Promise<ICategory | null> => 
  Category.findOne({ slug });
