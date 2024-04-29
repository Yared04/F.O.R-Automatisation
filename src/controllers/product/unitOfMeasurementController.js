const prisma = require("../../database");

async function createUnitOfMeasurement(req, res) {
  try {
    const { name } = req.body;

    const unitOfMeasurement = await prisma.unitOfMeasurement.create({
      data:{name: name},
    });

    return res.json(unitOfMeasurement);
  } catch (error) {
    console.error("Error creating unitOfMeasurement:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function updateUnitOfMeasurement(req, res) {
  try {
    const { name } = req.body;
    const { id } = req.params;

    const unitOfMeasurement = await prisma.unitOfMeasurement.update({
      where: {
        id: id,
      },
      data: {
        name: name,
      },
    });

    return res.json(unitOfMeasurement);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getUnitOfMeasurements(req, res) {
  try {
    const unitOfMeasurements = await prisma.unitOfMeasurement.findMany();

    return res.json(unitOfMeasurements);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function deleteUnitOfMeasurement(req, res) {
  try {
    const { id } = req.params;
    const product = await prisma.product.findFirst({
      where: {
        unitOfMeasurementId: id,
      },
    });

    if (product) {
      return res
        .status(400)
        .json({
          error: "Can not delete this unit of measurement, There is related product.",
        });
    }

    const unitOfMeasurement = await prisma.unitOfMeasurement.delete({
      where: {
        id: id,
      },
    });
    
    return res.json(unitOfMeasurement);
  } catch (error) {
    console.error("Error deleting unitOfMeasurement:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
    createUnitOfMeasurement,
    updateUnitOfMeasurement,
    getUnitOfMeasurements,
    deleteUnitOfMeasurement
};
