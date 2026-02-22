// Types for the design canvas system

export interface CanvasElement {
  id: string;
  type: 'text' | 'logo' | 'photo' | 'qr' | 'line' | 'shape';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  enabled: boolean;
  content: string;
  style: ElementStyle;
  locked?: boolean;
}

export interface ElementStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
}

export interface DesignConfig {
  orientation: 'portrait' | 'landscape';
  width: number;
  height: number;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  showBorder?: boolean;
  borderStyle?: 'solid' | 'double' | 'dashed';
  elements: CanvasElement[];
}

export interface CertificateDesignConfig extends DesignConfig {
  format: 'a4' | 'letter' | 'legal';
  title: string;
  headerText: string;
  bodyTemplate: string;
  footerText: string;
  signerName?: string;
  signerTitle?: string;
}

export interface CredentialDesignConfig extends DesignConfig {
  showPhoto: boolean;
  showQR: boolean;
  showRole: boolean;
  showAffiliation: boolean;
  showCountry: boolean;
  qrDataFields: string[];
}

export const defaultCertificateElements: CanvasElement[] = [
  {
    id: 'header-bar',
    type: 'shape',
    x: 0,
    y: 0,
    width: 100,
    height: 12,
    enabled: true,
    content: '',
    style: { backgroundColor: 'primary' }
  },
  {
    id: 'title',
    type: 'text',
    x: 50,
    y: 6,
    width: 80,
    height: 8,
    enabled: true,
    content: 'CERTIFICADO',
    style: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: 'white' }
  },
  {
    id: 'subtitle',
    type: 'text',
    x: 50,
    y: 10,
    width: 60,
    height: 4,
    enabled: true,
    content: 'DE PARTICIPACIÓN',
    style: { fontSize: 14, textAlign: 'center', color: 'white' }
  },
  {
    id: 'logo-header',
    type: 'logo',
    x: 10,
    y: 18,
    width: 15,
    height: 10,
    enabled: false,
    content: '',
    style: {}
  },
  {
    id: 'header-text',
    type: 'text',
    x: 50,
    y: 22,
    width: 80,
    height: 4,
    enabled: true,
    content: 'Se certifica que',
    style: { fontSize: 14, textAlign: 'center' }
  },
  {
    id: 'participant-name',
    type: 'text',
    x: 50,
    y: 30,
    width: 80,
    height: 6,
    enabled: true,
    content: '{{nombre}}',
    style: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: 'primary' }
  },
  {
    id: 'body-text',
    type: 'text',
    x: 50,
    y: 40,
    width: 80,
    height: 4,
    enabled: true,
    content: 'ha participado en el evento',
    style: { fontSize: 14, textAlign: 'center' }
  },
  {
    id: 'event-name',
    type: 'text',
    x: 50,
    y: 48,
    width: 80,
    height: 6,
    enabled: true,
    content: '{{evento}}',
    style: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: 'primary' }
  },
  {
    id: 'event-date',
    type: 'text',
    x: 50,
    y: 56,
    width: 80,
    height: 4,
    enabled: true,
    content: '{{fecha}}',
    style: { fontSize: 12, textAlign: 'center', color: 'muted' }
  },
  {
    id: 'logo-body',
    type: 'logo',
    x: 50,
    y: 65,
    width: 20,
    height: 12,
    enabled: false,
    content: '',
    style: {}
  },
  {
    id: 'signature-line',
    type: 'line',
    x: 50,
    y: 75,
    width: 30,
    height: 1,
    enabled: true,
    content: '',
    style: { backgroundColor: 'muted' }
  },
  {
    id: 'signer-name',
    type: 'text',
    x: 50,
    y: 78,
    width: 40,
    height: 4,
    enabled: true,
    content: '{{firmante}}',
    style: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' }
  },
  {
    id: 'signer-title',
    type: 'text',
    x: 50,
    y: 82,
    width: 40,
    height: 3,
    enabled: true,
    content: '{{cargo}}',
    style: { fontSize: 10, textAlign: 'center', color: 'muted' }
  },
  {
    id: 'footer-bar',
    type: 'shape',
    x: 0,
    y: 92,
    width: 100,
    height: 8,
    enabled: true,
    content: '',
    style: { backgroundColor: 'primary' }
  },
  {
    id: 'footer-text',
    type: 'text',
    x: 50,
    y: 96,
    width: 90,
    height: 3,
    enabled: true,
    content: 'Este certificado ha sido generado electrónicamente y es válido sin firma.',
    style: { fontSize: 9, textAlign: 'center', color: 'white' }
  },
  {
    id: 'qr-code',
    type: 'qr',
    x: 90,
    y: 85,
    width: 8,
    height: 8,
    enabled: false,
    content: '',
    style: {}
  }
];

export const defaultCredentialElements: CanvasElement[] = [
  {
    id: 'header-bar',
    type: 'shape',
    x: 0,
    y: 0,
    width: 100,
    height: 20,
    enabled: true,
    content: '',
    style: { backgroundColor: 'primary' }
  },
  {
    id: 'event-name',
    type: 'text',
    x: 50,
    y: 10,
    width: 90,
    height: 15,
    enabled: true,
    content: '{{evento}}',
    style: { fontSize: 10, fontWeight: 'bold', textAlign: 'center', color: 'white' }
  },
  {
    id: 'logo',
    type: 'logo',
    x: 85,
    y: 5,
    width: 12,
    height: 12,
    enabled: false,
    content: '',
    style: {}
  },
  {
    id: 'photo',
    type: 'photo',
    x: 50,
    y: 35,
    width: 35,
    height: 30,
    enabled: true,
    content: '',
    style: { borderRadius: 4 }
  },
  {
    id: 'participant-name',
    type: 'text',
    x: 50,
    y: 70,
    width: 90,
    height: 8,
    enabled: true,
    content: '{{nombre}}',
    style: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' }
  },
  {
    id: 'role-badge',
    type: 'text',
    x: 50,
    y: 78,
    width: 40,
    height: 6,
    enabled: true,
    content: '{{rol}}',
    style: { fontSize: 9, textAlign: 'center', color: 'white', backgroundColor: 'secondary', borderRadius: 4, padding: 2 }
  },
  {
    id: 'affiliation',
    type: 'text',
    x: 50,
    y: 85,
    width: 90,
    height: 5,
    enabled: true,
    content: '{{afiliacion}}',
    style: { fontSize: 8, textAlign: 'center', color: 'muted' }
  },
  {
    id: 'country',
    type: 'text',
    x: 50,
    y: 90,
    width: 50,
    height: 4,
    enabled: false,
    content: '{{pais}}',
    style: { fontSize: 7, textAlign: 'center', color: 'muted' }
  },
  {
    id: 'qr-code',
    type: 'qr',
    x: 85,
    y: 78,
    width: 18,
    height: 18,
    enabled: true,
    content: '',
    style: {}
  },
  {
    id: 'footer-bar',
    type: 'shape',
    x: 0,
    y: 95,
    width: 100,
    height: 5,
    enabled: true,
    content: '',
    style: { backgroundColor: 'primary' }
  },
  {
    id: 'credential-id',
    type: 'text',
    x: 10,
    y: 97.5,
    width: 30,
    height: 3,
    enabled: true,
    content: '{{id}}',
    style: { fontSize: 6, textAlign: 'left', color: 'white' }
  }
];
