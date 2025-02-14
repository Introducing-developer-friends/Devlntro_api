export const ErrorMessageType = {
  INVALID_AUTH: '인증 실패',
  INVALID_TOKEN: '토큰이 전송되지 않았거나 잘못 되었습니다.',
  EXPIRED_TOKEN: '토큰이 만료되었습니다.',
  UNAUTHORIZED_ACCESS: '접근 권한이 없습니다.',
  NO_USER: '사용자를 찾을 수 없습니다.',

  BAD_REQUEST: '잘못된 요청',
  NOT_EXIST_REQUESTER: '존재하지 않는 요청자입니다.',
  NOT_FOUND_COMMENT: '댓글을 찾을 수 없습니다.',
  SERVER_ERROR: '서버 내 예상하지 못한 에러가 발생했습니다.',

  NOT_FOUND_CONTACT: '해당 인맥을 찾을 수 없습니다.',
  NOT_FOUND_REQUEST: '해당 인맥 요청을 찾을 수 없습니다.',
  NOT_FOUND_REQUESTS: '인맥 요청 목록이 존재하지 않습니다.',
  CONTACT_ALREADY_EXISTS: '이미 인맥으로 등록된 사용자입니다.',

  NOT_FOUND_FEED: '해당 피드를 찾을 수 없습니다.',
  NOT_FOUND_POST: '해당 게시물을 찾을 수 없습니다.',
  NOT_FOUND_NOTIFICATION: '해당 알림을 찾을 수 없습니다.',
  NOT_FOUND_USER: '해당 사용자를 찾을 수 없습니다.',
  NOT_FOUND_PROFILE: '해당 프로필을 찾을 수 없습니다.',
  NOT_FOUND_PASSWORD: '해당 비밀번호를 찾을 수 없습니다.',

  EXISTING_USER_ID: '이미 존재하는 아이디입니다.',
  FAILED_LOGOUT: '로그아웃 처리에 실패했습니다.',
  ALREADY_LOGGED_OUT: '이미 로그아웃된 상태입니다.',
  PASSWORD_MISMATCH: '비밀번호와 확인 비밀번호가 일치하지 않습니다.',
} as const;

export type ErrorMessageEnumType =
  (typeof ErrorMessageType)[keyof typeof ErrorMessageType];
