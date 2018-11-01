export const getChange = (previous, next) => {
  let isInfinity = false;
  let direction: "up" | "down";
  let value = 0; // percentage change

  if (previous === 0) {
    if (next !== 0) {
      isInfinity = true;
      direction = "up";
    } else {
      value = 0;
    }
  } else {
    value = Math.round(((1.0 * next) / previous - 1) * 100);
    direction = value > 0 ? "up" : "down";
    value = Math.abs(value);
    if (value > 1000) {
      isInfinity = true;
    }
  }

  return {
    direction,
    isInfinity,
    value
  };
};
