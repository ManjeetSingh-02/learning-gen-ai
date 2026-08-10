// internal-imports
import { Agent } from './agent.js';
import type { ITool } from '../core/types.js';

// interface for agent
interface IAgent {
  name: string;
  desc: string;
  agent: Agent;
}

// builder class to create an Agent with specific instructions and tools
export class AgentBuilder {
  // private properties to hold instructions and tools
  private instructions: string;
  private tools: ITool[];
  private agents: IAgent[];

  // constructor to initialize the builder with default values
  constructor() {
    this.agents = [];
    this.instructions = '';
    this.tools = [];
  }

  // method to add agents to the builder
  public addAgents(a: IAgent[]) {
    this.agents.push(...a);
    return this;
  }

  // method to retrieve the agents from the builder
  public getAgents() {
    return this.agents;
  }

  // method to add instructions to the builder
  public addInstructions(i: string) {
    this.instructions = i;
    return this;
  }

  // method to retrieve the instructions from the builder
  public getInstructions() {
    return this.instructions;
  }

  // method to add tools to the builder
  public addTools(t: ITool[]) {
    this.tools.push(...t);
    return this;
  }

  // method to retrieve the tools from the builder
  public getTools() {
    return this.tools;
  }

  // method to build and return an Agent instance using the builder's configuration
  public build() {
    return new Agent(this);
  }
}
