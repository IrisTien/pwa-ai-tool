import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MarkdownModule } from 'ngx-markdown';
import { ChatService } from '../services/chat.service';
import { interval, take } from 'rxjs';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MarkdownModule,
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements AfterViewChecked {
  messages: Message[] = [];
  newMessage = '';
  loading = false;

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  constructor(private chatService: ChatService) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;

    const userMessage = this.newMessage;
    this.newMessage = ''; // 清空输入框

    // 添加用户消息
    this.messages.push({
      role: 'user',
      content: userMessage,
    });

    // 添加一个临时的 loading 消息
    const loadingMessageIndex = this.messages.length;
    this.messages.push({
      role: 'assistant',
      content: '正在思考中...',
    });
    this.loading = true;

    // 发送到 API
    this.chatService.sendMessage(this.messages.slice(0, -1)).subscribe({
      next: (response) => {
        if (response.choices && response.choices.length > 0) {
          const choice = response.choices[0];
          let finalContent = '';
          
          if (choice.message?.reasoning_content) {
            finalContent = `思考过程：\n${choice.message.reasoning_content}\n\n回答：\n${choice.message.content}`;
          } else {
            finalContent = choice.message.content;
          }

          // 设置初始空内容
          this.messages[loadingMessageIndex] = {
            role: 'assistant',
            content: ''
          };

          // 创建打字机效果
          const chars = finalContent.split('');
          interval(30).pipe(
            take(chars.length)
          ).subscribe({
            next: (index) => {
              this.messages[loadingMessageIndex].content += chars[index];
            },
            complete: () => {
              this.loading = false;
            }
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('发送消息失败:', error);
        // 发生错误时移除 loading 消息
        this.messages.splice(loadingMessageIndex, 1);
        this.loading = false;
      },
    });
  }
}
