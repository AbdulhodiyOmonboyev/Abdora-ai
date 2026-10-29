// Friendly Uzbek error messages for AI endpoints
export function friendlyAiErrorMessage(err) {
  const status = err?.response?.status;
  let serverMessage = err?.response?.data?.message || '';

  // If data is a string
  if (typeof err?.response?.data === 'string') {
    serverMessage = err.response.data;
  }

  // If server provided an explicit custom explanation, prioritize showing it
  if (serverMessage && !/internal server error|server xatosi/i.test(serverMessage)) {
    return serverMessage;
  }

  if (status === 429 || /quota|rate.?limit/i.test(serverMessage)) {
    return "AI xizmatining belgilangan limiti tugadi. Birozdan so'ng qayta urinib ko'ring.";
  }
  if (status === 401 || status === 403) {
    return "Ruxsat yo'q yoki API kaliti noto'g'ri sozланган.";
  }
  if (status >= 500) {
    return serverMessage || "AI xizmati hozircha javob bermayapti. Birozdan so'ng qayta urinib ko'ring.";
  }

  return serverMessage || "Nimadir noto'g'ri ketdi. Qayta urinib ko'ring.";
}
