# Node.js 20.15.0 버전 사용
FROM node:20.15.0

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 환경 변수 파일 복사
COPY .env .env

# TypeScript 컴파일 (빌드 과정 로그 출력)
RUN npm run build && ls -la /app/dist

# 포트 설정 (NestJS 기본 포트는 3000입니다)
EXPOSE 3000

# 애플리케이션 실행
CMD ["node", "dist/src/main.js"]