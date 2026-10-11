import { io } from "socket.io-client";

export const connectSocket = () =>
  io(import.meta.env.VITE_API_URL, {
    auth: { token: localStorage.getItem("token") },
  });

// A short beep for new orders (browsers allow it after the user has clicked anything once)
export const beep = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.2;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    setTimeout(() => ctx.close(), 600);
  } catch {
    /* sound is optional */
  }
};