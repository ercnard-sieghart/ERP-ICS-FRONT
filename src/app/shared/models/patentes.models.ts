export interface Patente {
  id: string;
  nome?: string;
  label?: string;
  [key: string]: any;
}

export interface Usuario {
  id: string;
  nome?: string;
  login?: string;
  email?: string;
  [key: string]: any;
}
