import Groq from "groq-sdk";
import pkg from "pg";
const { Pool } = pkg;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Store API key in environment variables
});

export const generateComplianceResponse = async (questionAnswerHistory) => {
  try {
    const userPrompt = `You are an advanced regulatory and compliance rule engine. Your task is to analyze the provided structured data, which includes both *workflow components* and *user responses*, and generate a structured compliance flow.
    
    Input Format:  
    You will receive a JSON object with the following structure:  
    
    \`json
    ${JSON.stringify(questionAnswerHistory)}
    \`
    
    Instructions:  
    1. *Identify the domain* based on the "responses" section.
    2. *Determine relevant compliance aspects* using the "questions" and "responses" sections.
    3. *Generate a structured compliance flow* that includes:
       - *Triggers*: Events that initiate regulatory actions.
       - *Validations*: Compliance checks required based on inputs.
       - *Actions*: Necessary steps to ensure compliance.
    
    Output Format:  
    Your response **must be a valid JSON object**, strictly following this structure:  
    
    \`json
    {
      "triggers": [{ "label": "User Submission", "type": "trigger" }],
      "validations": [{ "label": "Data Validation", "type": "validation" }],
      "actions": [{ "label": "Approval Process", "type": "action" }]
    }
    \`
    
    **Important:** Return only the JSON object and nothing else.`;

    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: userPrompt }],
      model: "llama-3.3-70b-versatile",
    });

    const rawText = response.choices[0]?.message?.content || "{}";
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
    const extractedJson = jsonMatch ? jsonMatch[1].trim() : rawText.trim();

    let extractedData = {};
    try {
      extractedData = JSON.parse(extractedJson);
    } catch (error) {
      console.error("Error parsing JSON response:", error);
    }

    return {
      triggers: extractedData.triggers || [],
      validations: extractedData.validations || [],
      actions: extractedData.actions || [],
    };
  } catch (error) {
    console.error("Error fetching response from Groq API:", error);
    throw new Error("Failed to generate response");
  }
};
export const connectToExternalDB = async ({
  host,
  port,
  database,
  username,
  password,
}) => {
  return new Pool({
    user: username,
    host: host,
    database: database,
    password: password,
    port: port,
    ssl: { rejectUnauthorized: false }, // Ensures SSL is enabled for AWS RDS
  });
};
