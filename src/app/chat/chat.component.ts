import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MarkdownModule } from 'ngx-markdown';
import { ChatService } from '../services/chat.service';
import { interval, take } from 'rxjs';
import { MessageComponent } from './message/message.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressBarModule,
    MarkdownModule,
    MatIconModule, // 添加这一行
    MatTooltipModule,
    MessageComponent,
    WelcomeComponent,
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements AfterViewChecked {
  // messages: Message[] = [
  //   {
  //     role: 'user',
  //     content: 'hello',
  //   },
  //   {
  //     role: 'assistant',
  //     content: 'hello',
  //   },
  // ];
  messages: Message[] = [];
  newMessage = '';
  loading = false;
  selectedAssistantType = 'os'; // 默认选择 OS AI

  assistantTypes = [
    {
      value: 'os',
      name: 'OS AI',
      icon: 'smart_toy',
      description: '欢迎使用OS AI，专注于操作系统相关问题的综合智能助手',
    },
    {
      value: 'personal',
      name: '个人知识助手',
      icon: 'psychology',
      description:
        '私人知识助理，可以基于您的个人文件数据进行问答和内容生成，基于个人知识库的智能问答助手',
    },
  ];

  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  recognition: any;
  isListening = false;
  private speechSynthesis: SpeechSynthesis;
  private speechVoices: SpeechSynthesisVoice[] = [];
  isMuted = false;  // 添加静音状态控制

  constructor(private chatService: ChatService) {
    // 初始化语音识别
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.lang = 'zh-CN';

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.newMessage = transcript;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    }

    // 初始化语音合成
    this.speechSynthesis = window.speechSynthesis;
    // 加载可用的语音
    this.loadVoices();
    // 某些浏览器需要等待voices加载
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
    }
  }

  private loadVoices(): void {
    this.speechVoices = this.speechSynthesis.getVoices();
  }

  toggleVoiceInput() {
    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
    this.isListening = !this.isListening;
  }

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
            content: '',
          };

          const plainText = finalContent
            .replace(/```[\s\S]*?```/g, '') // 移除代码块
            .replace(/`([^`]+)`/g, '$1')    // 移除行内代码
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 移除链接，保留文字
            .replace(/[#*_~`]/g, '')        // 移除 markdown 标记
            .replace(/\n+/g, ' ')           // 多个换行替换为空格
            .trim();
          
          this.speakText(plainText);
          
          // 创建打字机效果
          const chars = finalContent.split('');
          interval(30)
            .pipe(take(chars.length))
            .subscribe({
              next: (index) => {
                this.messages[loadingMessageIndex].content += chars[index];
              },
              complete: () => {
                this.loading = false;
              },
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

  onAssistantTypeChange() {
    // 处理助手类型变更逻辑
    console.log('当前选择的助手类型：', this.selectedAssistantType);
  }

  getSelectedAssistantIcon(): string {
    const selectedType = this.assistantTypes.find(
      (type) => type.value === this.selectedAssistantType
    );
    return selectedType ? selectedType.icon : this.assistantTypes[0].icon;
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.speechSynthesis.cancel(); // 如果切换到静音，停止当前播放
    }
  }

  speakText(text: string): void {
    if (!this.speechSynthesis || this.isMuted) return;

    // 停止当前正在播放的语音
    this.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // iOS Safari 需要特殊处理
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      // iOS 上需要用户交互才能播放语音
      this.speechSynthesis.resume();
      utterance.volume = 1; // iOS 需要明确设置音量
    }

    // 设置中文语音
    const chineseVoice = this.speechVoices.find(
      (voice) => voice.lang.includes('zh') || voice.lang.includes('cmn')
    );
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // 添加错误处理
    utterance.onerror = (event) => {
      console.error('语音合成错误:', event);
    };

    this.speechSynthesis.speak(utterance);
  }
}
