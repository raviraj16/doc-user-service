import { DocumentStatus } from './document-status.enum';

describe('DocumentStatus Enum', () => {
  it('should define correct status values', () => {
    expect(DocumentStatus.UPLOADED).toBe(0);
    expect(DocumentStatus.INGESTING).toBe(1);
    expect(DocumentStatus.INGESTED).toBe(2);
    expect(DocumentStatus.FAILED).toBe(3);
    expect(DocumentStatus.DELETED).toBe(4);
  });

  it('should have exactly five statuses defined', () => {
    // Object.keys gives string keys, so we filter to only numeric ones
    const numericKeys = Object.keys(DocumentStatus).filter(key => !isNaN(Number(key)));
    expect(numericKeys.length).toBe(5);
  });
});
