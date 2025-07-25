const chunkArray = (arr, size) => {
  const groupedArray = [];
  for (let i = 0; i < arr.length; i += size) {
    groupedArray.push(arr.slice(i, i + size));
  }
  return groupedArray;
};

const substituteNullForUndefined = (obj) => {
  const result = {};
  Object.keys(obj).forEach((key) => {
    result[key] = obj[key] === undefined ? null : obj[key];
  });
  return result;
};

export default chunkArray;
export { substituteNullForUndefined };
