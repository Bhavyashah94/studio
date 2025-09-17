import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string): ImagePlaceholder | undefined =>
  PlaceHolderImages.find((img) => img.id === id);

export type Certificate = {
  id: string;
  title: string;
  issuer: string;
  issuerLogoUrl: string;
  date: string;
  recipient: string;
  credentialId: string;
};

export type Issuer = {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Inactive';
  dateAdded: string;
  logoUrl: string;
};

export const mockCertificates: Certificate[] = [
  {
    id: 'cert-1',
    title: 'Advanced Blockchain Development',
    issuer: 'University of Innovation',
    issuerLogoUrl: getImage('issuer-logo-1')?.imageUrl || '',
    date: '2023-10-26',
    recipient: 'Alice Johnson',
    credentialId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  },
  {
    id: 'cert-2',
    title: 'Certified Cloud Practitioner',
    issuer: 'Tech Solutions Inc.',
    issuerLogoUrl: getImage('issuer-logo-2')?.imageUrl || '',
    date: '2023-09-15',
    recipient: 'Alice Johnson',
    credentialId: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1',
  },
  {
    id: 'cert-3',
    title: 'Professional Scrum Master I',
    issuer: 'Global Certifiers',
    issuerLogoUrl: getImage('issuer-logo-3')?.imageUrl || '',
    date: '2023-07-01',
    recipient: 'Alice Johnson',
    credentialId: 'c3d4e5f6-a7b8-9012-3456-7890abcdef12',
  },
];

export const mockIssuers: Issuer[] = [
  {
    id: 'issuer-1',
    name: 'University of Innovation',
    email: 'contact@u-innovate.edu',
    status: 'Active',
    dateAdded: '2022-01-15',
    logoUrl: getImage('issuer-logo-1')?.imageUrl || '',
  },
  {
    id: 'issuer-2',
    name: 'Tech Solutions Inc.',
    email: 'admin@techsolutions.com',
    status: 'Active',
    dateAdded: '2022-03-20',
    logoUrl: getImage('issuer-logo-2')?.imageUrl || '',
  },
  {
    id: 'issuer-3',
    name: 'Global Certifiers',
    email: 'verify@globalcerts.com',
    status: 'Inactive',
    dateAdded: '2022-05-10',
    logoUrl: getImage('issuer-logo-3')?.imageUrl || '',
  },
];

export const mockUser = {
  name: 'Alice Johnson',
  email: 'alice.j@email.com',
  avatarUrl: getImage('user-avatar')?.imageUrl || '',
};
