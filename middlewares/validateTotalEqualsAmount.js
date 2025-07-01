const Decimal = require("decimal.js");

function validateTotalEqualsAmount(items, amount) {
  const total = items.reduce((sum, item) => {
    return sum.plus(new Decimal(item.amount));
  }, new Decimal(0));

  return total.equals(new Decimal(amount));
}
module.exports = { validateTotalEqualsAmount };
