# 哪吒

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.0.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Deploy
首次部署
### 安装 Firebase CLI
npm install -g firebase-tools

### 登录 Firebase
firebase login

#### 初始化项目
firebase init
firebase.json
```
{
  "hosting": {
    "public": "dist/pwa-ai-tool/browser",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

#### 部署
firebase deploy

#### 访问地址
Project Console: https://console.firebase.google.com/project/pwa-ai-tool-3f555/overview
Hosting URL: https://pwa-ai-tool-3f555.web.app

#### 下次部署：
ng build --configuration production
firebase deploy

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
