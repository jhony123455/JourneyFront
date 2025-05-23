module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ["plugin:vue/vue3-recommended", "eslint:recommended", "@vue/prettier"],
  parserOptions: {
    parser: "babel-eslint"
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "prettier/prettier": "off",
    "no-unused-vars": "off"
  }
};
