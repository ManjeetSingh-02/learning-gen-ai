// internal-imports
import { AgentBuilder } from './agent-builder.js';
import { SYSTEM_PROMPT } from '../core/config.js';
import type { IMessage, Interceptor, ITool } from '../core/types.js';

// external-imports
import OpenAI from 'openai';

// class to represent an agent that can run user queries
export class Agent {
  // maximum number of loops to run before stopping
  private readonly MAX_LOOPS = 50;

  // private properties
  private instructions: string;
  private interceptors: Interceptor[];
  private agentsMap: Map<string, Agent>;
  private messageHistory: IMessage[];
  private openai: OpenAI;
  private toolMap: Map<string, ITool>;

  // constructor to initialize the agent with a builder
  constructor(builder: AgentBuilder) {
    // initialize properties
    this.interceptors = [];
    this.agentsMap = new Map();
    this.messageHistory = [];
    this.openai = new OpenAI();
    this.toolMap = new Map();

    // populate the tool map with tools from the builder
    for (const t of builder.getTools()) {
      this.toolMap.set(t.name, t);
    }

    // populate the agents map with agents from the builder
    for (const a of builder.getAgents()) {
      this.agentsMap.set(a.name, a.agent);
    }

    // set the instructions for the agent
    this.instructions = `SYSTEM_PROMPT: ${SYSTEM_PROMPT}\n\nUSER_INSTRUCTIONS: ${builder.getInstructions()}\n\nAVAILABLE_TOOLS: ${builder
      .getTools()
      .map(t => JSON.stringify({ name: t.name, desc: t.desc, doc: t.doc }))
      .join('\n')}\n\nAVAILABLE_AGENTS: ${builder
      .getAgents()
      .map(a => JSON.stringify({ name: a.name, desc: a.desc }))
      .join('\n')}
    `;
  }

  // static method to create a new AgentBuilder instance
  static builder() {
    return new AgentBuilder();
  }

  // method to add interceptors to the agent
  public addInterceptors(i: Interceptor[]) {
    this.interceptors.push(...i);
  }

  // private method to notify all interceptors with a message
  private notifyInterceptors(m: IMessage) {
    for (const i of this.interceptors) {
      i(m);
    }
  }

  // private method to push a message to the message history and notify interceptors
  private pushMessageAndNotifyInterceptors(m: IMessage) {
    this.messageHistory.push(m);
    this.notifyInterceptors(m);
  }

  // method to run a user query
  public async run(query: string) {
    // push the user query to the message history
    this.messageHistory.push({ role: 'user', content: query });

    // loop to process the query and handle tool requests
    for (let i = 0; i < this.MAX_LOOPS; i++) {
      // create a response from the OpenAI API
      const response = await this.openai.responses.create({
        model: 'gpt-4.1-mini',
        input: this.messageHistory.map(m => `${m.role}: ${m.content}`).join('\n'),
        instructions: this.instructions,
      });

      // push the assistant's response to the message history and notify interceptors
      this.pushMessageAndNotifyInterceptors({ role: 'assistant', content: response.output_text });

      // parse the response
      const parsedResponse = JSON.parse(response.output_text);

      // handle output step
      if (parsedResponse.step.toLowerCase() === 'output') return parsedResponse.output;

      // handle tool requests
      if (parsedResponse.step.toLowerCase() === 'tool_request') {
        // extract tool name and input from the parsed response
        const { toolName, input } = parsedResponse;

        // get the tool from the tool map
        const tool = this.toolMap.get(toolName);

        // handle case where the tool does not exist
        if (!tool) {
          this.pushMessageAndNotifyInterceptors({
            role: 'developer',
            content: `Error: Tool(${toolName}) does not exists`,
          });
          continue;
        }

        // execute the tool, push the result in message history and notify interceptors
        const toolResult = await tool.exec(input);
        this.pushMessageAndNotifyInterceptors({
          role: 'developer',
          content: JSON.stringify({ toolName, input, toolResult }),
        });
      }

      // handle agent requests
      if (parsedResponse.step.toLowerCase() === 'agent_request') {
        // extract agent name and input from the parsed response
        const { agentName, input } = parsedResponse;

        // get the agent from the agents map
        const agent = this.agentsMap.get(agentName);

        // handle case where the agent does not exist
        if (!agent) {
          this.pushMessageAndNotifyInterceptors({
            role: 'developer',
            content: `Error: Agent(${agentName}) does not exists`,
          });
          continue;
        }

        // execute the agent, push the result in message history and notify interceptors
        const agentResult = await agent.run(input);
        this.pushMessageAndNotifyInterceptors({
          role: 'developer',
          content: JSON.stringify({ agentName, input, agentResult }),
        });
      }
    }
  }
}
