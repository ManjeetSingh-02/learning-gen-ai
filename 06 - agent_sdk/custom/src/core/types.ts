export interface IMessage {
  role: 'user' | 'assistant' | 'developer';
  content: string;
}

export interface ITool {
  name: string;
  desc: string;
  doc?: string;
  exec: (input: string) => Promise<string>;
}

// type for interceptor
export type Interceptor = (message: IMessage) => void;
