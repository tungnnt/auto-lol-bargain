const prompts = require("prompts");

const selectQuestion = async ({ question, options }) => {
  const response = await prompts({
    type: "select",
    name: "value",
    message: question,
    choices: options.concat({
      title: "Thoát",
      value: "null",
    }),
    initial: 0,
  });

  if (response.value === "null") process.exit(1);

  return response.value;
};

const textQuestion = async ({ question }) => {
  const response = await prompts({
    type: "text",
    name: "value",
    message: question,
  });

  return response.value;
};

module.exports = {
  selectQuestion,
  textQuestion,
};
