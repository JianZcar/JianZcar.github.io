export type Certificate = {
  image: string;
  title: string;
  issuer?: string;
};

export const CERTIFICATES: Certificate[] = [
  {
    image: "/img/cert1",
    title: "Problem Solving (Basic) Certificate",
    issuer: "HackerRank",
  },
  {
    image: "/img/cert2",
    title: "Python (Basic) Certificate",
    issuer: "HackerRank",
  },
  {
    image: "/img/cert3",
    title: "Rest API (Intermediate) Certificate",
    issuer: "HackerRank",
  },
];
