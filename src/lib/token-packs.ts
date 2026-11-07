export type TokenPack = {
  tokens: number;
  price: number;
};

export const TOKEN_PACKS: TokenPack[] = [
  { tokens: 45, price: 750 },
  { tokens: 90, price: 1500 },
  { tokens: 200, price: 3333 },
  { tokens: 400, price: 6666 },
  { tokens: 540, price: 9000 },
];

export function tokenPackByTokens(tokens: number) {
  return TOKEN_PACKS.find((pack) => pack.tokens === tokens) ?? null;
}

export function tokenPackByPrice(price: number) {
  return TOKEN_PACKS.find((pack) => pack.price === price) ?? null;
}
