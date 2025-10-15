export type OwnerCandidate = {
  fullName?: string;
  taxCode?: string;
  emails?: string[];
  phones?: string[];
  address?: string;
  role?: 'primary' | 'secondary';
  startDate?: string;
  endDate?: string;
};
export type Visit = {
  visitedAt?: string;
  description: string;
  examsText?: string;
  prescriptionsText?: string;
  rawText?: string;
  attachments?: string[];
};
export type ParsedDoc = {
  owners: OwnerCandidate[];
  pets: Array<{
    name?: string;
    species?: string;
    breed?: string;
    sex?: string;
    dob?: string;
    color?: string;
    sterilized?: boolean;
    microchip?: string;
    visits: Visit[];
  }>;
  raw?: string;
};
