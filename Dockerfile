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


# TypeScript 컴파일 (빌드 과정 로그 출력)
RUN npm run build && ls -la /app/dist

# ormconfig.ts를 dist 폴더로 복사
COPY src/ormconfig.ts ./dist/

# 포트 설정 (NestJS 기본 포트는 3000입니다)
EXPOSE 3000

# 시작 스크립트 복사 및 실행 권한 부여
COPY start.sh ./

# 마이그레이션 실행 후 애플리케이션 시작
CMD sh -c "NODE_ENV=production npm run migration:run:prod && node dist/main.js"