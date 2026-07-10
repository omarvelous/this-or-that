import React from "react";

import type { Preview } from "@storybook/react";

import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "subtle", value: "#f8fafc" },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          fontFamily:
            "var(--font-geist-sans, system-ui, -apple-system, sans-serif)",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;
