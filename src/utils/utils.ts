export function getRandomSymbol(
  symbols: string[],
  usedSymbols: string[] = []
): string {
  const availableSymbols = symbols.filter(
    (symbol) => !usedSymbols.includes(symbol)
  );
  const randomIndex = Math.floor(Math.random() * availableSymbols.length);
  return availableSymbols[randomIndex];
}
