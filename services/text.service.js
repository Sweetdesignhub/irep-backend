/**
 * Combines multiple text inputs using a custom format template.
 * @param {Object} inputs - An object containing the input fields (e.g., { input1: "value1", input2: "value2" }).
 * @param {string} format - The format template (e.g., "Hello {input1}, welcome to {input2}!").
 * @returns {string} - The combined text output.
 */

export const combineText = (inputs, format) => {
  // Replace placeholders in the format template with input values
  const combinedText = format.replace(/{(\w+)}/g, (match, placeholder) => {
    // Check if the placeholder exists in the inputs
    return inputs[placeholder] !== undefined ? inputs[placeholder] : "";
  });

  return combinedText;
};

/**
 * Formats the given text based on the specified formatter.
 * @param {string} value - The text to format.
 * @param {string} formatter - The formatting option to apply.
 * @param {number} [truncateLength] - Optional length for truncation (used only if formatter is "Truncate").
 * @returns {string} - The formatted text.
 */
export const textFormatter = (value, formatter, truncateLength) => {
  if (typeof value !== "string") {
    throw new Error("Value must be a string.");
  }

  switch (formatter) {
    case "To Lowercase":
      return value.toLowerCase();

    case "To Uppercase":
      return value.toUpperCase();

    case "To Propercase":
      return value
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");

    case "Trim Spaces":
      return value.trim();

    case "Truncate":
      if (typeof truncateLength !== "number" || truncateLength < 0) {
        throw new Error("Truncate length must be a non-negative number.");
      }
      return value.length > truncateLength
        ? value.slice(0, truncateLength) + "..."
        : value;

    default:
      throw new Error("Invalid formatter specified.");
  }
};

/**
 * Replaces specified words in the input text with their respective replacements.
 * @param {string} input - The text to perform replacements on.
 * @param {Array<{find: string, replaceWith: string}>} replacements - A list of objects specifying the words to find and their replacements.
 * @returns {string} - The text after all replacements have been applied.
 */

export const findAndReplace = (input, replacements) => {
  if (typeof input !== "string") {
    throw new Error("Input must be a string.");
  }

  if (!Array.isArray(replacements)) {
    throw new Error("Replacements must be an array.");
  }

  let output = input;

  replacements.forEach(({ find, replaceWith }) => {
    if (typeof find !== "string" || typeof replaceWith !== "string") {
      throw new Error("Both 'find' and 'replaceWith' must be strings.");
    }

    // Use a global regex to replace all occurrences of the 'find' word
    const regex = new RegExp(find, "g");
    output = output.replace(regex, replaceWith);
  });

  return output;
};

/**
 * Splits the input text into an array of segments based on the specified delimiter or newline.
 * @param {string} text - The text to split.
 * @param {string} [delimiter=","] - The delimiter to split the text on. Default is a comma.
 * @param {boolean} [splitOnNewline=false] - Whether to split the text on newline characters instead of the delimiter.
 * @returns {Array<string>} - An array of split segments.
 */
export const splitText = (text, delimiter = ",", splitOnNewline = false) => {
  if (typeof text !== "string") {
    throw new Error("Text must be a string.");
  }

  // Determine the split character(s)
  const splitChar = splitOnNewline ? /\r?\n/ : delimiter;

  // Split the text and preserve empty segments
  return text.split(splitChar);
};

/**
 * Splits the input text into chunks of the specified size.
 * @param {string} text - The text to split into chunks.
 * @param {number} chunkSize - The number of characters per chunk.
 * @returns {Array<string>} - An array of text chunks.
 */
export const chunkText = (text, chunkSize) => {
  if (typeof text !== "string") {
    throw new Error("Text must be a string.");
  }

  if (typeof chunkSize !== "number" || chunkSize <= 0) {
    throw new Error("Chunk size must be a positive number.");
  }

  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  return chunks;
};
