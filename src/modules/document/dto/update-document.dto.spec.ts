import { UpdateDocumentDto } from './update-document.dto';

describe('UpdateDocumentDto', () => {
  it('should be defined', () => {
    const dto = new UpdateDocumentDto();
    expect(dto).toBeDefined();
  });

  it('should have partial properties of CreateDocumentDto', () => {
    const dto = new UpdateDocumentDto();
    dto.title = 'Updated Title';
    dto.description = 'Updated Description';
    dto.tags = ['updated', 'tag'];
    
    expect(dto.title).toBe('Updated Title');
    expect(dto.description).toBe('Updated Description');
    expect(dto.tags).toEqual(['updated', 'tag']);
  });
});
