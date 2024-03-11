const prisma = require("../../database");

async function createProductCategory(req, res) {
  try {
    const { name } = req.body;

    const category = await prisma.productCategory.create({
      name: name,
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
    const id = req.query;

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

module.exports = {
  createProductCategory,
  updateProductCategory,
  getProductCategories,

};
