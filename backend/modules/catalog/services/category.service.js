import Category from '../models/Category.js';

export const createCategory = async (data) => Category.create(data);

export const getCategories = async () => Category.find({ isActive: true }).sort('name');

export const getCategoryById = async (id) => Category.findById(id);

export const updateCategory = async (id, data) =>
  Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });

export const toggleCategory = async (id, isActive) =>
  Category.findByIdAndUpdate(id, { isActive }, { new: true });
