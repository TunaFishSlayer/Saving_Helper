import { prisma } from "../config/db.js";

class CategoryService {

  static async createCategory(userId, data) {
    // Ensure proper type handling for nested update/create
    return prisma.category.create({
      data: {
        ...data,
        userId
      }
    });
  }

  static async getUserCategories(userId, type) {
    const where = { userId };
    if (type) {
      where.type = type;
    }

    return prisma.category.findMany({
      where,
      orderBy: {
        name: 'asc'
      }
    });
  }

  static async deleteCategory(categoryId, userId) {
    // Use Postgres relations to count transactions linked to this category
    const transactionCount = await prisma.transaction.count({
      where: {
        categoryId,
        userId
      }
    });

    if (transactionCount > 0) {
      throw new Error(
        "Cannot delete category because it is used by existing transactions"
      );
    }

    // First, verify existence and user ownership
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId
      }
    });

    if (!category) {
      throw new Error("Category not found or access denied");
    }

    // Perform deletion
    await prisma.category.delete({
      where: {
        id: categoryId
      }
    });

    return category;
  }

  static async updateCategory(categoryId, userId, updateData) {
    // Check ownership
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId
      }
    });
    
    if (!category) {
      throw new Error("Category not found or access denied");
    }

    // Apply updates safely
    const { id, userId: uId, ...safeUpdateData } = updateData;
    
    return prisma.category.update({
      where: {
        id: categoryId
      },
      data: safeUpdateData
    });
  }
}

export default CategoryService;
