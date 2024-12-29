import mammoth from "mammoth";

export const convertFileToRichText = async (fileContent) => {
  try {
    const { value: htmlContent } = await mammoth.convertToHtml({
      buffer: fileContent,
    });

    return htmlContent;
  } catch (error) {
    console.error("Error converting file:", error);
    throw new Error("Failed to convert file to rich text.");
  }
};

export const convertTextToRichText = (text) => {
  // Replace line breaks with <br> tags
  const formattedText = text.replace(/\n/g, "<br>");
  return `<p>${formattedText}</p>`;
};
