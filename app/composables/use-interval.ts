export function useInterval(callback: () => void, delay: number | null) {
  onMounted(() => {
    if (delay === null) {
      return
    }

    const id = setInterval(callback, delay)

    onUnmounted(() => {
      clearInterval(id)
    })
  })
}
