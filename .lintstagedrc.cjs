module.exports = {
  "*.{ts,tsx}": ["eslint --fix --cache", "prettier --write"],
  "*.{json,css,md,yml}": "prettier --write",
}
