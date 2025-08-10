import { ApiProperty } from '@nestjs/swagger';

export class DocumentFileResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab' })
  id: string;

  @ApiProperty({ example: 'file_1234567890ab.pdf' })
  fileName: string;

  @ApiProperty({ example: '/uploads/file_1234567890ab.pdf' })
  fileUrl: string;

  @ApiProperty({ example: 2048576 })
  fileSize: number;

  @ApiProperty({ example: 'application/pdf' })
  mimeType: string;
}
