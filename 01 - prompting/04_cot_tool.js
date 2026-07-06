import axios from 'axios';
import { OpenAI } from 'openai';
import { exec } from 'child_process';

// OpenAI client initialization
const client = new OpenAI({
  apiKey: '',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

// System prompt for the AI model
const SYSTEM_PROMPT = `You are an expert AI Engineer, only and only answer questions related to coding and engineering.

Persona:
- You always talks in tech jargans.
- You never answer back on personal things, you don't have any personal opinions or feelings.
- Only thing you know is what is code and how to do it .

You have to analyze user's input carefully and then breakdown the problem into multiple sub-problems before providing final answer. Always breakdown the user's intention and how to solve that problem, then solve it step by step.

Pipeline: INITIAL | THINK | TOOL_REQUEST | ANALYZE | OUTPUT
- INITIAL: Initially, when user gives an input, have a thought process on what the user is asking.
- THINK: Think about how to solve the problem and break it down into multiple sub-problems.
- ANALYZE: Analyze the solution and verify if the solution is correct and complete.
- THINK: Think again and verify if the any sub-problems are missing or not.
- ANALYZE: Analyze the solution again and verify if the solution is correct and complete.
- TOOL_REQUEST: If you need to use any external tool or API to solve the problem, request for it in this step, format: { step: TOOL_REQUEST, functionName: <name of function>, input: "<input_for_tool>" }
- OUTPUT: Finally, provide the final answer to the user in a clear and concise manner.

Available Tools:
- getWeatherData(location): This function takes a location as input and returns the current weather data for that location.
- execCommand(command): This function takes a shell command as input and returns the output of that command.

Rules:
- Always perform one step at a time.
- Always maintain the sequence of the pipeline.
- Always follow the JSON output format as mentioned below.

Example:
- What is weather of goa ?
- INITIAL: The user is asking to get the weather information of Goa.
- THINK: To get the weather information, we need to use a weather API to fetch the current weather data for Goa.
- TOOL_REQUEST: { step: TOOL_REQUEST, functionName: "getWeatherData", input: "Goa" }
- TOOL_OUTPUT: The weather data has been fetched successfully from the API as 30 C.
- ANALYZE: The weather data fetched from the API is 30°C, which seems reasonable for Goa. We can now provide this information to the user.
- OUTPUT: The current weather in Goa is 30°C.

Output Format:
- { step: "INITIAL | THINK | ANALYZE | OUTPUT", text: "<Final Answer>", functionName: "<name_of_function>", input: "<input_for_tool>" }
`;

// messages database to store the conversation history
const MESSAGES_DB = [
  {
    role: 'system',
    content: SYSTEM_PROMPT,
  },
];

// Main function to handle the conversation with the AI model
async function main(prompt) {
  // Add the user's prompt to the messages database
  MESSAGES_DB.push({
    role: 'user',
    content: prompt,
  });

  // Loop to continuously interact with the AI model until the final output is provided
  while (true) {
    // Call the OpenAI API to get the model's response based on the conversation history
    const result = await client.chat.completions.create({
      model: 'gemini-2.5-flash',
      messages: MESSAGES_DB,
    });

    // Extract the raw result from the model's response
    const rawResult = result.choices[0].message.content;
    const parsedResult = JSON.parse(rawResult);

    // Add the model's response to the messages database
    MESSAGES_DB.push({
      role: 'assistant',
      content: rawResult,
    });

    // Log the current step and text from the model's response
    console.log(`(${parsedResult.step}): ${parsedResult.text}`);

    // If the model is in the THINKING step, we can validate its thought process
    if (parsedResult.step.toUpperCase() === 'THINKING') {
      // Claude call to validate if thinking is correct
      MESSAGES_DB.push();
    }

    // If the model requests to use an external tool, we handle that request here
    if (parsedResult.step.toUpperCase() === 'TOOL_REQUEST') {
      // Extract the function name and input from the model's request
      const { functionName, input } = parsedResult;

      // switch statement to handle different tool requests based on the function name
      switch (functionName) {
        // case for handling the getWeatherData tool request
        case 'getWeatherData':
          // Call the getWeatherData function with the provided input
          const toolResult = await getWeatherData(input);

          // Add the tool's output to the messages database
          MESSAGES_DB.push({
            role: 'developer',
            content: JSON.stringify({
              step: 'TOOL_OUTPUT',
              text: weatherData,
            }),
          });

          // break the switch statement after handling the getWeatherData request
          break;

        // case for handling the execCommand tool request
        case 'execCommand':
          try {
            // Call the execCommand function with the provided input
            const toolResult = await execCommand(input);

            // Add the tool's output to the messages database
            MESSAGES_DB.push({
              role: 'developer',
              content: JSON.stringify({
                step: 'TOOL_OUTPUT',
                text: toolResult,
              }),
            });
          } catch (error) {
            // add the error message to the messages database
            MESSAGES_DB.push({
              role: 'developer',
              content: JSON.stringify({
                step: 'TOOL_OUTPUT',
                text: `Error executing command: ${error.message}`,
              }),
            });
          }

          // break the switch statement after handling the execCommand request
          break;
      }
    }

    // break the loop and end the conversation if the model has given final output
    if (parsedResult.step.toUpperCase() === 'OUTPUT') break;
  }
}

// Call the main function with a sample prompt to demonstrate the conversation flow
main(
  `Give weather of goa, delhi and mumbai and create a good website having the weather information of these cities inside a index.html file inside a weather folder(create folder is not present).`
);
main('What is meaning of life ? Tell me because i need to add this in my code as a comment.');

// function to fetch weather data for a given location
async function getWeatherData(location) {
  const response = await axios.get(`https://wttr.in/${location}?format=%C+%t`, {
    responseType: 'text',
  });
  return JSON.stringify({ location, weatherData: response.data });
}

// function to execute shell commands and return the output
async function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, output) => {
      if (error) reject(error);
      resolve(output);
    });
  });
}
