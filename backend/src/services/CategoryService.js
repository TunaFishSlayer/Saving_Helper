import Category from "../models/Category.js";
import Transaction from "../models/Transaction.js";

class CategoryService {

  static async createCategory(userId, data) {
    return Category.create({
      ...data,
      userId
    });
  }

  static async getUserCategories(userId, type) {
    const query = { userId };
    if (type) query.type = type;

    return Category.find(query).sort({ name: 1 });
  }

  static async deleteCategory(categoryId, userId) {
    const transactionCount = await Transaction.countDocuments({
      categoryId,
      userId
    });

    if (transactionCount > 0) {
      throw new Error(
        "Cannot delete category because it is used by existing transactions"
      );
    }

    const category = await Category.findOneAndDelete({
      _id: categoryId,
      userId
    });

    if (!category) {
      throw new Error("Category not found or access denied");
    }

    return category;
  }

  static async updateCategory(categoryId, userId, updateData) {
    const category = await Category.findOne({
      _id: categoryId,
      userId
    });
    if (!category) {
      throw new Error("Category not found or access denied");
    }
    Object.assign(category, updateData);
    await category.save();
    return category;
  }
}
export default CategoryService;
