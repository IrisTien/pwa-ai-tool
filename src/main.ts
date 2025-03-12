import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';
import { ServiceWorkerModule } from '@angular/service-worker';
// 定义环境配置接口
interface Environment {
  production: boolean;
}

// 创建默认环境配置
export const environment: Environment = {
  production: false,
};

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideAnimations(),
    importProvidersFrom(
      MarkdownModule.forRoot(),
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: environment.production,
        registrationStrategy: 'registerWhenStable:30000',
      })
    ),
  ],
}).catch((err) => console.error(err));