let i = 10000;

export default () => {
  if (i >= 100000) i = 10000;
  return `${Date.now()}${i++}`;
}
