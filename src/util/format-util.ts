export function formatPrice(price: number) {
  if (!Number.isFinite(price)) return '-'
  return price.toLocaleString('ko-KR')
}
