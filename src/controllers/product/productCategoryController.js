const prisma = require("../../database");

async function createProductCategory(req, res) {
  try {
    const { name } = req.body;

    const category = await prisma.productCategory.create({
      data:{name: name},
    });

    return res.json(category);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function updateProductCategory(req, res) {
  try {
    const { name } = req.body;
    const { id } = req.params;

    const category = await prisma.productCategory.update({
      where: {
        id: id,
      },
      data: {
        name: name,
      },
    });

    return res.json(category);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getProductCategories(req, res) {
  try {
    const categories = await prisma.productCategory.findMany();

    return res.json(categories);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function deleteProductCategory(req, res) {
  try {
    const { id } = req.params;
    const product = await prisma.product.findFirst({
      where: {
        productCategoryId: id,
      },
    });

    if (product) {
      return res
        .status(400)
        .json({
          error: "Can not delete product category, There is related product.",
        });
    }

    const category = await prisma.productCategory.delete({
      where: {
        id: id,
      },
    });
    return res.json(category);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  createProductCategory,
  updateProductCategory,
  getProductCategories,
  deleteProductCategory
};
