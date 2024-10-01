import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('sample') // Swagger에서 'sample' 카테고리로 분류
@Controller('sample')
export class SampleController {
  @Get()
  @ApiOperation({ summary: 'Get sample data' }) // 엔드포인트에 대한 설명
  getSample() {
    return { message: 'This is a sample response' };
  }
}
