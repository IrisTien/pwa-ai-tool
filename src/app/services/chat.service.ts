import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  reasoning_content?: string;
}

export interface ChatResponse {
  choices: {
    message: Message;
    finish_reason: string;
  }[];
}

// (1) The deepseek-chat model points to DeepSeek-V3. The deepseek-reasoner model points to DeepSeek-R1.
// (2) CoT (Chain of Thought) is the reasoning content deepseek-reasoner gives before output the final answer. For details, please refer to Reasoning Model。
// (3) If max_tokens is not specified, the default maximum output length is 4K. Please adjust max_tokens to support longer outputs.
// (4) Please check DeepSeek Context Caching for the details of Context Caching.
export interface ChatOptions {
  model?:
    | 'deepseek-chat'
    | 'deepseek-coder'
    | 'deepseek-pro'
    | 'deepseek-reasoner';
  useWebSearch?: boolean;
  temperature?: number;
  maxTokens?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly API_KEY = 'sk-bc96349a240d4d43b288183ac35e5958';
  private apiUrl = 'https://api.deepseek.com/v1/chat/completions';

  constructor(private http: HttpClient) {}

  sendMessage(
    messages: Message[],
    options: ChatOptions = {}
  ): Observable<ChatResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.API_KEY}`,
    });

    const payload = {
      model: options.model || 'deepseek-chat',
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      stream: false,
      web_search: options.useWebSearch || false,
    };

    return this.http.post<ChatResponse>(this.apiUrl, payload, { headers });
  }
}
