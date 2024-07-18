const formatNumber = (number) => {
  // Ensure the input is a number
  if (!number || isNaN(number)) {
    return "";
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


function formatFilterDate(date){
const localDate = new Date(date);
const utcYear = localDate.getUTCFullYear();
const utcMonth = localDate.getUTCMonth(); // Months are 0-indexed
const utcDay = localDate.getUTCDate();

// Create a new Date object representing midnight in UTC
return new Date(Date.UTC(utcYear, utcMonth, utcDay));
}

module.exports = { formatNumber,formatFilterDate };
