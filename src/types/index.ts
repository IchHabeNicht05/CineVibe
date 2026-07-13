// Základní typ pro filmy v mřížce a Hero sekci
export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  genre_ids?: number[];
  
  // 👇 PŘIDÁNO PRO SERIÁLY 👇
  name?: string;
  first_air_date?: string;
}

// Typ pro produkční společnosti v detailu filmu
export interface ProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

// Rozšířený typ pro detailní stránku filmu (obsahuje navíc rozpočet, tržby atd.)
export interface MovieDetail {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  runtime: number;
  genres: { id: number; name: string }[];
  budget: number;
  revenue: number;
  status: string;
  production_companies: ProductionCompany[];
  
  // 👇 PŘIDÁNO PRO SERIÁLY (pro jistotu do budoucna) 👇
  name?: string;
  first_air_date?: string;
}