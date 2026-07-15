import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  // Nastavení automatického přesměrování ze starých URL na nové české verze
  async redirects() {
    return [
      {
        source: "/film",
        destination: "/filmy",
        permanent: true,
      },
      {
        source: "/film/:id",
        destination: "/filmy/:id",
        permanent: true,
      },
      {
        source: "/tv",
        destination: "/serialy",
        permanent: true,
      },
      {
        source: "/tv/:id",
        destination: "/serialy/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;