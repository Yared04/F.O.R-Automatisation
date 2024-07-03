const formatNumber = (number) => {
  // Ensure the input is a number
  if (isNaN(number)) {
    return;
  }

  // Round the number to two decimal places
  const roundedNumber = number.toFixed(2);

  // Split the number into integer and decimal parts
  const [integerPart, decimalPart] = roundedNumber.split(".");

  // Format the integer part with commas
  const formattedIntegerPart = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ","
  );

  // Combine the formatted integer part with the decimal part
  return `${formattedIntegerPart}.${decimalPart}`;
}

module.exports = { formatNumber };
