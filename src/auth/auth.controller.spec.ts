import { Test, TestingModule } from '@nestjs/testing'; // NestJS의 테스트 유틸리티
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => { // 각 테스트가 실행되기 전에 실행되는 코드
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController], // 테스트할 컨트롤러를 주입
    }).compile();

    controller = module.get<AuthController>(AuthController); // 컨트롤러 인스턴스 생성
  });

  it('should be defined', () => { // 컨트롤러가 정의되어 있는지 확인하는 테스트
    expect(controller).toBeDefined();
  });
});
