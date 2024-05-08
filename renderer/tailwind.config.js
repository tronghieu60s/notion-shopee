import flowbite from "flowbite-react/tailwind";

module.exports = {
  content: [
    "./renderer/pages/**/*.{js,ts,jsx,tsx}",
    "./renderer/components/**/*.{js,ts,jsx,tsx}",
    flowbite.content(),
  ],
  theme: { extend: {} },
  plugins: [flowbite.plugin()],
};
